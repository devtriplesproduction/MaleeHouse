-- ============================================================
-- PURPOSE: Close anon-readable settings (GSTIN, bank details, system config).
-- company_settings / system_settings previously had FOR SELECT USING (true)
-- with no TO authenticated clause — readable via public Supabase REST as anon.
-- Public invoice/receipt UIs load company settings server-side (service role
-- or authenticated session), not via direct anon table access.
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view company_settings" ON company_settings;
DROP POLICY IF EXISTS "Anyone can view system_settings" ON system_settings;

-- Any logged-in employee may read company branding / letterhead fields.
-- Writes remain admin/accountant via existing FOR ALL policies.
DROP POLICY IF EXISTS "Authenticated users can view company_settings" ON company_settings;
CREATE POLICY "Authenticated users can view company_settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- system_settings: no broad SELECT. Existing admin/accountant FOR ALL covers
-- authorized reads. Anon and non-privileged roles get nothing.
