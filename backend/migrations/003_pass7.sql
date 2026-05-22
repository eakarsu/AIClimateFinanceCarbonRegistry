-- ============================================================
-- AIClimateFinanceCarbonRegistry - Pass 7 (full backlog implementation)
-- 003_pass7.sql
--
-- Adds:
--   * issuance_hash_chain          — append-only hash-chain over issuances
--   * corresponding_adjustments    — Article 6.2/6.4 ITMO tracking
--   * project_ratings              — composite BeZero/Sylvera-style ratings
-- ============================================================

-- Append-only hash-chain over the canonical issuances table -------
CREATE TABLE IF NOT EXISTS issuance_hash_chain (
  id              SERIAL PRIMARY KEY,
  issuance_id     VARCHAR(64) UNIQUE NOT NULL,
  project         VARCHAR(255) NOT NULL,
  vintage_year    INTEGER NOT NULL,
  tons_issued     NUMERIC(14,2) NOT NULL,
  methodology     VARCHAR(120),
  issued_by       VARCHAR(120),
  issued_at       TIMESTAMPTZ,
  prev_hash       VARCHAR(64),
  hash            VARCHAR(64) NOT NULL,
  sealed_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_issuance_chain_issuance ON issuance_hash_chain(issuance_id);

-- Article 6.2 / 6.4 corresponding-adjustment tracker --------------
CREATE TABLE IF NOT EXISTS corresponding_adjustments (
  id                                  SERIAL PRIMARY KEY,
  adjustment_id                       VARCHAR(64) UNIQUE NOT NULL,
  host_country                        VARCHAR(120) NOT NULL,
  acquiring_country                   VARCHAR(120),
  project                             VARCHAR(255),
  vintage_year                        INTEGER,
  tons_co2e                           NUMERIC(14,2) NOT NULL,
  article                             VARCHAR(8),        -- 6.2 | 6.4
  authorization_status                VARCHAR(40),       -- pending | authorized | revoked
  corresponding_adjustment_applied    BOOLEAN DEFAULT false,
  first_transfer_at                   TIMESTAMPTZ,
  cancelled_at                        TIMESTAMPTZ,
  notes                               TEXT,
  created_at                          TIMESTAMPTZ DEFAULT NOW(),
  updated_at                          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_corresponding_adj_host ON corresponding_adjustments(host_country);

-- Composite project ratings (BeZero / Sylvera style) --------------
CREATE TABLE IF NOT EXISTS project_ratings (
  id                  SERIAL PRIMARY KEY,
  rating_id           VARCHAR(64) UNIQUE NOT NULL,
  project             VARCHAR(255) NOT NULL,
  composite_grade     VARCHAR(8),     -- AAA … D
  composite_score     NUMERIC(6,2),
  additionality       NUMERIC(6,2),
  permanence          NUMERIC(6,2),
  leakage_control     NUMERIC(6,2),
  co_benefits         NUMERIC(6,2),
  mrv_quality         NUMERIC(6,2),
  governance          NUMERIC(6,2),
  ccp_eligibility     VARCHAR(20),
  rated_by            VARCHAR(120),
  rated_at            TIMESTAMPTZ DEFAULT NOW(),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_ratings_project ON project_ratings(project);
