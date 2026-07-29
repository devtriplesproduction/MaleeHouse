-- ============================================================
-- FILE: 36_fix_projects_accountant_update_rls.sql
-- PURPOSE: Fix RLS to allow Accountants to update projects (to dispatch to ops)
-- ============================================================

DROP POLICY IF EXISTS "Authorized roles can update projects" ON projects;

CREATE POLICY "Authorized roles can update projects" ON projects
  FOR UPDATE USING (
    get_user_role() IN ('admin', 'sales', 'accountant') OR
    (get_user_role() IN ('engineer', 'cad', 'field', 'field_engineer', 'qc') AND is_project_participant(id))
  );
