-- Add bank_id to payroll_cycles for payroll banking integration
ALTER TABLE public.payroll_cycles ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;
