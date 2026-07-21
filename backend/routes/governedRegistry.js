'use strict';

const express = require('express');
const pool = require('../config/database');
const workflow = require('../services/registryWorkflow');

const router = express.Router();

function actor(req) {
  return { id: Number(req.user.id), tenantId: req.user.tenant_id, role: req.user.role };
}

async function appendEvent(client, user, aggregateType, aggregateId, eventType, payload) {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [user.tenantId]);
  const previous = await client.query(
    'SELECT event_hash FROM registry_events WHERE tenant_id=$1 ORDER BY id DESC LIMIT 1',
    [user.tenantId]
  );
  const event = { aggregateType, aggregateId, eventType, actorId: user.id, payload, occurredAt: new Date().toISOString() };
  const previousHash = previous.rows[0]?.event_hash || null;
  const eventHash = workflow.eventHash(previousHash, event);
  await client.query(
    `INSERT INTO registry_events
      (tenant_id, aggregate_type, aggregate_id, event_type, actor_user_id, payload, previous_hash, event_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [user.tenantId, aggregateType, String(aggregateId), eventType, user.id, event, previousHash, eventHash]
  );
}

async function transaction(handler) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

router.post('/projects', async (req, res, next) => {
  try {
    const user = actor(req);
    workflow.assertRole(user, workflow.ROLES.create);
    const value = workflow.normalizeProject(req.body);
    const row = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO governed_registry_projects
          (tenant_id, project_key, name, methodology_code, methodology_version, jurisdiction_code,
           baseline_tco2e, additionality_evidence_sha256, leakage_pct, permanence_buffer_pct, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [user.tenantId, value.projectKey, value.name, value.methodologyCode, value.methodologyVersion,
          value.jurisdictionCode, value.baselineTco2e, value.additionalityEvidenceSha256,
          value.leakagePct, value.permanenceBufferPct, user.id]
      );
      await appendEvent(client, user, 'project', result.rows[0].id, 'project.registered', value);
      return result.rows[0];
    });
    res.status(201).json(row);
  } catch (error) { next(error); }
});

router.post('/projects/:id/measurements', async (req, res, next) => {
  try {
    const user = actor(req);
    workflow.assertRole(user, workflow.ROLES.measure);
    const row = await transaction(async (client) => {
      const projectResult = await client.query(
        'SELECT * FROM governed_registry_projects WHERE id=$1 AND tenant_id=$2 FOR UPDATE',
        [req.params.id, user.tenantId]
      );
      const project = projectResult.rows[0];
      if (!project) return null;
      if (!['draft', 'measuring'].includes(project.status)) {
        const error = new Error('measurements are locked after verification submission'); error.statusCode = 409; throw error;
      }
      const value = workflow.normalizeMeasurement(req.body, project.methodology_version);
      const result = await client.query(
        `INSERT INTO registry_measurements
          (tenant_id, project_id, source_record_id, source_sha256, dataset_version, methodology_version,
           amount_tco2e, original_unit, uncertainty_pct, measured_at, captured_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (tenant_id, source_record_id) DO NOTHING RETURNING *`,
        [user.tenantId, project.id, value.sourceRecordId, value.sourceSha256, value.datasetVersion,
          value.methodologyVersion, value.amountTco2e, value.unit, value.uncertaintyPct, value.measuredAt, user.id]
      );
      if (!result.rows[0]) { const error = new Error('sourceRecordId already ingested'); error.statusCode = 409; throw error; }
      await client.query("UPDATE governed_registry_projects SET status='measuring', updated_at=NOW() WHERE id=$1", [project.id]);
      await appendEvent(client, user, 'project', project.id, 'measurement.recorded', value);
      return result.rows[0];
    });
    if (!row) return res.status(404).json({ error: 'project_not_found' });
    res.status(201).json(row);
  } catch (error) { next(error); }
});

router.post('/projects/:id/submit-verification', async (req, res, next) => {
  try {
    const user = actor(req);
    workflow.assertRole(user, workflow.ROLES.measure);
    const row = await transaction(async (client) => {
      const projectResult = await client.query(
        'SELECT * FROM governed_registry_projects WHERE id=$1 AND tenant_id=$2 FOR UPDATE',
        [req.params.id, user.tenantId]
      );
      const project = projectResult.rows[0];
      if (!project) return null;
      if (!['draft', 'measuring'].includes(project.status)) { const e = new Error('project is not open for verification'); e.statusCode = 409; throw e; }
      const measurements = (await client.query(
        'SELECT * FROM registry_measurements WHERE tenant_id=$1 AND project_id=$2 ORDER BY id',
        [user.tenantId, project.id]
      )).rows;
      const eligible = workflow.conservativeEligibleTco2e(measurements, project);
      if (eligible <= 0) { const e = new Error('conservative eligible amount is zero'); e.statusCode = 422; throw e; }
      const evidenceSha256 = workflow.normalizeMeasurement({
        sourceRecordId: 'verification', sourceSha256: req.body.evidenceSha256,
        datasetVersion: 'verification', methodologyVersion: project.methodology_version,
        amount: 1, unit: 'tCO2e', uncertaintyPct: 0, measuredAt: new Date(0).toISOString(),
      }, project.methodology_version).sourceSha256;
      const result = await client.query(
        `INSERT INTO registry_verifications
          (tenant_id, project_id, submitted_by, evidence_sha256, eligible_tco2e)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [user.tenantId, project.id, user.id, evidenceSha256, eligible]
      );
      await client.query("UPDATE governed_registry_projects SET status='verification_pending', updated_at=NOW() WHERE id=$1", [project.id]);
      await appendEvent(client, user, 'project', project.id, 'verification.submitted', { verificationId: result.rows[0].id, eligibleTco2e: eligible, evidenceSha256 });
      return result.rows[0];
    });
    if (!row) return res.status(404).json({ error: 'project_not_found' });
    res.status(201).json(row);
  } catch (error) { next(error); }
});

