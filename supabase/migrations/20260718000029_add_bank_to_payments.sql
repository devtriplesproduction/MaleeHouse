ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;
