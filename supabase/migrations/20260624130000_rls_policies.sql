-- 1. Helper Function to Check User Role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_engineer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'engineer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to break recursion for project assignments
CREATE OR REPLACE FUNCTION public.get_my_project_ids()
RETURNS SETOF text AS $$
  SELECT project_id FROM public.project_assignments WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Enable RLS on Tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- 3. Projects Table Policies
DROP POLICY IF EXISTS "Admin can perform all actions on projects" ON public.projects;
DROP POLICY IF EXISTS "Assigned users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Assigned users can update their projects" ON public.projects;

CREATE POLICY "Admin can perform all actions on projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Engineers can view all projects" ON public.projects;
CREATE POLICY "Engineers can view all projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.is_engineer());

CREATE POLICY "Assigned users can view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.get_my_project_ids()));

CREATE POLICY "Assigned users can update their projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (id IN (SELECT public.get_my_project_ids()));

-- 4. Project Assignments Table Policies
DROP POLICY IF EXISTS "Admin can perform all actions on project assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Engineers can insert/update/delete assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Assigned users can view assignments for their projects" ON public.project_assignments;

CREATE POLICY "Admin can perform all actions on project assignments"
  ON public.project_assignments FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Engineers can insert/update/delete assignments"
  ON public.project_assignments FOR ALL
  TO authenticated
  USING (public.is_engineer());

CREATE POLICY "Assigned users can view assignments for their projects"
  ON public.project_assignments FOR SELECT
  TO authenticated
  USING (project_id IN (SELECT public.get_my_project_ids()));

-- 5. Files Table Policies
DROP POLICY IF EXISTS "Admin can perform all actions on files" ON public.files;
DROP POLICY IF EXISTS "Assigned users can perform all actions on files for their projects" ON public.files;

CREATE POLICY "Admin can perform all actions on files"
  ON public.files FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Assigned users can perform all actions on files for their projects"
  ON public.files FOR ALL
  TO authenticated
  USING (project_id IN (SELECT public.get_my_project_ids()));

-- 6. Storage Policies for project-assets bucket
-- Note: Requires `storage.objects` table.
DROP POLICY IF EXISTS "Admin can perform all actions on project-assets" ON storage.objects;
DROP POLICY IF EXISTS "Assigned users can access files in their project folders" ON storage.objects;

CREATE POLICY "Admin can perform all actions on project-assets"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'project-assets' AND public.is_admin());

CREATE POLICY "Assigned users can access files in their project folders"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'project-assets' AND
    (string_to_array(name, '/'))[1] IN (SELECT public.get_my_project_ids())
  );
