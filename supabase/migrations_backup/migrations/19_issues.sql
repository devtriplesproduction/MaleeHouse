-- ============================================================
-- FILE: 19_issues.sql
-- PURPOSE: Project issues tracker.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql
-- ROLLBACK: DROP TABLE IF EXISTS issues CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS issues (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  severity        TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status          TEXT DEFAULT 'open',   -- 'open', 'in_progress', 'resolved', 'closed'
  
  reported_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  resolved_at     TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);

COMMENT ON TABLE issues IS 'Issue tracking for projects (e.g. blockers, client disputes).';
