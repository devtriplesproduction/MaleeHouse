-- ============================================================
-- FILE: 12_project_assignments.sql
-- PURPOSE: Team member assignments to projects (ops team).
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql
-- ROLLBACK: DROP TABLE IF EXISTS project_assignments CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS project_assignments (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Role at time of assignment (snapshot)
  role          TEXT NOT NULL,

  -- Assignment details
  assigned_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at    TIMESTAMPTZ,

  -- Unique assignment per user per project (active)
  CONSTRAINT uq_project_assignment UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_user_id    ON project_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_role       ON project_assignments(role);

COMMENT ON TABLE project_assignments IS 'Links ops team members to projects. Drives access control and notifications.';
COMMENT ON COLUMN project_assignments.role IS 'Snapshot of user role at time of assignment.';
