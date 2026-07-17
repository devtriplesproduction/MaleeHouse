-- ============================================================
-- FILE: 33_fix_files_rls.sql
-- PURPOSE: Allow sales to upload files
-- DEPENDS ON: 31_fix_rls.sql
-- ============================================================

DROP POLICY IF EXISTS "Participants can upload files" ON files;
CREATE POLICY "Participants can upload files" ON files
  FOR INSERT WITH CHECK (
    is_project_participant(project_id) OR 
    get_user_role() IN ('admin', 'accountant', 'sales')
  );
