-- 20260719000072_payroll_hr_accountant_workflow.sql

-- 1. Modify payroll_cycles table
ALTER TABLE public.payroll_cycles
  ADD COLUMN IF NOT EXISTS batch_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS slip_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
  
  -- Frozen Summary Data
  ADD COLUMN IF NOT EXISTS total_employees INTEGER,
  ADD COLUMN IF NOT EXISTS gross_payroll NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS total_additions NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS total_deductions NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS total_absent_deduction NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS net_payroll NUMERIC(14,2),
  
  -- Checklist
  ADD COLUMN IF NOT EXISTS checklist_attendance BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checklist_advances BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checklist_bonuses BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checklist_deductions BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checklist_net_payroll BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checklist_verified_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS checklist_verified_at TIMESTAMPTZ,
  
  -- Audit Timestamps & Users
  ADD COLUMN IF NOT EXISTS draft_created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS draft_created_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS last_draft_saved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS submitted_to_accounts_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS slips_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS slips_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 2. Create payroll_slip_runs table
CREATE TABLE IF NOT EXISTS public.payroll_slip_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_cycle_id UUID NOT NULL REFERENCES public.payroll_cycles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'generated', -- 'generated', 'released'
  employee_count INTEGER NOT NULL DEFAULT 0,
  generated_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  generated_by UUID REFERENCES public.profiles(id),
  generated_at TIMESTAMPTZ DEFAULT now(),
  released_by UUID REFERENCES public.profiles(id),
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payroll_slip_runs_cycle_id ON public.payroll_slip_runs(payroll_cycle_id);

-- 3. Create payroll_payments table
CREATE TABLE IF NOT EXISTS public.payroll_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_cycle_id UUID NOT NULL UNIQUE REFERENCES public.payroll_cycles(id) ON DELETE RESTRICT,
  bank_id UUID REFERENCES public.bank_accounts(id),
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  payment_currency TEXT DEFAULT 'INR',
  payment_total_amount NUMERIC(14,2) NOT NULL,
  payment_notes TEXT,
  paid_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_payments_cycle_id ON public.payroll_payments(payroll_cycle_id);
CREATE INDEX IF NOT EXISTS idx_payroll_payments_bank_id ON public.payroll_payments(bank_id);

-- 4. Create payroll_audit_logs table
CREATE TABLE IF NOT EXISTS public.payroll_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL REFERENCES public.payroll_cycles(id) ON DELETE CASCADE,
  batch_number TEXT,
  user_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  notes TEXT,
  action_source TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_audit_logs_cycle_id ON public.payroll_audit_logs(cycle_id);
