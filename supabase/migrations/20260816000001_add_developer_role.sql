-- ============================================================
-- FILE: 20260816000001_add_developer_role.sql
-- PURPOSE: Add 'developer' to user_role ENUM and update RLS
-- ============================================================

-- Add 'developer' to the existing enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'developer';

