-- Migration: create_get_billing_workspace_summary_rpc
-- Purpose: Move billing calculations to the database to eliminate massive nested JSON payloads.

-- 1. Create Performance Indexes (omitting workspace_id since it does not exist in schema)
CREATE INDEX IF NOT EXISTS idx_invoices_project_status ON invoices (project_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_project_status ON payments (project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones (project_id);
CREATE INDEX IF NOT EXISTS idx_quotations_project_status ON quotations (project_id, status);

-- 2. Create the RPC function
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
    COALESCE(q.quotation_sum, 0) AS quotation_sum,
    GREATEST(COALESCE(p.budget, 0), COALESCE(q.quotation_sum, 0), COALESCE(m.milestone_sum, 0)) AS budget,
    GREATEST(0, GREATEST(COALESCE(p.budget, 0), COALESCE(q.quotation_sum, 0), COALESCE(m.milestone_sum, 0)) - COALESCE(pay.total_paid, 0)) AS pending_balance,
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
    SELECT project_id, SUM(total_amount) AS quotation_sum 
    FROM quotations 
    WHERE quotations.status = 'Approved' 
    GROUP BY project_id
  ) q ON p.id = q.project_id
  WHERE p.deleted_at IS NULL;
$$;
