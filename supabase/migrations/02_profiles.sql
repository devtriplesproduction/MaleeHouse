-- ============================================================
-- FILE: 02_profiles.sql
-- PURPOSE: User profiles table. Central to all RBAC and data access.
-- DEPENDS ON: 01_enums.sql, auth.users (Supabase Auth)
-- ROLLBACK: DROP TABLE IF EXISTS profiles CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  -- Identity
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   TEXT NOT NULL UNIQUE,
  role                    user_role NOT NULL DEFAULT 'employee',

  -- Personal
  first_name              TEXT,
  last_name               TEXT,
  phone_number            TEXT,
  dob                     DATE,
  gender                  TEXT,
  personal_email          TEXT,
  emergency_contact       TEXT,
  profile_photo           TEXT,
  address                 TEXT,

  -- Employment
  employee_id             TEXT UNIQUE,
  department              TEXT,
  designation             TEXT,
  joining_date            DATE,
  employment_type         TEXT DEFAULT 'full-time',
  salary                  NUMERIC(12, 2) DEFAULT 0,
  experience              INTEGER DEFAULT 0,
  location                TEXT DEFAULT 'office',
  status                  employee_status NOT NULL DEFAULT 'invited',
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  branch                  TEXT DEFAULT 'Malee House HQ',
  office_location         TEXT DEFAULT 'Singapore',
  operational_zone        TEXT DEFAULT 'Central Business District',

  -- Org Hierarchy
  reporting_manager_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department_head_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  escalation_chain        UUID[] DEFAULT '{}',
  approval_authority      BOOLEAN DEFAULT FALSE,

  -- Security
  force_password_reset    BOOLEAN DEFAULT FALSE,
  temp_password_expires_at TIMESTAMPTZ,

  -- Documents (stored as JSONB array of {name, url, type})
  documents               JSONB DEFAULT '[]',

  -- Timestamps
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ,
  deleted_at              TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role         ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email        ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id  ON profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active    ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_department   ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at   ON profiles(deleted_at);

-- Comments
COMMENT ON TABLE profiles IS 'Central user/employee table. Links to auth.users via id.';
COMMENT ON COLUMN profiles.id IS 'Must match auth.users.id for Supabase Auth integration.';
COMMENT ON COLUMN profiles.role IS 'Application RBAC role — drives all permission checks.';
COMMENT ON COLUMN profiles.force_password_reset IS 'If true, user must change password on next login.';
COMMENT ON COLUMN profiles.escalation_chain IS 'Ordered array of manager UUIDs for escalation routing.';
