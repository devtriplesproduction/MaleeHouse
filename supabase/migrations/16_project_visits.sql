-- ============================================================
-- FILE: 16_project_visits.sql
-- PURPOSE: Field visit scheduling and execution tracking.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql, 01_enums.sql
-- ROLLBACK: DROP TABLE IF EXISTS project_visits CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS project_visits (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Scheduling
  scheduled_date      DATE NOT NULL,
  purpose             TEXT NOT NULL,
  notes               TEXT,

  -- Assigned Personnel (Array of profile IDs)
  assigned_team       UUID[] NOT NULL DEFAULT '{}',

  -- Execution
  status              visit_status NOT NULL DEFAULT 'scheduled',
  completed_date      DATE,
  report_id           TEXT REFERENCES field_reports(id) ON DELETE SET NULL,

  -- Finance Integration
  is_billable         BOOLEAN NOT NULL DEFAULT FALSE,
  visit_cost          NUMERIC(10, 2) DEFAULT 0,

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_visits_project_id    ON project_visits(project_id);
CREATE INDEX IF NOT EXISTS idx_project_visits_status        ON project_visits(status);
CREATE INDEX IF NOT EXISTS idx_project_visits_date          ON project_visits(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_project_visits_assigned_team ON project_visits USING GIN (assigned_team);

COMMENT ON TABLE project_visits IS 'Scheduled field visits and their execution status.';
COMMENT ON COLUMN project_visits.assigned_team IS 'Array of profile UUIDs scheduled for this visit.';
COMMENT ON COLUMN project_visits.status IS 'scheduled | completed | cancelled | paid';
