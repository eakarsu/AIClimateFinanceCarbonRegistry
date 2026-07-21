'use strict';

const crypto = require('node:crypto');

const ROLES = Object.freeze({
  create: ['admin', 'registrar'],
  measure: ['admin', 'registrar'],
  verify: ['auditor'],
  issue: ['admin', 'registrar'],
  retire: ['admin', 'registrar'],
});

const ALLOWED_UNITS = new Set(['tCO2e', 'kgCO2e']);

function fail(message) {
  const error = new Error(message);
  error.statusCode = 422;
  throw error;
}

function requiredString(value, field, max = 255) {
  if (typeof value !== 'string' || !value.trim()) fail(`${field} is required`);
  if (value.trim().length > max) fail(`${field} exceeds ${max} characters`);
  return value.trim();
}

function numberInRange(value, field, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    fail(`${field} must be between ${min} and ${max}`);
  }
  return number;
}

function sha256(value, field) {
  const normalized = requiredString(value, field, 64).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) fail(`${field} must be a SHA-256 hex digest`);
  return normalized;
}

function normalizeProject(input = {}) {
  return {
    projectKey: requiredString(input.projectKey, 'projectKey', 80),
    name: requiredString(input.name, 'name'),
    methodologyCode: requiredString(input.methodologyCode, 'methodologyCode', 80),
    methodologyVersion: requiredString(input.methodologyVersion, 'methodologyVersion', 40),
    jurisdictionCode: requiredString(input.jurisdictionCode, 'jurisdictionCode', 40).toUpperCase(),
    baselineTco2e: numberInRange(input.baselineTco2e, 'baselineTco2e', 0, 1e12),
    additionalityEvidenceSha256: sha256(input.additionalityEvidenceSha256, 'additionalityEvidenceSha256'),
    leakagePct: numberInRange(input.leakagePct, 'leakagePct', 0, 100),
    permanenceBufferPct: numberInRange(input.permanenceBufferPct, 'permanenceBufferPct', 0, 100),
  };
}

function normalizeMeasurement(input = {}, methodologyVersion) {
  const unit = requiredString(input.unit, 'unit', 20);
  if (!ALLOWED_UNITS.has(unit)) fail('unit must be tCO2e or kgCO2e');
  const amount = numberInRange(input.amount, 'amount', 0.000001, 1e12);
  const measuredAt = new Date(input.measuredAt);
  if (Number.isNaN(measuredAt.getTime()) || measuredAt > new Date()) fail('measuredAt must be a valid non-future timestamp');
  const suppliedMethodologyVersion = requiredString(input.methodologyVersion, 'methodologyVersion', 40);
  if (suppliedMethodologyVersion !== methodologyVersion) fail('measurement methodologyVersion does not match project');
  return {
    sourceRecordId: requiredString(input.sourceRecordId, 'sourceRecordId', 160),
    sourceSha256: sha256(input.sourceSha256, 'sourceSha256'),
    datasetVersion: requiredString(input.datasetVersion, 'datasetVersion', 80),
    methodologyVersion: suppliedMethodologyVersion,
    amountTco2e: unit === 'kgCO2e' ? amount / 1000 : amount,
    unit,
    uncertaintyPct: numberInRange(input.uncertaintyPct, 'uncertaintyPct', 0, 100),
    measuredAt,
  };
}

function conservativeEligibleTco2e(measurements, project) {
  if (!Array.isArray(measurements) || measurements.length === 0) fail('at least one measurement is required');
  const uncertaintyAdjusted = measurements.reduce(
    (sum, row) => sum + Number(row.amount_tco2e) * (1 - Number(row.uncertainty_pct) / 100),
    0
  );
  const aboveBaseline = Math.max(0, uncertaintyAdjusted - Number(project.baseline_tco2e));
  const afterLeakage = aboveBaseline * (1 - Number(project.leakage_pct) / 100);
  return Number((afterLeakage * (1 - Number(project.permanence_buffer_pct) / 100)).toFixed(6));
}

function assertRole(user, allowed) {
  if (!user || !allowed.includes(user.role)) {
    const error = new Error(`requires role: ${allowed.join(', ')}`);
    error.statusCode = 403;
    throw error;
  }
}

function eventHash(previousHash, event) {
  return crypto.createHash('sha256').update(`${previousHash || ''}|${JSON.stringify(event)}`).digest('hex');
}

module.exports = { ROLES, normalizeProject, normalizeMeasurement, conservativeEligibleTco2e, assertRole, eventHash };
