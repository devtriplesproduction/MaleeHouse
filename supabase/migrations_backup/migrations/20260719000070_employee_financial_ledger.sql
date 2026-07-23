-- ============================================================
-- FILE: 20260719000070_employee_financial_ledger.sql
-- PURPOSE: Employee Financial Ledger Architecture
-- ============================================================

-- 1. employee_financial_ledger
CREATE TABLE IF NOT EXISTS public.employee_financial_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL, -- 'salary_advance', 'bonus', 'damage_recovery', 'loan', 'festival_bonus', etc.
  adjustment_category TEXT NOT NULL CHECK (adjustment_category IN ('recoverable', 'one_time')),
  original_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  suggested_installment_amount NUMERIC(12, 2),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_recovered', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for employee_financial_ledger updated_at
CREATE OR REPLACE FUNCTION public.update_employee_financial_ledger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_employee_financial_ledger_updated_at ON public.employee_financial_ledger;
CREATE TRIGGER trg_employee_financial_ledger_updated_at
    BEFORE UPDATE ON public.employee_financial_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.update_employee_financial_ledger_updated_at();

-- 2. payroll_adjustment_applications
CREATE TABLE IF NOT EXISTS public.payroll_adjustment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id UUID NOT NULL REFERENCES public.employee_financial_ledger(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.payroll_cycles(id) ON DELETE CASCADE,
  applied_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'applied')),
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for payroll_adjustment_applications updated_at
CREATE OR REPLACE FUNCTION public.update_payroll_adjustment_apps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_payroll_adjustment_apps_updated_at ON public.payroll_adjustment_applications;
CREATE TRIGGER trg_payroll_adjustment_apps_updated_at
    BEFORE UPDATE ON public.payroll_adjustment_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_payroll_adjustment_apps_updated_at();

-- 3. Update payroll_snapshots
ALTER TABLE public.payroll_snapshots
ADD COLUMN IF NOT EXISTS is_reviewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS damage_recovery NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS salary_advance_recovery NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remarks TEXT;
