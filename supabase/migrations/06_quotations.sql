-- ============================================================
-- FILE: 06_quotations.sql
-- PURPOSE: Client quotations with full state machine + versioning.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql, 01_enums.sql
-- ROLLBACK: DROP TABLE IF EXISTS quotations CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS quotations (
  id                      TEXT PRIMARY KEY,
  project_id              TEXT REFERENCES projects(id) ON DELETE CASCADE,
  quotation_number        TEXT UNIQUE NOT NULL,

  -- Client access token (for WhatsApp/portal link)
  client_token            UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Client snapshot (denormalized for PDF rendering)
  client_details          JSONB,

  -- Line items
  items                   JSONB NOT NULL DEFAULT '[]',  -- [{id, description, unit, qty, rate, amount}]

  -- Financials
  subtotal                NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_pct            NUMERIC(5, 2) NOT NULL DEFAULT 0,
  discount_amount         NUMERIC(14, 2) NOT NULL DEFAULT 0,
  gst_rate                NUMERIC(5, 2) NOT NULL DEFAULT 18,
  gst_amount              NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_amount            NUMERIC(14, 2) NOT NULL DEFAULT 0,

  -- Content
  notes                   TEXT DEFAULT '',
  terms                   TEXT DEFAULT '',
  internal_notes          TEXT DEFAULT '',

  -- State Machine
  status                  quotation_status NOT NULL DEFAULT 'Draft',
  current_version         INTEGER NOT NULL DEFAULT 1,

  -- Rejection tracking
  rejection_category      TEXT,  -- 'budget' | 'scope' | 'timeline' | 'modification' | 'other'
  rejection_reason        TEXT,

  -- Client interaction tracking
  client_viewed_at        TIMESTAMPTZ,
  client_approved_at      TIMESTAMPTZ,
  client_approver_phone   TEXT,

  -- Ownership
  created_by              UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_project_id     ON quotations(project_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status         ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_client_token   ON quotations(client_token);
CREATE INDEX IF NOT EXISTS idx_quotations_created_by     ON quotations(created_by);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at     ON quotations(created_at DESC);

-- Unique client token
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_client_token_unique ON quotations(client_token);

COMMENT ON TABLE quotations IS 'Client quotations with versioning and client portal access via client_token.';
COMMENT ON COLUMN quotations.client_token IS 'Unique UUID for client portal link. Shared via WhatsApp/email.';
COMMENT ON COLUMN quotations.items IS 'JSONB: [{id, description, unit, qty, rate, amount}]';
COMMENT ON COLUMN quotations.current_version IS 'Tracks which version is current. History in quotation_versions.';
