-- ============================================================
-- AIClimateFinanceCarbonRegistry - Schema
-- 001_schema.sql
-- ============================================================

-- Projects: registered carbon projects
CREATE TABLE IF NOT EXISTS projects (
  id              SERIAL PRIMARY KEY,
  project_id      VARCHAR(64) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  type            VARCHAR(80)  NOT NULL,
  country         VARCHAR(120) NOT NULL,
  hectares        NUMERIC(12,2) DEFAULT 0,
  status          VARCHAR(40)  DEFAULT 'pending',
  description     TEXT,
  developer       VARCHAR(255),
  registered_at   TIMESTAMPTZ  DEFAULT NOW(),
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- Credits: issued tCO2e credits per project / vintage
CREATE TABLE IF NOT EXISTS credits (
  id              SERIAL PRIMARY KEY,
  credit_id       VARCHAR(64) UNIQUE NOT NULL,
  project         VARCHAR(255) NOT NULL,
  vintage_year    INTEGER NOT NULL,
  tons_co2e       NUMERIC(14,2) NOT NULL,
  status          VARCHAR(40)  DEFAULT 'issued',
  methodology     VARCHAR(120),
  serial_number   VARCHAR(128),
  issued_at       TIMESTAMPTZ  DEFAULT NOW(),
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- Holders: corporate, individual, broker, fund
CREATE TABLE IF NOT EXISTS holders (
  id              SERIAL PRIMARY KEY,
  holder_id       VARCHAR(64) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  type            VARCHAR(40)  NOT NULL,
  country         VARCHAR(120),
  kyc_status      VARCHAR(40)  DEFAULT 'pending',
  email           VARCHAR(255),
  registered_at   TIMESTAMPTZ  DEFAULT NOW(),
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- Verifiers: VVB / DOE accredited
CREATE TABLE IF NOT EXISTS verifiers (
  id                  SERIAL PRIMARY KEY,
  verifier_id         VARCHAR(64) UNIQUE NOT NULL,
  name                VARCHAR(255) NOT NULL,
  accreditation       VARCHAR(255),
  verification_count  INTEGER DEFAULT 0,
  last_audit_at       TIMESTAMPTZ,
  status              VARCHAR(40) DEFAULT 'active',
  country             VARCHAR(120),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions: transfers between holders
CREATE TABLE IF NOT EXISTS transactions (
  id                  SERIAL PRIMARY KEY,
  transaction_id      VARCHAR(64) UNIQUE NOT NULL,
  from_holder         VARCHAR(255),
  to_holder           VARCHAR(255),
  credits_amount      NUMERIC(14,2) NOT NULL,
  price_per_ton_usd   NUMERIC(10,2),
  status              VARCHAR(40) DEFAULT 'pending',
  notes               TEXT,
  occurred_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Audits: verifier visits / findings
CREATE TABLE IF NOT EXISTS audits (
  id              SERIAL PRIMARY KEY,
  audit_id        VARCHAR(64) UNIQUE NOT NULL,
  project         VARCHAR(255) NOT NULL,
  verifier        VARCHAR(255) NOT NULL,
  finding         VARCHAR(60) NOT NULL,
  completed_at    TIMESTAMPTZ DEFAULT NOW(),
  report_url      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Methodologies: VM0007, VM0015, GS-AFOLU, etc
CREATE TABLE IF NOT EXISTS methodologies (
  id              SERIAL PRIMARY KEY,
  methodology_id  VARCHAR(64) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  type            VARCHAR(120),
  scope           VARCHAR(255),
  version         VARCHAR(40),
  approved_by     VARCHAR(80),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Issuances: credit-issuance events per vintage
CREATE TABLE IF NOT EXISTS issuances (
  id              SERIAL PRIMARY KEY,
  issuance_id     VARCHAR(64) UNIQUE NOT NULL,
  project         VARCHAR(255) NOT NULL,
  vintage_year    INTEGER NOT NULL,
  tons_issued     NUMERIC(14,2) NOT NULL,
  methodology     VARCHAR(120),
  issued_by       VARCHAR(120),
  issued_at       TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- AI run history
CREATE TABLE IF NOT EXISTS ai_results (
  id              SERIAL PRIMARY KEY,
  feature         VARCHAR(100) NOT NULL,
  input           JSONB,
  output          JSONB,
  model           VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature ON ai_results(feature);
CREATE INDEX IF NOT EXISTS idx_ai_results_created ON ai_results(created_at DESC);
