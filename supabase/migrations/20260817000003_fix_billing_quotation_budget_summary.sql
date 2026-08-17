-- ============================================================
-- Migration: 20260817000003_fix_billing_quotation_budget_summary.sql
-- Purpose: Use only the latest/current Approved quotation for project budget,
--          contract value, billing summary, and outstanding balance calculations.
-- ============================================================

-- 1. Update get_billing_workspace_summary
CREATE OR REPLACE FUNCTION get_billing_workspace_summary(workspace_id uuid DEFAULT NULL)
RETURNS TABLE (
  id text,
  name text,
  client_name text,
  status text,
  base_budget numeric,
  deleted_at timestamptz,
  total_invoiced numeric,
  total_paid numeric,
  milestone_sum numeric,
  quotation_sum numeric,
  budget numeric,
  pending_balance numeric,
  invoice_count bigint,
  payment_count bigint,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT 
    p.id,
    p.name,
    p.client_name,
    p.status,
    p.budget AS base_budget,
    p.deleted_at,
    COALESCE(i.total_invoiced, 0) AS total_invoiced,
    COALESCE(pay.total_paid, 0) AS total_paid,
    COALESCE(m.milestone_sum, 0) AS milestone_sum,
    COALESCE(q.total_amount, 0) AS quotation_sum,
    COALESCE(q.total_amount, p.budget, 0) AS budget,
    GREATEST(0, COALESCE(q.total_amount, p.budget, 0) - COALESCE(pay.total_paid, 0)) AS pending_balance,
    COALESCE(i.invoice_count, 0) AS invoice_count,
    COALESCE(pay.payment_count, 0) AS payment_count,
    p.updated_at
  FROM projects p
  LEFT JOIN (
    SELECT project_id, SUM(total_amount) AS total_invoiced, COUNT(invoices.id) AS invoice_count 
    FROM invoices 
    WHERE invoices.status != 'cancelled' 
    GROUP BY project_id
  ) i ON p.id = i.project_id
  LEFT JOIN (
    SELECT project_id, SUM(amount) AS total_paid, COUNT(payments.id) AS payment_count 
    FROM payments 
    WHERE payments.status = 'verified' 
    GROUP BY project_id
  ) pay ON p.id = pay.project_id
  LEFT JOIN (
    SELECT project_id, SUM(amount) AS milestone_sum 
    FROM project_milestones 
    GROUP BY project_id
  ) m ON p.id = m.project_id
  LEFT JOIN (
    SELECT DISTINCT ON (project_id)
      project_id, 
      total_amount
    FROM quotations 
    WHERE status = 'Approved' 
    ORDER BY project_id, updated_at DESC, created_at DESC
  ) q ON p.id = q.project_id
  WHERE p.deleted_at IS NULL;
$$;

-- 2. Update get_project_financials_summary
CREATE OR REPLACE FUNCTION public.get_project_financials_summary(
    statuses text[] DEFAULT NULL
)
RETURNS TABLE (
    id text,
    name text,
    client_name text,
    status text,
    is_frozen boolean,
    contract_value numeric,
    received_amount numeric,
    pending_amount numeric,
    created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    WITH quote_aggs AS (
        SELECT DISTINCT ON (project_id)
            project_id,
            total_amount as approved_amt
        FROM quotations
        WHERE status = 'Approved'
        ORDER BY project_id, updated_at DESC, created_at DESC
    ),
    payment_aggs AS (
        SELECT
            project_id,
            SUM(amount) as received_amount
        FROM payments
        WHERE status = 'verified'
        GROUP BY project_id
    )
    SELECT 
        p.id,
        p.name,
        p.client_name,
        p.status,
        p.is_frozen,
        COALESCE(qa.approved_amt, p.budget, 0) AS contract_value,
        COALESCE(pa.received_amount, 0) AS received_amount,
        GREATEST(0, COALESCE(qa.approved_amt, p.budget, 0) - COALESCE(pa.received_amount, 0)) AS pending_amount,
        p.created_at
    FROM projects p
    LEFT JOIN quote_aggs qa ON p.id = qa.project_id
    LEFT JOIN payment_aggs pa ON p.id = pa.project_id
    WHERE p.deleted_at IS NULL
      AND p.status != 'archived'
      AND (statuses IS NULL OR p.status = ANY(statuses))
      AND (
          public.get_user_role() IN ('admin', 'sales', 'accountant', 'hr')
          OR EXISTS (
              SELECT 1 FROM project_assignments pa_filter 
              WHERE pa_filter.project_id = p.id AND pa_filter.user_id = auth.uid()
          )
      )
    ORDER BY p.created_at DESC;
$$;

-- 3. Update get_outstanding_balances
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
    SELECT DISTINCT ON (project_id)
      project_id, 
      COALESCE(total_amount, 0) AS quotation_total
    FROM quotations
    WHERE status = 'Approved'
    ORDER BY project_id, updated_at DESC, created_at DESC
  ),
  billable_visits AS (
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
      COALESCE(pq.quotation_total, p.budget, 0) AS budget,
      (COALESCE(pq.quotation_total, p.budget, 0) + COALESCE(pv.visits_total, 0)) AS totalBilled,
      COALESCE(pi.total_paid, 0) AS totalPaid,
      ((COALESCE(pq.quotation_total, p.budget, 0) + COALESCE(pv.visits_total, 0)) - COALESCE(pi.total_paid, 0)) AS outstanding,
      COALESCE(pe.total_expenses, 0) AS totalExpenses,
      ((COALESCE(pq.quotation_total, p.budget, 0) + COALESCE(pv.visits_total, 0)) - COALESCE(pe.total_expenses, 0)) AS currentProfit
    FROM projects p
    LEFT JOIN project_quotations pq ON p.id = pq.project_id
    LEFT JOIN billable_visits pv ON p.id = pv.project_id
    LEFT JOIN project_invoices pi ON p.id = pi.project_id
    LEFT JOIN project_expenses pe ON p.id = pe.project_id
    WHERE p.deleted_at IS NULL
  )
  SELECT 
    aggregated.id,
    aggregated.name,
    aggregated.client_name,
    aggregated.status,
    aggregated.budget,
    aggregated.totalBilled,
    aggregated.totalPaid,
    aggregated.outstanding,
    aggregated.totalExpenses,
    aggregated.currentProfit
  FROM aggregated;
END;
$$ LANGUAGE plpgsql;
