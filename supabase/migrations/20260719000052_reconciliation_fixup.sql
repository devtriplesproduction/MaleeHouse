-- 1. Safely add the new columns to bank_reconciliations (if they don't already exist)
ALTER TABLE public.bank_reconciliations
  ADD COLUMN IF NOT EXISTS adjustment_amount NUMERIC(14, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;

-- 2. Deterministically drop the old status check constraints
ALTER TABLE public.bank_reconciliations 
  DROP CONSTRAINT IF EXISTS bank_reconciliations_status_check;

ALTER TABLE public.bank_accounts 
  DROP CONSTRAINT IF EXISTS bank_accounts_reconciliation_status_check;

-- 3. Add the updated constraints safely
ALTER TABLE public.bank_reconciliations 
  ADD CONSTRAINT bank_reconciliations_status_check 
  CHECK (status IN ('matched', 'discrepancy', 'adjusted'));

ALTER TABLE public.bank_accounts 
  ADD CONSTRAINT bank_accounts_reconciliation_status_check 
  CHECK (reconciliation_status IN ('matched', 'discrepancy', 'adjusted', 'unreconciled'));

-- 4. Safely recreate the RLS policy
DROP POLICY IF EXISTS "Admins and accountants can manage reconciliations" ON public.bank_reconciliations;

CREATE POLICY "Admins and accountants can manage reconciliations"
    ON public.bank_reconciliations FOR ALL
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
    );

-- 5. Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_bank_id ON public.bank_reconciliations(bank_id);
CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_statement_date ON public.bank_reconciliations(statement_date);
