-- ============================================================
-- FILE: 08_invoices.sql
-- PURPOSE: Project invoices linked to milestones and visits.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql, 01_enums.sql
-- NOTE: milestone_id and visit_id FK added after those tables exist.
-- ROLLBACK: DROP TABLE IF EXISTS invoices CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invoice_number    TEXT NOT NULL UNIQUE,

  -- Financial
  amount            NUMERIC(14, 2) NOT NULL,
  gst_rate          NUMERIC(5, 2) NOT NULL DEFAULT 18,
  gst_amount        NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(14, 2) NOT NULL,

  -- Status
  status            invoice_status NOT NULL DEFAULT 'sent',

  -- Linked entities (FKs added after parent tables are created)
  milestone_id      TEXT,  -- FK: project_milestones.id (added in 09_project_milestones.sql)
  visit_id          TEXT,  -- FK: project_visits.id (added in 16_project_visits.sql)

  -- Content
  due_date          DATE,
  notes             TEXT DEFAULT '',

  -- Ownership
  created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_project_id  ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status      ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at  ON invoices(created_at DESC);

COMMENT ON TABLE invoices IS 'Project invoices. Linked to milestones or field visits for billing automation.';
COMMENT ON COLUMN invoices.milestone_id IS 'FK to project_milestones.id — added by ALTER after milestone table exists.';
COMMENT ON COLUMN invoices.visit_id IS 'FK to project_visits.id — added by ALTER after visits table exists.';
