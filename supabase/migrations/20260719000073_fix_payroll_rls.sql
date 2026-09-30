-- Fix RLS for payroll_cycles and payroll_snapshots to allow HR and Accountants
DROP POLICY IF EXISTS "Admins have full access to payroll_cycles" ON payroll_cycles;
CREATE POLICY "HR, Accountants, and Admins can manage payroll_cycles" ON payroll_cycles
  FOR ALL USING (get_user_role() IN ('admin', 'accountant', 'hr'));

DROP POLICY IF EXISTS "Admins have full access to payroll_snapshots" ON payroll_snapshots;
CREATE POLICY "HR, Accountants, and Admins can manage payroll_snapshots" ON payroll_snapshots
  FOR ALL USING (get_user_role() IN ('admin', 'accountant', 'hr'));
