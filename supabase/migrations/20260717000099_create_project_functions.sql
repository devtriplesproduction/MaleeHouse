-- ============================================================
-- Create shared project functions
-- Must run before any RLS policies reference these functions.
-- ============================================================

-- ==========================================
-- get_user_role()
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  current_role user_role;
BEGIN
  SELECT role
  INTO current_role
  FROM profiles
  WHERE id = auth.uid();

  RETURN current_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- is_project_participant()
-- ==========================================
CREATE OR REPLACE FUNCTION is_project_participant(p_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_assigned BOOLEAN;
  u_role TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM project_assignments
    WHERE project_id = p_id
      AND user_id = auth.uid()
  ) INTO is_assigned;

  IF is_assigned THEN
    RETURN TRUE;
  END IF;

  u_role := get_user_role();

  IF u_role IN ('admin', 'sales', 'accountant') THEN
    RETURN TRUE;
  END IF;

  IF u_role IN ('engineer', 'cad', 'field', 'field_engineer', 'qc') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;