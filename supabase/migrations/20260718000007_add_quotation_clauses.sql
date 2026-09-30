-- ============================================================
-- FILE: 35_add_quotation_clauses.sql
-- PURPOSE: Add clauses column to quotations and quotation_versions
-- ============================================================

ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS clauses JSONB NOT NULL DEFAULT '[]';

ALTER TABLE quotation_versions
ADD COLUMN IF NOT EXISTS clauses JSONB NOT NULL DEFAULT '[]';
