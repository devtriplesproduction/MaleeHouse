-- ============================================================
-- FILE: 24_tasks.sql
-- PURPOSE: Task management within projects.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql, 01_enums.sql
-- ROLLBACK: DROP TABLE IF EXISTS tasks CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES projects(id) ON DELETE CASCADE,
  
  title           TEXT NOT NULL,
  description     TEXT,
  stage           TEXT, -- The workflow stage this task belongs to
  
  assigned_to     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  status          task_status NOT NULL DEFAULT 'pending',
  priority        project_priority DEFAULT 'medium',
  
  due_date        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

COMMENT ON TABLE tasks IS 'Project tasks assigned to team members.';
