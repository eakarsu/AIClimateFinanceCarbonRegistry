-- ============================================================
-- AIClimateFinanceCarbonRegistry - Extensions (10 new CRUD + cross-cutting)
-- 002_extensions.sql
-- ============================================================

-- Users (RBAC) ------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(40)  NOT NULL DEFAULT 'auditor',  -- admin | registrar | auditor
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Retirements -------------------------------------------------
CREATE TABLE IF NOT EXISTS retirements (
  id              SERIAL PRIMARY KEY,
  retirement_id   VARCHAR(64) UNIQUE NOT NULL,
  credits_amount  NUMERIC(14,2) NOT NULL,
  beneficiary     VARCHAR(255),
  claim           TEXT,
  retired_at      TIMESTAMPTZ DEFAULT NOW(),
  certificate_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Beneficiaries -----------------------------------------------
CREATE TABLE IF NOT EXISTS beneficiaries (
  id                  SERIAL PRIMARY KEY,
  beneficiary_id      VARCHAR(64) UNIQUE NOT NULL,
  name                VARCHAR(255) NOT NULL,
  type                VARCHAR(40),       -- corporate | individual
  country             VARCHAR(120),
  reported_use_year   INTEGER,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Scope Emissions ---------------------------------------------
CREATE TABLE IF NOT EXISTS scopes_emissions (
  id              SERIAL PRIMARY KEY,
  scope_id        VARCHAR(64) UNIQUE NOT NULL,
  holder          VARCHAR(255) NOT NULL,
  year            INTEGER NOT NULL,
  scope           VARCHAR(8) NOT NULL,    -- 1 | 2 | 3
  emissions_tco2e NUMERIC(16,2) NOT NULL,
  methodology     VARCHAR(120),
  verified        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Scoreboard --------------------------------------------------
CREATE TABLE IF NOT EXISTS scoreboard (
  id              SERIAL PRIMARY KEY,
  score_id        VARCHAR(64) UNIQUE NOT NULL,
  project         VARCHAR(255) NOT NULL,
  ccp_eligible    VARCHAR(20),    -- yes | no | pending
  sylvera_grade   VARCHAR(8),     -- AAA | AA | A | BBB | BB | B | C | D
  btn_grade       VARCHAR(8),     -- AAA … D
  last_updated    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Jurisdictional Baselines ------------------------------------
CREATE TABLE IF NOT EXISTS jurisdictional_baselines (
  id              SERIAL PRIMARY KEY,
  baseline_id     VARCHAR(64) UNIQUE NOT NULL,
  jurisdiction    VARCHAR(255) NOT NULL,
  sector          VARCHAR(120),
  year            INTEGER NOT NULL,
  baseline_tco2e  NUMERIC(16,2) NOT NULL,
  reference       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Satellite Imagery -------------------------------------------
CREATE TABLE IF NOT EXISTS satellite_imagery (
  id                  SERIAL PRIMARY KEY,
  image_id            VARCHAR(64) UNIQUE NOT NULL,
  project             VARCHAR(255) NOT NULL,
  captured_at         TIMESTAMPTZ,
  source              VARCHAR(40),    -- Sentinel-2 | Landsat | Planet
  ndvi_avg            NUMERIC(6,3),
  area_change_pct     NUMERIC(7,3),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- SMR Reports (Subsequent Monitoring & Reporting) -------------
CREATE TABLE IF NOT EXISTS smr_reports (
  id              SERIAL PRIMARY KEY,
  smr_id          VARCHAR(64) UNIQUE NOT NULL,
  project         VARCHAR(255) NOT NULL,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  monitored_tco2e NUMERIC(16,2) NOT NULL,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Claims ------------------------------------------------------
CREATE TABLE IF NOT EXISTS claims (
  id                      SERIAL PRIMARY KEY,
  claim_id                VARCHAR(64) UNIQUE NOT NULL,
  holder                  VARCHAR(255) NOT NULL,
  type                    VARCHAR(40),     -- net-zero | carbon-neutral | SBTi
  scope                   VARCHAR(40),     -- 1+2 | 1+2+3 | partial
  year                    INTEGER,
  third_party_verified    BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Biodiversity Co-Benefits ------------------------------------
CREATE TABLE IF NOT EXISTS biodiversity_cobenefits (
  id              SERIAL PRIMARY KEY,
  co_id           VARCHAR(64) UNIQUE NOT NULL,
  project         VARCHAR(255) NOT NULL,
  indicator       VARCHAR(80),    -- species-count | habitat-area | water-quality
  baseline        NUMERIC(16,3),
  current         NUMERIC(16,3),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Finance Ledger ----------------------------------------------
CREATE TABLE IF NOT EXISTS finance_ledger (
  id              SERIAL PRIMARY KEY,
  ledger_id       VARCHAR(64) UNIQUE NOT NULL,
  holder          VARCHAR(255) NOT NULL,
  transaction     VARCHAR(255),
  debit_credits   NUMERIC(14,2) DEFAULT 0,
  credit_credits  NUMERIC(14,2) DEFAULT 0,
  balance_credits NUMERIC(14,2) DEFAULT 0,
  ts              TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications -----------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_email      VARCHAR(255),
  type            VARCHAR(40),       -- fraud-alert | retirement | audit-finding
  title           VARCHAR(255),
  body            TEXT,
  read            BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(read);

-- Attachments (file uploads) ----------------------------------
CREATE TABLE IF NOT EXISTS attachments (
  id              SERIAL PRIMARY KEY,
  entity_type     VARCHAR(60) NOT NULL,   -- project | satellite | smr | …
  entity_id       VARCHAR(64),
  filename        VARCHAR(255) NOT NULL,
  original_name   VARCHAR(255),
  mime_type       VARCHAR(120),
  size_bytes      BIGINT,
  uploaded_by     VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);

-- Webhooks ----------------------------------------------------
CREATE TABLE IF NOT EXISTS webhooks (
  id              SERIAL PRIMARY KEY,
  url             TEXT NOT NULL,
  events          TEXT[] NOT NULL,            -- {issuance, transfer, retirement}
  secret          VARCHAR(128) NOT NULL,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              SERIAL PRIMARY KEY,
  webhook_id      INTEGER REFERENCES webhooks(id) ON DELETE CASCADE,
  event           VARCHAR(60),
  payload         JSONB,
  signature       VARCHAR(255),
  response_status INTEGER,
  response_body   TEXT,
  delivered_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
