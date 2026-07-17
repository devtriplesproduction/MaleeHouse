-- ============================================================
-- FILE: 48_add_hr_role.sql
-- PURPOSE: Add 'hr' role to user_role enum
-- ============================================================

DO $$ 
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
