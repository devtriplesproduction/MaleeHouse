-- ============================================================
-- FILE: 30_storage_rls.sql
-- PURPOSE: Setup RLS policies for project-assets bucket
-- ============================================================

-- Ensure the bucket exists (optional safety)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for Storage Objects
CREATE POLICY "Admins can manage storage" ON storage.objects
  FOR ALL USING (bucket_id = 'project-assets' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Participants can read storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-assets' AND public.is_project_participant(split_part(name, '/', 1)));

CREATE POLICY "Participants can upload storage" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-assets' AND public.is_project_participant(split_part(name, '/', 1)));

CREATE POLICY "Participants can update storage" ON storage.objects
  FOR UPDATE USING (bucket_id = 'project-assets' AND public.is_project_participant(split_part(name, '/', 1)));

CREATE POLICY "Participants can delete storage" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-assets' AND public.is_project_participant(split_part(name, '/', 1)));
