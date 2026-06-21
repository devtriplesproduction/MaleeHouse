-- ============================================================
-- FILE: 31_fix_rls.sql
-- PURPOSE: Fix RLS issues for projects, tasks, and comments
-- DEPENDS ON: 30_sync_claims.sql
-- ============================================================

-- 1. FIX PROJECTS UPDATE RLS
-- Previously, only Admins could update projects. We need Sales to update status 
-- (e.g., Send to Accounts) and Engineers to update workflows.

-- Drop the old overly-restrictive policy (if exists)
DROP POLICY IF EXISTS "Admins can update projects" ON projects;

-- Replace with broader policy. In a full production setup, we might split this 
-- into column-level policies, but for now we grant update access based on roles.
CREATE POLICY "Authorized roles can update projects" ON projects
  FOR UPDATE USING (
    get_user_role() IN ('admin', 'sales') OR
    (get_user_role() IN ('engineer', 'cad', 'field', 'field_engineer', 'qc') AND is_project_participant(id)) OR
    (get_user_role() = 'accountant' AND EXISTS (SELECT 1 FROM project_accounts_owners WHERE project_id = projects.id AND accountant_id = auth.uid()))
  );


-- 2. ADD POLICIES FOR TASKS
-- Tasks table previously had RLS enabled but NO policies, blocking all queries.
DROP POLICY IF EXISTS "Participants can read tasks" ON tasks;
CREATE POLICY "Participants can read tasks" ON tasks
  FOR SELECT USING (
    is_project_participant(project_id) OR 
    get_user_role() IN ('admin', 'sales', 'accountant')
  );

DROP POLICY IF EXISTS "Anyone can create tasks" ON tasks;
CREATE POLICY "Anyone can create tasks" ON tasks
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Assigned users can update tasks" ON tasks;
CREATE POLICY "Assigned users can update tasks" ON tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR 
    get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (
    assigned_to = auth.uid() OR 
    get_user_role() = 'admin'
  );


-- 3. ADD POLICIES FOR COMMENTS
-- Comments table previously had RLS enabled but NO policies.
DROP POLICY IF EXISTS "Participants can read comments" ON comments;
CREATE POLICY "Participants can read comments" ON comments
  FOR SELECT USING (
    is_project_participant(project_id) OR 
    get_user_role() IN ('admin', 'sales', 'accountant')
  );

DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
CREATE POLICY "Anyone can create comments" ON comments
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Authors can update comments" ON comments;
CREATE POLICY "Authors can update comments" ON comments
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Authors can delete comments" ON comments;
CREATE POLICY "Authors can delete comments" ON comments
  FOR DELETE USING (
    user_id = auth.uid() OR 
    get_user_role() = 'admin'
  );

-- 4. FIX FILES UPLOAD FOR ADMINS
-- Ensure admin can upload files to any project
DROP POLICY IF EXISTS "Participants can upload files" ON files;
CREATE POLICY "Participants can upload files" ON files
  FOR INSERT WITH CHECK (
    is_project_participant(project_id) OR 
    get_user_role() = 'admin' OR 
    get_user_role() = 'accountant'
  );

