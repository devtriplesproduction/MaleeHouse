-- ============================================================
-- FILE: 20260812000002_batch_bank_balances_rpc_search_path.sql
-- PURPOSE: Fix missing search_path for SECURITY DEFINER RPC
-- ============================================================

CREATE OR REPLACE FUNCTION sync_bank_balances_rpc(p_bank_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE bank_accounts b
  SET current_balance = COALESCE(b.opening_balance, 0)
    + COALESCE((SELECT SUM(amount) FROM payments WHERE bank_id = b.id AND status = 'verified'), 0)
    - COALESCE((SELECT SUM(amount) FROM expenses WHERE bank_id = b.id), 0)
    - COALESCE((
        SELECT SUM(ps.net_payable)
        FROM payroll_snapshots ps
        JOIN payroll_cycles pc ON pc.id = ps.cycle_id
        WHERE pc.bank_id = b.id AND pc.status = 'locked'
      ), 0)
  WHERE (p_bank_id IS NULL OR b.id = p_bank_id);
END;
$$;
