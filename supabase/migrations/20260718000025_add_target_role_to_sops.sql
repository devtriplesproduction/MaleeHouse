-- ============================================================
-- FILE: 52_add_target_role_to_sops.sql
-- PURPOSE: Add target_role column to sops table
-- ============================================================

ALTER TABLE sops ADD COLUMN IF NOT EXISTS target_role TEXT;
