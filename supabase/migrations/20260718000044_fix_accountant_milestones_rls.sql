-- ============================================================
-- FILE: 64_fix_accountant_milestones_rls.sql
-- PURPOSE: Fix RLS on project_accounts_owners so accountants can create milestones
-- ============================================================

CREATE POLICY "Finance Full Access owners" ON project_accounts_owners
  FOR ALL USING (get_user_role() IN ('admin', 'accountant'));
