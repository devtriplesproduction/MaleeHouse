-- ============================================================
-- FILE: 18_delivery_checklist.sql
-- PURPOSE: QC delivery verification checklist before completion.
-- DEPENDS ON: 03_projects.sql
-- ROLLBACK: DROP TABLE IF EXISTS delivery_checklist CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_checklist (
  id                      TEXT PRIMARY KEY,
  project_id              TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,

  -- Checklist Items
  qc_approved             BOOLEAN NOT NULL DEFAULT FALSE,
  deliverables_uploaded   BOOLEAN NOT NULL DEFAULT FALSE,
  client_acknowledged     BOOLEAN NOT NULL DEFAULT FALSE,
  final_payment_cleared   BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_checklist_project_id ON delivery_checklist(project_id);

COMMENT ON TABLE delivery_checklist IS 'Project completion gate checklist. 1:1 with projects.';
