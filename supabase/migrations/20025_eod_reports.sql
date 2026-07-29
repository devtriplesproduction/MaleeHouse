-- ============================================================
-- FILE: 25_eod_reports.sql
-- PURPOSE: End-of-day reports submitted by employees.
-- DEPENDS ON: 02_profiles.sql
-- ROLLBACK: DROP TABLE IF EXISTS eod_reports CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS eod_reports (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  report_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  content         TEXT NOT NULL,
  impediments     TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eod_reports_user_id ON eod_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_eod_reports_date ON eod_reports(report_date DESC);

COMMENT ON TABLE eod_reports IS 'End of day reports submitted by employees.';
