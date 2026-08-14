-- Migration: Create get_outstanding_balances RPC

CREATE OR REPLACE FUNCTION get_outstanding_balances()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  client_name TEXT,
  status TEXT,
  budget NUMERIC,
  "totalBilled" NUMERIC,
  "totalPaid" NUMERIC,
  "outstanding" NUMERIC,
  "totalExpenses" NUMERIC,
  "currentProfit" NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH project_quotations AS (
    SELECT project_id, COALESCE(SUM(total_amount), 0) AS quotation_total
    FROM quotations
    WHERE quotations.status = 'Approved'
    GROUP BY project_id
  ),
  project_visits AS (
    SELECT project_id, COALESCE(SUM(visit_cost), 0) AS visits_total
    FROM project_visits
    WHERE is_billable = true
    GROUP BY project_id
  ),
  project_invoices AS (
    SELECT project_id, COALESCE(SUM(total_amount), 0) AS total_paid
    FROM invoices
    WHERE invoices.status = 'paid'
    GROUP BY project_id
  ),
  project_expenses AS (
    SELECT project_id, COALESCE(SUM(amount), 0) AS total_expenses
    FROM expenses
    GROUP BY project_id
  ),
  aggregated AS (
    SELECT 
      p.id,
      p.name,
      p.client_name,
      p.status,
      COALESCE(p.budget, 0) AS budget,
      (COALESCE(pq.quotation_total, 0) + COALESCE(pv.visits_total, 0)) AS totalBilled,
      COALESCE(pi.total_paid, 0) AS totalPaid,
      ((COALESCE(pq.quotation_total, 0) + COALESCE(pv.visits_total, 0)) - COALESCE(pi.total_paid, 0)) AS outstanding,
      COALESCE(pe.total_expenses, 0) AS totalExpenses,
      ((COALESCE(pq.quotation_total, 0) + COALESCE(pv.visits_total, 0)) - COALESCE(pe.total_expenses, 0)) AS currentProfit
    FROM projects p
    LEFT JOIN project_quotations pq ON p.id = pq.project_id
    LEFT JOIN project_visits pv ON p.id = pv.project_id
    LEFT JOIN project_invoices pi ON p.id = pi.project_id
    LEFT JOIN project_expenses pe ON p.id = pe.project_id
    WHERE p.deleted_at IS NULL
  )
  SELECT 
    a.id,
    a.name,
    a.client_name,
    a.status,
    a.budget,
    a.totalBilled,
    a.totalPaid,
    a.outstanding,
    a.totalExpenses,
    a.currentProfit
  FROM aggregated a
  WHERE a.outstanding > 0 OR a.status != 'completed';
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Secure the function
REVOKE EXECUTE ON FUNCTION get_outstanding_balances() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_outstanding_balances() TO authenticated;
