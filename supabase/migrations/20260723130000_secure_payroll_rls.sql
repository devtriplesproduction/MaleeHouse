-- ============================================================
-- FILE: 20260723130000_secure_payroll_rls.sql
-- PURPOSE: Fix missing RLS on payroll and financial tables
-- ============================================================

-- Enable RLS
ALTER TABLE public.employee_financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_adjustment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_slip_runs ENABLE ROW LEVEL SECURITY;

-- 1. employee_financial_ledger
CREATE POLICY "HR, Accountants, and Admins can manage employee_financial_ledger" ON public.employee_financial_ledger
  FOR ALL USING (get_user_role() IN ('admin', 'accountant', 'hr'));

CREATE POLICY "Employees can view own employee_financial_ledger" ON public.employee_financial_ledger
  FOR SELECT USING (auth.uid() = employee_id);

-- 2. payroll_adjustment_applications
CREATE POLICY "HR, Accountants, and Admins can manage payroll_adjustment_applications" ON public.payroll_adjustment_applications
  FOR ALL USING (get_user_role() IN ('admin', 'accountant', 'hr'));

-- 3. payroll_audit_logs
CREATE POLICY "HR, Accountants, and Admins can manage payroll_audit_logs" ON public.payroll_audit_logs
  FOR ALL USING (get_user_role() IN ('admin', 'accountant', 'hr'));

-- 4. payroll_payments
CREATE POLICY "HR, Accountants, and Admins can manage payroll_payments" ON public.payroll_payments
  FOR ALL USING (get_user_role() IN ('admin', 'accountant', 'hr'));

-- 5. payroll_slip_runs
CREATE POLICY "HR, Accountants, and Admins can manage payroll_slip_runs" ON public.payroll_slip_runs
  FOR ALL USING (get_user_role() IN ('admin', 'accountant', 'hr'));
