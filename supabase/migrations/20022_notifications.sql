-- ============================================================
-- FILE: 22_notifications.sql
-- PURPOSE: In-app user notifications.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql, 01_enums.sql
-- ROLLBACK: DROP TABLE IF EXISTS notifications CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id                  TEXT PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title               TEXT NOT NULL,
  message             TEXT NOT NULL,
  type                notification_type NOT NULL DEFAULT 'system',
  
  is_read             BOOLEAN NOT NULL DEFAULT FALSE,
  related_project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

COMMENT ON TABLE notifications IS 'In-app notifications for users.';