router.post('/verifications/:id/decision', async (req, res, next) => {
  try {
    const user = actor(req);
    workflow.assertRole(user, workflow.ROLES.verify);
    const decision = String(req.body.decision || '').toLowerCase();
    if (!['approved', 'rejected'].includes(decision)) return res.status(422).json({ error: 'decision must be approved or rejected' });
    if (typeof req.body.rationale !== 'string' || req.body.rationale.trim().length < 10) return res.status(422).json({ error: 'rationale must contain at least 10 characters' });
    const row = await transaction(async (client) => {
      const found = await client.query(
        'SELECT * FROM registry_verifications WHERE id=$1 AND tenant_id=$2 FOR UPDATE',
        [req.params.id, user.tenantId]
      );
      const verification = found.rows[0];
      if (!verification) return null;
      if (verification.status !== 'pending') { const e = new Error('verification already decided'); e.statusCode = 409; throw e; }
      if (Number(verification.submitted_by) === user.id) { const e = new Error('verifier must be independent from submitter'); e.statusCode = 403; throw e; }
      const result = await client.query(
        `UPDATE registry_verifications SET status=$1, verifier_user_id=$2, rationale=$3, decided_at=NOW()
         WHERE id=$4 RETURNING *`, [decision, user.id, req.body.rationale.trim(), verification.id]
      );
      await client.query(
        'UPDATE governed_registry_projects SET status=$1, updated_at=NOW() WHERE id=$2',
        [decision === 'approved' ? 'verified' : 'verification_rejected', verification.project_id]
      );
      await appendEvent(client, user, 'project', verification.project_id, `verification.${decision}`, { verificationId: verification.id, rationale: req.body.rationale.trim() });
      return result.rows[0];
    });
    if (!row) return res.status(404).json({ error: 'verification_not_found' });
    res.json(row);
  } catch (error) { next(error); }
});

