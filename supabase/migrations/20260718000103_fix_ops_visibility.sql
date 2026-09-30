-- -- ============================================================
-- -- FILE: 34_fix_ops_visibility.sql
-- -- PURPOSE: Allow ops team to see projects even if not assigned yet
-- -- ============================================================

-- CREATE OR REPLACE FUNCTION is_project_participant(p_id TEXT)
-- RETURNS BOOLEAN AS $$
-- DECLARE
--   is_assigned BOOLEAN;
--   u_role TEXT;
-- BEGIN
--   -- 1. Check direct assignment
--   SELECT EXISTS (
--     SELECT 1 FROM project_assignments
--     WHERE project_id = p_id AND user_id = auth.uid()
--   ) INTO is_assigned;
  
--   IF is_assigned THEN
--     RETURN TRUE;
--   END IF;

--   -- 2. If not directly assigned, allow access based on role
--   u_role := get_user_role();
  
--   -- Admins, sales, and accountants have broad access anyway
--   IF u_role IN ('admin', 'sales', 'accountant') THEN
--     RETURN TRUE;
--   END IF;

--   -- Operations team needs to see projects in the pipeline to accept assignments
--   -- and collaborate. 
--   IF u_role IN ('engineer', 'cad', 'field', 'field_engineer', 'qc') THEN
--     RETURN TRUE;
--   END IF;

--   RETURN FALSE;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
