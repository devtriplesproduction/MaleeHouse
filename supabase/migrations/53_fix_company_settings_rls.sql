-- ============================================================
-- FILE: 53_fix_company_settings_rls.sql
-- PURPOSE: Allow all users to read company and system settings
-- ============================================================

CREATE POLICY "Anyone can view company_settings" ON company_settings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view system_settings" ON system_settings
  FOR SELECT USING (true);
