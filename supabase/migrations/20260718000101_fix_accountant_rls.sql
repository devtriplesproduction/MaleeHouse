-- ============================================================
-- FILE: 32_fix_accountant_rls.sql
-- PURPOSE: Allow accountants to fetch projects 
-- DEPENDS ON: 31_fix_rls.sql
-- ============================================================

DROP POLICY IF EXISTS "Accountants can read owned projects" ON projects;
DROP POLICY IF EXISTS "Admins and Sales can read all projects" ON projects;

CREATE POLICY "Admins, Sales, and Accountants can read all projects" ON projects
  FOR SELECT USING (get_user_role() IN ('admin', 'sales', 'accountant') AND deleted_at IS NULL);
