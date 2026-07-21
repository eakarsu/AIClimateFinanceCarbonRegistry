'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const workflow = require('../services/registryWorkflow');
const digest = 'a'.repeat(64);

test('normalizes kgCO2e and rejects methodology mismatch', () => {
  const value = workflow.normalizeMeasurement({ sourceRecordId: 'sensor-1', sourceSha256: digest,
    datasetVersion: 'lab-2026.1', methodologyVersion: '2.0', amount: 2500,
    unit: 'kgCO2e', uncertaintyPct: 10, measuredAt: '2025-01-01T00:00:00Z' }, '2.0');
  assert.equal(value.amountTco2e, 2.5);
  assert.throws(() => workflow.normalizeMeasurement({ sourceRecordId: 'x', sourceSha256: digest,
    datasetVersion: 'v', methodologyVersion: '1.0', amount: 1, unit: 'tCO2e',
    uncertaintyPct: 0, measuredAt: '2025-01-01' }, '2.0'), /does not match/);
});
test('calculates conservative eligible credits', () => {
  assert.equal(workflow.conservativeEligibleTco2e([{ amount_tco2e: 120, uncertainty_pct: 10 }],
    { baseline_tco2e: 8, leakage_pct: 10, permanence_buffer_pct: 20 }), 72);
});
test('rejects invalid evidence and enforces verifier role', () => {
  assert.throws(() => workflow.normalizeProject({ projectKey: 'p', name: 'P', methodologyCode: 'M',
    methodologyVersion: '1', jurisdictionCode: 'US', baselineTco2e: 0,
    additionalityEvidenceSha256: 'bad', leakagePct: 0, permanenceBufferPct: 0 }), /SHA-256/);
  assert.throws(() => workflow.assertRole({ role: 'registrar' }, workflow.ROLES.verify), /requires role/);
});
test('event hashes are deterministic and chained', () => {
  const first = workflow.eventHash(null, { event: 'registered' });
  const second = workflow.eventHash(first, { event: 'verified' });
  assert.match(first, /^[a-f0-9]{64}$/); assert.notEqual(first, second);
  assert.equal(second, workflow.eventHash(first, { event: 'verified' }));
});
