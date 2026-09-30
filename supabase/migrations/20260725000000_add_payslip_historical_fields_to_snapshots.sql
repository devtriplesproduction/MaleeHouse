-- Migration: 20260725000000_add_payslip_historical_fields_to_snapshots.sql
-- Purpose: Add immutable historical fields (joining date, banking, and statutory IDs) to payroll_snapshots
-- so that future payslip PDF generation is historically accurate and does not query mutable tables.

ALTER TABLE payroll_snapshots
ADD COLUMN IF NOT EXISTS joining_date DATE,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS uan_number TEXT;

-- Note on sensitive fields:
-- The mutable source data for these fields (PAN, UAN, Bank details) do not currently exist in the profiles table.
-- To maintain strict data security and RBAC, it is recommended to create a dedicated table (e.g. employee_bank_details, employee_statutory_details)
-- with encrypted columns and strict Row Level Security (RLS) policies rather than blindly appending them to the highly-queried profiles table.
-- The snapshot stores these immutably at the time of payroll calculation for historical accuracy.
