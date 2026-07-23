-- ============================================================
-- FILE: 29_rls.sql
-- PURPOSE: Row Level Security policies for all tables.
-- DEPENDS ON: 27_functions.sql, All tables
-- ============================================================

-- Enable RLS on all tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

-- ==========================================
-- 1. profiles
-- ==========================================
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can do everything on profiles" ON profiles
  FOR ALL USING (get_user_role() = 'admin');

-- ==========================================
-- 2. projects
-- ==========================================
CREATE POLICY "Admins and Sales can read all projects" ON projects
  FOR SELECT USING (get_user_role() IN ('admin', 'sales') AND deleted_at IS NULL);

CREATE POLICY "Ops team can read assigned projects" ON projects
  FOR SELECT USING (
    get_user_role() IN ('engineer', 'cad', 'field', 'field_engineer', 'qc')
    AND is_project_participant(id)
    AND deleted_at IS NULL
  );

CREATE POLICY "Accountants can read owned projects" ON projects
  FOR SELECT USING (
    get_user_role() = 'accountant'
    AND EXISTS (SELECT 1 FROM project_accounts_owners WHERE project_id = projects.id AND accountant_id = auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Sales can create projects" ON projects
  FOR INSERT WITH CHECK (get_user_role() = 'sales');

CREATE POLICY "Admins can update projects" ON projects
  FOR UPDATE USING (get_user_role() = 'admin');

-- ==========================================
-- 3. quotations
-- ==========================================
CREATE POLICY "Admins and Accountants can do everything on quotations" ON quotations
  FOR ALL USING (get_user_role() IN ('admin', 'accountant'));

CREATE POLICY "Sales can view quotations" ON quotations
  FOR SELECT USING (get_user_role() = 'sales');

-- Enable public access by client_token (anonymous or authenticated)
CREATE POLICY "Public can view quotation by token" ON quotations
  FOR SELECT USING (TRUE); -- Note: The API should filter by client_token explicitly

-- ==========================================
-- 4. invoices, payments, milestones, finances
-- ==========================================
-- Full access for Admins and Accountants
CREATE POLICY "Finance Full Access invoices" ON invoices
  FOR ALL USING (get_user_role() IN ('admin', 'accountant'));
CREATE POLICY "Finance Full Access payments" ON payments
  FOR ALL USING (get_user_role() IN ('admin', 'accountant'));
CREATE POLICY "Finance Full Access milestones" ON project_milestones
  FOR ALL USING (get_user_role() IN ('admin', 'accountant'));
CREATE POLICY "Finance Full Access finances" ON project_finances
  FOR ALL USING (get_user_role() IN ('admin', 'accountant'));

-- Read access for assigned project participants
CREATE POLICY "Participant Read Access invoices" ON invoices
  FOR SELECT USING (is_project_participant(project_id));
CREATE POLICY "Participant Read Access payments" ON payments
  FOR SELECT USING (is_project_participant(project_id));
CREATE POLICY "Participant Read Access milestones" ON project_milestones
  FOR SELECT USING (is_project_participant(project_id));
CREATE POLICY "Participant Read Access finances" ON project_finances
  FOR SELECT USING (is_project_participant(project_id));

-- ==========================================
-- 5. project_assignments
-- ==========================================
CREATE POLICY "Admins can manage assignments" ON project_assignments
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Engineers can manage assignments" ON project_assignments
  FOR ALL USING (get_user_role() = 'engineer');

CREATE POLICY "Users can see their own assignments" ON project_assignments
  FOR SELECT USING (user_id = auth.uid());

-- ==========================================
-- 6. cad_revisions
-- ==========================================
CREATE POLICY "Participants can view cad revisions" ON cad_revisions
  FOR SELECT USING (is_project_participant(project_id) OR get_user_role() = 'admin');

CREATE POLICY "CAD can insert own revisions" ON cad_revisions
  FOR INSERT WITH CHECK (get_user_role() = 'cad' AND submitted_by = auth.uid());

CREATE POLICY "Engineers and Admins can update revisions" ON cad_revisions
  FOR UPDATE USING (get_user_role() IN ('engineer', 'admin'));

-- ==========================================
-- 7. field_reports
-- ==========================================
CREATE POLICY "Participants can view field reports" ON field_reports
  FOR SELECT USING (is_project_participant(project_id) OR get_user_role() = 'admin');

CREATE POLICY "Field can insert own reports" ON field_reports
  FOR INSERT WITH CHECK (get_user_role() IN ('field', 'field_engineer') AND submitted_by = auth.uid());

CREATE POLICY "Engineers and Admins can update field reports" ON field_reports
  FOR UPDATE USING (get_user_role() IN ('engineer', 'admin'));

-- ==========================================
-- 8. files
-- ==========================================
CREATE POLICY "Participants can view files" ON files
  FOR SELECT USING (is_project_participant(project_id) OR get_user_role() = 'admin');

CREATE POLICY "Participants can upload files" ON files
  FOR INSERT WITH CHECK (is_project_participant(project_id) OR get_user_role() = 'admin');

CREATE POLICY "Admins can manage files" ON files
  FOR ALL USING (get_user_role() = 'admin');

-- ==========================================
-- 9. notifications
-- ==========================================
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ==========================================
-- 10. activity_logs & workflow_history
-- ==========================================
CREATE POLICY "Admins can view all logs" ON activity_logs
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Admins can view all history" ON workflow_history
  FOR SELECT USING (get_user_role() = 'admin');

-- Append only for everyone
CREATE POLICY "Anyone can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can insert workflow history" ON workflow_history
  FOR INSERT WITH CHECK (TRUE);
