-- ============================================================
-- FILE: 17_files.sql
-- PURPOSE: Global file vault for projects.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql
-- ROLLBACK: DROP TABLE IF EXISTS files CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS files (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- File Details
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  category        TEXT NOT NULL,  -- e.g., 'requirements', 'survey_data', 'cad_files', 'deliverables', 'other'
  file_size_bytes BIGINT,
  mime_type       TEXT,

  -- Ownership
  uploaded_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Timestamps
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_category   ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files(deleted_at);

COMMENT ON TABLE files IS 'File vault for projects. Points to Supabase Storage URLs.';
COMMENT ON COLUMN files.category IS 'Used for RBAC and UI organization (e.g., survey_data vs deliverables).';
