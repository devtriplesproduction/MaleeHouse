-- ============================================================
-- FILE: 05_quotation_templates.sql
-- PURPOSE: Terms & Conditions clause templates for quotations.
-- DEPENDS ON: 02_profiles.sql
-- ROLLBACK: DROP TABLE IF EXISTS quotation_templates CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS quotation_templates (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  clauses     JSONB NOT NULL DEFAULT '[]',  -- Array of {id, title, content, order}
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

-- Only one template can be the default at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotation_templates_default
  ON quotation_templates(is_default)
  WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_quotation_templates_category ON quotation_templates(category);

COMMENT ON TABLE quotation_templates IS 'Reusable T&C clause templates for quotation generation. Only one can be is_default.';
COMMENT ON COLUMN quotation_templates.clauses IS 'JSONB array: [{id, title, content, order}]';
