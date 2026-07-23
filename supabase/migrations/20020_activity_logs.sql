-- ============================================================
-- FILE: 20_activity_logs.sql
-- PURPOSE: Full audit trail for the platform.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql, 01_enums.sql
-- ROLLBACK: DROP TABLE IF EXISTS activity_logs CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,

  action          TEXT NOT NULL,
  details         JSONB NOT NULL DEFAULT '{}',
  severity        audit_severity DEFAULT 'info',

  -- For administrative audits not tied to a project
  target_user_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_email     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

COMMENT ON TABLE activity_logs IS 'Append-only audit trail for all system actions.';
COMMENT ON COLUMN activity_logs.details IS 'JSON payload containing action-specific context.';
