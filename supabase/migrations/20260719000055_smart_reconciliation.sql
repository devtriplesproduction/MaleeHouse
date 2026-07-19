-- 1. Drop existing unique constraint to allow multiple historical snapshots
ALTER TABLE public.bank_reconciliations 
  DROP CONSTRAINT IF EXISTS unique_bank_statement_date;

-- 2. Add columns (including is_current, superseded_at, superseded_by, and review columns)
ALTER TABLE public.bank_reconciliations
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'normal' CHECK (review_status IN ('normal', 'needs_review')),
  ADD COLUMN IF NOT EXISTS review_trigger_type TEXT,
  ADD COLUMN IF NOT EXISTS review_trigger_date DATE,
  ADD COLUMN IF NOT EXISTS review_triggered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_triggered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Add unique index for only CURRENT reconciliations per date
CREATE UNIQUE INDEX IF NOT EXISTS unique_current_reconciliation 
  ON public.bank_reconciliations (bank_id, statement_date) 
  WHERE (is_current = true);

-- 4. Add review status cache to bank_accounts
ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS reconciliation_review_status TEXT DEFAULT 'normal' CHECK (reconciliation_review_status IN ('normal', 'needs_review'));

-- 5. Create Security Definer RPC to securely flag backdated transactions bypassing RLS
CREATE OR REPLACE FUNCTION public.flag_backdated_reconciliations(
  p_bank_id UUID, 
  p_transaction_date DATE, 
  p_trigger_type TEXT, 
  p_triggered_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Flag only CURRENT active snapshots that are stale because of the backdated transaction
  UPDATE bank_reconciliations
  SET review_status = 'needs_review',
      review_trigger_type = p_trigger_type,
      review_trigger_date = p_transaction_date,
      review_triggered_by = p_triggered_by,
      review_triggered_at = NOW()
  WHERE bank_id = p_bank_id
    AND statement_date >= p_transaction_date
    AND review_status <> 'needs_review'
    AND status IS NOT NULL
    AND is_current = true;

  -- If any reconciliations were flagged, update the bank account summary cache
  IF FOUND THEN
    UPDATE bank_accounts
    SET reconciliation_review_status = 'needs_review'
    WHERE id = p_bank_id;
  END IF;
END;
$$;

-- 6. Create Security Definer RPC to handle save/update of reconciliations with audit trail preservation
CREATE OR REPLACE FUNCTION public.save_reconciliation(
  p_bank_id UUID,
  p_statement_date DATE,
  p_statement_balance NUMERIC,
  p_notes TEXT,
  p_status TEXT,
  p_adjustment_amount NUMERIC,
  p_adjustment_reason TEXT,
  p_reconciled_by UUID,
  p_opening_balance NUMERIC,
  p_erp_balance NUMERIC,
  p_transaction_count INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_existing_id UUID;
  v_existing_review_status TEXT;
BEGIN
  -- Check caller authorization
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('admin', 'accountant') THEN
    RAISE EXCEPTION 'Access denied. Only Admins and Accountants can save reconciliations.';
  END IF;

  -- Find the current active reconciliation for this date
  SELECT id, review_status INTO v_existing_id, v_existing_review_status
  FROM bank_reconciliations
  WHERE bank_id = p_bank_id AND statement_date = p_statement_date AND is_current = true;

  IF v_existing_id IS NOT NULL THEN
    -- If it exists, we can ONLY supersede it if it is currently marked 'needs_review'
    IF v_existing_review_status != 'needs_review' THEN
      RAISE EXCEPTION 'This period is already reconciled and locked. You can only re-reconcile periods marked as Needs Review.';
    END IF;
    
    -- Mark the existing one as superseded (is_current = false), tracking when and who did it.
    UPDATE bank_reconciliations
    SET is_current = false,
        superseded_at = NOW(),
        superseded_by = auth.uid()
    WHERE id = v_existing_id;
  END IF;

  -- Insert the new active reconciliation snapshot
  BEGIN
    INSERT INTO bank_reconciliations (
      bank_id, statement_date, opening_balance, erp_balance, statement_balance, 
      difference, transaction_count, status, adjustment_amount, adjustment_reason, 
      reconciled_by, notes, review_status, is_current
    ) VALUES (
      p_bank_id, p_statement_date, p_opening_balance, p_erp_balance, p_statement_balance,
      p_erp_balance - p_statement_balance, p_transaction_count, p_status, p_adjustment_amount, p_adjustment_reason,
      p_reconciled_by, p_notes, 'normal', true
    );
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'A current reconciliation is already active for this period. Please refresh and try again.';
  END;

  -- Update cached statistics on bank_accounts
  UPDATE bank_accounts
  SET last_reconciled_at = NOW(),
      last_reconciled_balance = p_statement_balance,
      reconciliation_status = p_status
  WHERE id = p_bank_id;

  -- Reset bank reconciliation_review_status back to normal if no CURRENT snapshots are left in needs_review
  IF NOT EXISTS (
    SELECT 1 FROM bank_reconciliations 
    WHERE bank_id = p_bank_id AND review_status = 'needs_review' AND is_current = true
  ) THEN
    UPDATE bank_accounts
    SET reconciliation_review_status = 'normal'
    WHERE id = p_bank_id;
  END IF;
END;
$$;
