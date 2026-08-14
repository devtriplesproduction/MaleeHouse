-- 20260724000002_add_overtime_to_payroll.sql

ALTER TABLE payroll_snapshots
ADD COLUMN overtime_hours NUMERIC(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN overtime_pay NUMERIC(12, 2) NOT NULL DEFAULT 0;