router.post('/projects/:id/issuances', async (req, res, next) => {
  try {
    const user = actor(req);
    workflow.assertRole(user, workflow.ROLES.issue);
    const vintageYear = Number(req.body.vintageYear);
    if (!Number.isInteger(vintageYear) || vintageYear < 1990 || vintageYear > new Date().getUTCFullYear()) return res.status(422).json({ error: 'invalid vintageYear' });
    const row = await transaction(async (client) => {
      const found = await client.query('SELECT * FROM governed_registry_projects WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, user.tenantId]);
      const project = found.rows[0];
      if (!project) return null;
      if (project.status !== 'verified') { const e = new Error('only a verified project may issue credits'); e.statusCode = 409; throw e; }
      const verification = (await client.query(
        "SELECT * FROM registry_verifications WHERE project_id=$1 AND tenant_id=$2 AND status='approved' ORDER BY decided_at DESC LIMIT 1",
        [project.id, user.tenantId]
      )).rows[0];
      const amount = Number(req.body.amountTco2e);
      if (!Number.isFinite(amount) || amount <= 0 || amount > Number(verification.eligible_tco2e)) { const e = new Error('amountTco2e exceeds verified eligible amount'); e.statusCode = 422; throw e; }
      const serialPrefix = `${user.tenantId}-${project.project_key}-${vintageYear}`;
      const result = await client.query(
        `INSERT INTO registry_credit_lots
          (tenant_id, project_id, verification_id, serial_prefix, vintage_year, issued_tco2e, issued_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [user.tenantId, project.id, verification.id, serialPrefix, vintageYear, amount, user.id]
      );
      await client.query("UPDATE governed_registry_projects SET status='issued', updated_at=NOW() WHERE id=$1", [project.id]);
      await appendEvent(client, user, 'credit_lot', result.rows[0].id, 'credits.issued', { amountTco2e: amount, serialPrefix, verificationId: verification.id });
      return result.rows[0];
    });
    if (!row) return res.status(404).json({ error: 'project_not_found' });
    res.status(201).json(row);
  } catch (error) { next(error); }
});

router.post('/credit-lots/:id/retirements', async (req, res, next) => {
  try {
    const user = actor(req);
    workflow.assertRole(user, workflow.ROLES.retire);
    const amount = Number(req.body.amountTco2e);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(422).json({ error: 'amountTco2e must be positive' });
    if (typeof req.body.beneficiary !== 'string' || !req.body.beneficiary.trim()) return res.status(422).json({ error: 'beneficiary is required' });
    const row = await transaction(async (client) => {
      const found = await client.query('SELECT * FROM registry_credit_lots WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, user.tenantId]);
      const lot = found.rows[0];
      if (!lot) return null;
      const retired = Number((await client.query(
        'SELECT COALESCE(SUM(amount_tco2e),0) amount FROM registry_retirements WHERE credit_lot_id=$1 AND tenant_id=$2',
        [lot.id, user.tenantId]
      )).rows[0].amount);
      if (retired + amount > Number(lot.issued_tco2e)) { const e = new Error('retirement exceeds unretired balance'); e.statusCode = 409; throw e; }
      const result = await client.query(
        `INSERT INTO registry_retirements
          (tenant_id, credit_lot_id, amount_tco2e, beneficiary, purpose, retired_by)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [user.tenantId, lot.id, amount, req.body.beneficiary.trim(), String(req.body.purpose || '').trim() || null, user.id]
      );
      await appendEvent(client, user, 'credit_lot', lot.id, 'credits.retired', { retirementId: result.rows[0].id, amountTco2e: amount, beneficiary: req.body.beneficiary.trim() });
      return { ...result.rows[0], remaining_tco2e: Number(lot.issued_tco2e) - retired - amount };
    });
    if (!row) return res.status(404).json({ error: 'credit_lot_not_found' });
    res.status(201).json(row);
  } catch (error) { next(error); }
});

router.get('/projects/:id/evidence', async (req, res, next) => {
  try {
    const user = actor(req);
    const project = (await pool.query('SELECT * FROM governed_registry_projects WHERE id=$1 AND tenant_id=$2', [req.params.id, user.tenantId])).rows[0];
    if (!project) return res.status(404).json({ error: 'project_not_found' });
    const [measurements, verifications, lots, events] = await Promise.all([
      pool.query('SELECT * FROM registry_measurements WHERE project_id=$1 AND tenant_id=$2 ORDER BY id', [project.id, user.tenantId]),
      pool.query('SELECT * FROM registry_verifications WHERE project_id=$1 AND tenant_id=$2 ORDER BY id', [project.id, user.tenantId]),
      pool.query('SELECT * FROM registry_credit_lots WHERE project_id=$1 AND tenant_id=$2 ORDER BY id', [project.id, user.tenantId]),
      pool.query("SELECT * FROM registry_events WHERE tenant_id=$1 AND aggregate_id=$2 AND aggregate_type='project' ORDER BY id", [user.tenantId, String(project.id)]),
    ]);
    res.json({ project, measurements: measurements.rows, verifications: verifications.rows, creditLots: lots.rows, events: events.rows });
  } catch (error) { next(error); }
});

router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === '23505') return res.status(409).json({ error: 'duplicate_record' });
  console.error('[governed-registry]', error.message);
  res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'registry_workflow_failed' });
});

module.exports = router;
