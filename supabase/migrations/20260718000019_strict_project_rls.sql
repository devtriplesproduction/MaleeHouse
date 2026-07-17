-- 46_strict_project_rls.sql

-- 1. PROJECTS TABLE
DROP POLICY IF EXISTS "Admins and Sales can read all projects" ON projects;
DROP POLICY IF EXISTS "Ops team can read assigned projects" ON projects;
DROP POLICY IF EXISTS "Accountants can read owned projects" ON projects;
DROP POLICY IF EXISTS "Users can read projects based on role or assignment" ON projects;

CREATE POLICY "Users can read projects based on role or assignment" ON projects
  FOR SELECT USING (
    get_user_role() IN ('admin', 'accountant', 'engineer', 'sales') OR 
    is_project_participant(id)
  );

-- 2. FILES TABLE
DROP POLICY IF EXISTS "Participants can view files" ON files;
DROP POLICY IF EXISTS "Participants can upload files" ON files;
DROP POLICY IF EXISTS "Admins can manage files" ON files;
DROP POLICY IF EXISTS "Users can view files based on role or assignment" ON files;
DROP POLICY IF EXISTS "Users can insert files based on role or assignment" ON files;
DROP POLICY IF EXISTS "Users can update files based on role or assignment" ON files;
DROP POLICY IF EXISTS "Admins can delete files" ON files;

CREATE POLICY "Users can view files based on role or assignment" ON files
  FOR SELECT USING (
    get_user_role() IN ('admin', 'accountant', 'engineer', 'sales') OR 
    is_project_participant(project_id)
  );

CREATE POLICY "Users can insert files based on role or assignment" ON files
  FOR INSERT WITH CHECK (
    get_user_role() IN ('admin', 'accountant', 'engineer', 'sales') OR 
    is_project_participant(project_id)
  );

CREATE POLICY "Users can update files based on role or assignment" ON files
  FOR UPDATE USING (
    get_user_role() IN ('admin', 'accountant', 'engineer', 'sales') OR 
    is_project_participant(project_id)
  );

CREATE POLICY "Admins can delete files" ON files
  FOR DELETE USING (get_user_role() = 'admin');

-- 3. STORAGE.OBJECTS (project-assets)
DROP POLICY IF EXISTS "Admins can manage storage" ON storage.objects;
DROP POLICY IF EXISTS "Participants can read storage" ON storage.objects;
DROP POLICY IF EXISTS "Participants can upload storage" ON storage.objects;
DROP POLICY IF EXISTS "Participants can update storage" ON storage.objects;
DROP POLICY IF EXISTS "Participants can delete storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can read project assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert project assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update project assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete project assets" ON storage.objects;

CREATE POLICY "Users can read project assets" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-assets' AND (
      public.get_user_role() IN ('admin', 'accountant', 'engineer', 'sales') OR
      public.is_project_participant(split_part(name, '/', 1))
    )
  );

CREATE POLICY "Users can insert project assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-assets' AND (
      public.get_user_role() IN ('admin', 'accountant', 'engineer', 'sales') OR
      public.is_project_participant(split_part(name, '/', 1))
    )
  );

CREATE POLICY "Users can update project assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-assets' AND (
      public.get_user_role() IN ('admin', 'accountant', 'engineer', 'sales') OR
      public.is_project_participant(split_part(name, '/', 1))
    )
  );

CREATE POLICY "Users can delete project assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-assets' AND (
      public.get_user_role() = 'admin' OR
      public.is_project_participant(split_part(name, '/', 1))
    )
  );
