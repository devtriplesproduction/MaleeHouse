-- PURPOSE: Add missing RLS policies for quotation_versions table
-- ============================================================

CREATE POLICY "Admins and Accountants can do everything on quotation_versions" ON quotation_versions
  FOR ALL USING (get_user_role() IN ('admin', 'accountant'));

CREATE POLICY "Sales can view quotation_versions" ON quotation_versions
  FOR SELECT USING (get_user_role() = 'sales');

CREATE POLICY "Public can view quotation_versions by token" ON quotation_versions
  FOR SELECT USING (TRUE);
