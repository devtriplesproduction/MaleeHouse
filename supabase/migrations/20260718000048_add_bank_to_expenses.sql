-- Add bank_id to expenses table for banking integration
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_bank_id ON public.expenses(bank_id);
