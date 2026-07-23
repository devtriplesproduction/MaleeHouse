-- ============================================================
-- FILE: 23_comments.sql
-- PURPOSE: Project comment threads and discussion.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql
-- ROLLBACK: DROP TABLE IF EXISTS comments CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  content         TEXT NOT NULL,
  
  -- Mentions (Array of profile IDs)
  mentions        UUID[] DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON comments(deleted_at);

COMMENT ON TABLE comments IS 'Project comments and discussion threads.';
