-- ============================================================
-- FILE: 37_fix_quotation_templates_rls.sql
-- PURPOSE: Fix RLS policies for quotation_templates table
-- ============================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can read quotation templates" ON quotation_templates;
DROP POLICY IF EXISTS "Admins and Accountants can manage quotation templates" ON quotation_templates;

-- Read access for all authenticated users
CREATE POLICY "Authenticated users can read quotation templates" ON quotation_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Write access for Admins and Accountants
CREATE POLICY "Admins and Accountants can manage quotation templates" ON quotation_templates
  FOR ALL USING (get_user_role() IN ('admin', 'accountant'));
