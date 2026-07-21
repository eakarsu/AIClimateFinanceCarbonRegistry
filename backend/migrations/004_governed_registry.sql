-- Governed, tenant-scoped carbon lifecycle. Apply with `npm run migrate`.
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(80);
ALTER TABLE users ALTER COLUMN tenant_id SET DEFAULT 'default';
UPDATE users SET tenant_id='default' WHERE tenant_id IS NULL;
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;

CREATE TABLE IF NOT EXISTS governed_registry_projects (
  id BIGSERIAL PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  project_key VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  methodology_code VARCHAR(80) NOT NULL,
  methodology_version VARCHAR(40) NOT NULL,
  jurisdiction_code VARCHAR(40) NOT NULL,
  baseline_tco2e NUMERIC(20,6) NOT NULL CHECK (baseline_tco2e >= 0),
  additionality_evidence_sha256 CHAR(64) NOT NULL,
  leakage_pct NUMERIC(6,3) NOT NULL CHECK (leakage_pct BETWEEN 0 AND 100),
  permanence_buffer_pct NUMERIC(6,3) NOT NULL CHECK (permanence_buffer_pct BETWEEN 0 AND 100),
  status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','measuring','verification_pending','verification_rejected','verified','issued')),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, project_key)
);

CREATE TABLE IF NOT EXISTS registry_measurements (
  id BIGSERIAL PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  project_id BIGINT NOT NULL REFERENCES governed_registry_projects(id),
  source_record_id VARCHAR(160) NOT NULL,
  source_sha256 CHAR(64) NOT NULL,
  dataset_version VARCHAR(80) NOT NULL,
  methodology_version VARCHAR(40) NOT NULL,
  amount_tco2e NUMERIC(20,6) NOT NULL CHECK (amount_tco2e > 0),
  original_unit VARCHAR(20) NOT NULL,
  uncertainty_pct NUMERIC(6,3) NOT NULL CHECK (uncertainty_pct BETWEEN 0 AND 100),
  measured_at TIMESTAMPTZ NOT NULL,
  captured_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, source_record_id)
);

CREATE TABLE IF NOT EXISTS registry_verifications (
  id BIGSERIAL PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  project_id BIGINT NOT NULL REFERENCES governed_registry_projects(id),
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  verifier_user_id INTEGER REFERENCES users(id),
  evidence_sha256 CHAR(64) NOT NULL,
  eligible_tco2e NUMERIC(20,6) NOT NULL CHECK (eligible_tco2e > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rationale TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  CHECK (verifier_user_id IS NULL OR verifier_user_id <> submitted_by)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_registry_one_pending_verification
  ON registry_verifications(tenant_id, project_id) WHERE status='pending';

CREATE TABLE IF NOT EXISTS registry_credit_lots (
  id BIGSERIAL PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  project_id BIGINT NOT NULL REFERENCES governed_registry_projects(id),
  verification_id BIGINT NOT NULL UNIQUE REFERENCES registry_verifications(id),
  serial_prefix VARCHAR(240) NOT NULL,
  vintage_year INTEGER NOT NULL,
  issued_tco2e NUMERIC(20,6) NOT NULL CHECK (issued_tco2e > 0),
  issued_by INTEGER NOT NULL REFERENCES users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, serial_prefix)
);

CREATE TABLE IF NOT EXISTS registry_retirements (
  id BIGSERIAL PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  credit_lot_id BIGINT NOT NULL REFERENCES registry_credit_lots(id),
  amount_tco2e NUMERIC(20,6) NOT NULL CHECK (amount_tco2e > 0),
  beneficiary VARCHAR(255) NOT NULL,
  purpose TEXT,
  retired_by INTEGER NOT NULL REFERENCES users(id),
  retired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registry_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  aggregate_type VARCHAR(40) NOT NULL,
  aggregate_id VARCHAR(80) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  actor_user_id INTEGER NOT NULL REFERENCES users(id),
  payload JSONB NOT NULL,
  previous_hash CHAR(64),
  event_hash CHAR(64) NOT NULL UNIQUE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registry_project_tenant ON governed_registry_projects(tenant_id, id);
CREATE INDEX IF NOT EXISTS idx_registry_events_tenant_aggregate ON registry_events(tenant_id, aggregate_type, aggregate_id, id);

CREATE OR REPLACE FUNCTION prevent_registry_event_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'registry_events is append-only'; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS registry_events_immutable ON registry_events;
CREATE TRIGGER registry_events_immutable BEFORE UPDATE OR DELETE ON registry_events
FOR EACH ROW EXECUTE FUNCTION prevent_registry_event_mutation();
