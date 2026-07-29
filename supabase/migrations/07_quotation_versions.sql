-- ============================================================
-- FILE: 07_quotation_versions.sql
-- PURPOSE: Full version history for each quotation revision.
-- DEPENDS ON: 06_quotations.sql, 02_profiles.sql
-- ROLLBACK: DROP TABLE IF EXISTS quotation_versions CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS quotation_versions (
  id                TEXT PRIMARY KEY,
  quotation_id      TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  version_number    INTEGER NOT NULL,

  -- Snapshot of the quotation at this version
  items             JSONB NOT NULL DEFAULT '[]',
  subtotal          NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_pct      NUMERIC(5, 2) DEFAULT 0,
  discount_amount   NUMERIC(14, 2) DEFAULT 0,
  gst_rate          NUMERIC(5, 2) NOT NULL DEFAULT 18,
  gst_amount        NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(14, 2) NOT NULL DEFAULT 0,
  notes             TEXT DEFAULT '',
  terms             TEXT DEFAULT '',
  internal_notes    TEXT DEFAULT '',

  -- Status at time of revision
  status            quotation_status NOT NULL DEFAULT 'Draft',

  -- Revision metadata
  revision_reason   TEXT,
  created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique: one version number per quotation
  CONSTRAINT uq_quotation_version UNIQUE (quotation_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_quotation_versions_quotation_id ON quotation_versions(quotation_id);

COMMENT ON TABLE quotation_versions IS 'Immutable version history snapshots for each quotation revision.';
