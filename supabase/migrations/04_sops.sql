-- ============================================================
-- FILE: 04_sops.sql
-- PURPOSE: Standard Operating Procedures library.
-- DEPENDS ON: 02_profiles.sql
-- ROLLBACK: DROP TABLE IF EXISTS sops CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS sops (
  id              TEXT PRIMARY KEY DEFAULT ('sop-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 4)),
  title           TEXT NOT NULL,
  category        TEXT,
  content         TEXT,
  version         TEXT DEFAULT '1.0',
  is_active       BOOLEAN DEFAULT TRUE,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sops_category   ON sops(category);
CREATE INDEX IF NOT EXISTS idx_sops_is_active  ON sops(is_active);

COMMENT ON TABLE sops IS 'Standard Operating Procedures. Accessible to all active employees.';
