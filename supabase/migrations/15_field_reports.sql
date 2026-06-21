-- ============================================================
-- FILE: 15_field_reports.sql
-- PURPOSE: Daily field survey reports.
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql, 01_enums.sql
-- ROLLBACK: DROP TABLE IF EXISTS field_reports CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS field_reports (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  submitted_by        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Report Details
  report_type         field_report_type NOT NULL DEFAULT 'progress',
  report_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  content             TEXT NOT NULL,
  issues_identified   TEXT,

  -- Files (JSONB array of {name, url, type})
  attachments         JSONB NOT NULL DEFAULT '[]',

  -- Status
  status              field_report_status NOT NULL DEFAULT 'submitted',
  acknowledged_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  acknowledged_at     TIMESTAMPTZ,

  -- Location tracking (optional)
  location_lat        NUMERIC(10, 7),
  location_lng        NUMERIC(10, 7),

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_reports_project_id   ON field_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_field_reports_submitted_by ON field_reports(submitted_by);
CREATE INDEX IF NOT EXISTS idx_field_reports_type         ON field_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_field_reports_status       ON field_reports(status);
CREATE INDEX IF NOT EXISTS idx_field_reports_date         ON field_reports(report_date DESC);

COMMENT ON TABLE field_reports IS 'Daily field survey reports submitted by surveyors.';
COMMENT ON COLUMN field_reports.report_type IS 'progress | completion | issue';
COMMENT ON COLUMN field_reports.status IS 'submitted | acknowledged | resolved';
