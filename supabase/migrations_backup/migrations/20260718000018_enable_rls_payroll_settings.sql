-- 45_enable_rls_payroll_settings.sql

-- Enable RLS
ALTER TABLE payroll_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- payroll_cycles (Admin Only)
CREATE POLICY "Admins have full access to payroll_cycles" ON payroll_cycles
  FOR ALL USING (get_user_role() = 'admin');

-- payroll_snapshots (Admin Only)
CREATE POLICY "Admins have full access to payroll_snapshots" ON payroll_snapshots
  FOR ALL USING (get_user_role() = 'admin');

-- attendance_logs (Admin Only)
CREATE POLICY "Admins have full access to attendance_logs" ON attendance_logs
  FOR ALL USING (get_user_role() = 'admin');

-- system_settings (Admin + Accountant)
CREATE POLICY "Admins and Accountants have full access to system_settings" ON system_settings
  FOR ALL USING (get_user_role() IN ('admin', 'accountant'));

-- company_settings (Admin + Accountant)
CREATE POLICY "Admins and Accountants have full access to company_settings" ON company_settings
  FOR ALL USING (get_user_role() IN ('admin', 'accountant'));
