-- ============================================================
-- FILE: 26_leaves.sql
-- PURPOSE: Leave requests and management.
-- DEPENDS ON: 02_profiles.sql, 01_enums.sql
-- ROLLBACK: DROP TABLE IF EXISTS leaves CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS leaves (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  leave_type      leave_type NOT NULL DEFAULT 'casual',
  reason          TEXT NOT NULL,
  
  status          leave_status NOT NULL DEFAULT 'pending',
  
  approved_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaves_user_id ON leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);

COMMENT ON TABLE leaves IS 'Employee leave requests.';
