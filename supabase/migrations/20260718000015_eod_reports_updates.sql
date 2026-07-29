-- ============================================================
-- FILE: 42_eod_reports_updates.sql
-- PURPOSE: Update eod_reports schema to match frontend
-- ============================================================

ALTER TABLE eod_reports RENAME COLUMN report_date TO date;
ALTER TABLE eod_reports RENAME COLUMN content TO tasks_completed;
ALTER TABLE eod_reports RENAME COLUMN impediments TO blockers;

ALTER TABLE eod_reports ADD COLUMN IF NOT EXISTS hours_spent NUMERIC DEFAULT 8.5;
ALTER TABLE eod_reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE eod_reports ADD COLUMN IF NOT EXISTS adjusted_hours NUMERIC;
ALTER TABLE eod_reports ADD COLUMN IF NOT EXISTS admin_note TEXT;
