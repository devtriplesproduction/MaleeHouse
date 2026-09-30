-- ============================================================
-- FILE: 11_project_finances.sql
-- PURPOSE: Aggregate finance summary per project.
-- DEPENDS ON: 03_projects.sql
-- ROLLBACK: DROP TABLE IF EXISTS project_finances CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS project_finances (
  id                      TEXT PRIMARY KEY,
  project_id              TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,

  -- Aggregate Totals
  total_quoted_amount     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_invoiced_amount   NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_paid_amount       NUMERIC(14, 2) NOT NULL DEFAULT 0,

  -- Currency
  currency                TEXT NOT NULL DEFAULT 'INR',

  -- Timestamps
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_finances_project_id ON project_finances(project_id);

COMMENT ON TABLE project_finances IS 'Denormalized aggregate finance summary. Updated on each payment verification.';
