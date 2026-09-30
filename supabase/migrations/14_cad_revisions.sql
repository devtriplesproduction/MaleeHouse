-- ============================================================
-- FILE: 14_cad_revisions.sql
-- PURPOSE: CAD prototype submissions and review workflow.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql, 01_enums.sql
-- ROLLBACK: DROP TABLE IF EXISTS cad_revisions CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS cad_revisions (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  submitted_by        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Revision details
  revision_number     INTEGER NOT NULL DEFAULT 1,
  title               TEXT,
  description         TEXT DEFAULT '',

  -- Files (JSONB array of {name, url, size})
  files               JSONB NOT NULL DEFAULT '[]',

  -- Review
  status              cad_revision_status NOT NULL DEFAULT 'pending_review',
  reviewed_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  review_notes        TEXT,

  -- Whether this is the "prototype" or "final" deliverable
  revision_type       TEXT NOT NULL DEFAULT 'prototype',  -- 'prototype' | 'final'

  -- Timestamps
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cad_revisions_project_id   ON cad_revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_cad_revisions_status       ON cad_revisions(status);
CREATE INDEX IF NOT EXISTS idx_cad_revisions_submitted_by ON cad_revisions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_cad_revisions_type         ON cad_revisions(revision_type);

COMMENT ON TABLE cad_revisions IS 'CAD prototype and final drawing submissions with engineer review workflow.';
COMMENT ON COLUMN cad_revisions.status IS 'pending_review | approved | rejected | rework_requested';
COMMENT ON COLUMN cad_revisions.revision_type IS 'prototype = initial CAD; final = deliverable for QC.';
