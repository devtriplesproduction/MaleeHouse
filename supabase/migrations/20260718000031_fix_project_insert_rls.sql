-- 57_fix_project_insert_rls.sql

-- Drop any existing limited insert policies
DROP POLICY IF EXISTS "Sales can create projects" ON projects;
DROP POLICY IF EXISTS "Authorized roles can create projects" ON projects;

-- Create a new policy that allows admin, sales, and accountant to create projects
CREATE POLICY "Authorized roles can create projects" ON projects
  FOR INSERT WITH CHECK (
    get_user_role() IN ('admin', 'sales', 'accountant')
  );
