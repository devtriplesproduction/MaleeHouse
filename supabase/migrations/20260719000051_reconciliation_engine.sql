-- 1. Add reconciliation metadata to bank_accounts
ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS last_reconciled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_reconciled_balance NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS reconciliation_status TEXT DEFAULT 'unreconciled' 
    CHECK (reconciliation_status IN ('matched', 'discrepancy', 'adjusted', 'unreconciled'));

-- 2. Create immutable reconciliation snapshot table
CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    statement_date DATE NOT NULL,
    opening_balance NUMERIC(14, 2) NOT NULL,
    erp_balance NUMERIC(14, 2) NOT NULL,
    statement_balance NUMERIC(14, 2) NOT NULL,
    difference NUMERIC(14, 2) NOT NULL,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('matched', 'discrepancy', 'adjusted')),
    adjustment_amount NUMERIC(14, 2) DEFAULT 0,
    adjustment_reason TEXT,
    reconciled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_bank_statement_date UNIQUE (bank_id, statement_date)
);

ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and accountants can manage reconciliations"
    ON public.bank_reconciliations FOR ALL
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
    );

CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_bank_id ON public.bank_reconciliations(bank_id);
CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_statement_date ON public.bank_reconciliations(statement_date);
