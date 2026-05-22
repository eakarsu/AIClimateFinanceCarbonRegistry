// Append-only hash-chain over the issuance ledger (Pass 7 — NEEDS-PRODUCT-DECISION).
//
// Each new entry chains to the previous entry's SHA-256 hash, forming an
// auditable Merkle-style chain. Existing entries are immutable; the chain is
// derived from the canonical `issuances` table by sealing rows in order.
//
// Endpoints:
//   GET  /                — full chain
//   POST /seal            — seal any unsealed issuances; appends new chain rows
//   GET  /verify          — recompute chain and verify integrity
//   GET  /head            — current chain length + head hash
//
// No new deps: uses built-in `crypto`.

const express = require('express');
const crypto = require('crypto');
const pool = require('../config/database');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

function rowHash(prev, row) {
  const canonical = JSON.stringify({
    issuance_id: row.issuance_id,
    project: row.project,
    vintage_year: row.vintage_year,
    tons_issued: row.tons_issued,
    methodology: row.methodology,
    issued_by: row.issued_by,
    issued_at: row.issued_at,
    prev_hash: prev || '',
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

router.get('/', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, issuance_id, project, vintage_year, tons_issued, methodology, issued_by, issued_at, prev_hash, hash, sealed_at
         FROM issuance_hash_chain
         ORDER BY id ASC`
    );
    res.json({ length: r.rows.length, head: r.rows.length ? r.rows[r.rows.length - 1].hash : null, chain: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/head', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS n, MAX(hash) FILTER (WHERE id = (SELECT MAX(id) FROM issuance_hash_chain)) AS head FROM issuance_hash_chain`);
    res.json({ length: r.rows[0].n, head: r.rows[0].head });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/seal', requireRole('admin', 'registrar'), async (req, res) => {
  try {
    const sealed = await pool.query(`SELECT issuance_id FROM issuance_hash_chain`);
    const sealedSet = new Set(sealed.rows.map((r) => r.issuance_id));
    const last = await pool.query(`SELECT hash FROM issuance_hash_chain ORDER BY id DESC LIMIT 1`);
    let prev = last.rows.length ? last.rows[0].hash : null;

    const unsealed = await pool.query(
      `SELECT issuance_id, project, vintage_year, tons_issued, methodology, issued_by, issued_at
         FROM issuances
         ORDER BY id ASC`
    );
    const appended = [];
    for (const row of unsealed.rows) {
      if (sealedSet.has(row.issuance_id)) continue;
      const h = rowHash(prev, row);
      await pool.query(
        `INSERT INTO issuance_hash_chain
            (issuance_id, project, vintage_year, tons_issued, methodology, issued_by, issued_at, prev_hash, hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [row.issuance_id, row.project, row.vintage_year, row.tons_issued, row.methodology, row.issued_by, row.issued_at, prev, h]
      );
      appended.push({ issuance_id: row.issuance_id, hash: h });
      prev = h;
    }
    res.json({ appended_count: appended.length, head: prev, appended });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/verify', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, issuance_id, project, vintage_year, tons_issued, methodology, issued_by, issued_at, prev_hash, hash
         FROM issuance_hash_chain
         ORDER BY id ASC`
    );
    let prev = null;
    const breaks = [];
    for (const row of r.rows) {
      const expected = rowHash(prev, row);
      if (row.prev_hash !== prev) breaks.push({ id: row.id, kind: 'prev_hash_mismatch', expected: prev, actual: row.prev_hash });
      if (expected !== row.hash) breaks.push({ id: row.id, kind: 'hash_mismatch', expected, actual: row.hash });
      prev = row.hash;
    }
    res.json({ length: r.rows.length, head: prev, valid: breaks.length === 0, breaks });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
