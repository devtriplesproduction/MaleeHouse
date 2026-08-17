-- ============================================================
-- FILE: 20260817000001_add_superseded_to_quotation_status.sql
-- PURPOSE: Add 'Superseded' value to quotation_status enum
-- ============================================================

ALTER TYPE quotation_status ADD VALUE IF NOT EXISTS 'Superseded';
