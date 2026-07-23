-- ============================================================
-- FILE: 21_workflow_history.sql
-- PURPOSE: Tracks all stage transitions for projects.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql
-- ROLLBACK: DROP TABLE IF EXISTS workflow_history CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_history (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  from_stage      TEXT,
  to_stage        TEXT NOT NULL,
  comment         TEXT,

  changed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_history_project_id ON workflow_history(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_created_at ON workflow_history(created_at DESC);

COMMENT ON TABLE workflow_history IS 'Append-only history of project stage transitions.';
