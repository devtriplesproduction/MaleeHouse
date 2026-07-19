-- ============================================================
-- FILE: 20260719000063_salary_slip_notification_status.sql
-- PURPOSE: Add notification_status to salary_slips
-- ============================================================

ALTER TABLE public.salary_slips ADD COLUMN IF NOT EXISTS notification_status TEXT DEFAULT 'Pending';
