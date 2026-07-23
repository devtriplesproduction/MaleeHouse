-- ============================================================
-- FILE: 13_project_accounts_owners.sql
-- PURPOSE: Accountant ownership records per project.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql
-- ROLLBACK: DROP TABLE IF EXISTS project_accounts_owners CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS project_accounts_owners (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  accountant_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Timestamps
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One accountant owner per project
  CONSTRAINT uq_project_accountant UNIQUE (project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_accounts_owners_project_id   ON project_accounts_owners(project_id);
CREATE INDEX IF NOT EXISTS idx_project_accounts_owners_accountant_id ON project_accounts_owners(accountant_id);

COMMENT ON TABLE project_accounts_owners IS 'Maps one accountant as the finance owner of each project.';
