-- Migration: Create get_project_profitability RPC

CREATE OR REPLACE FUNCTION get_project_profitability()
RETURNS TABLE (
  id UUID,
  name TEXT,
  invoiced NUMERIC,
  expenses NUMERIC,
  margin NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH project_invoices AS (
    SELECT project_id, COALESCE(SUM(total_amount), 0) AS invoiced
    FROM invoices
    WHERE status != 'cancelled'
    GROUP BY project_id
  ),
  project_expenses AS (
    SELECT project_id, COALESCE(SUM(amount), 0) AS expenses
    FROM expenses
    WHERE project_id IS NOT NULL
    GROUP BY project_id
  )
  SELECT 
    p.id,
    p.name,
    COALESCE(pi.invoiced, 0) AS invoiced,
    COALESCE(pe.expenses, 0) AS expenses,
    (COALESCE(pi.invoiced, 0) - COALESCE(pe.expenses, 0)) AS margin
  FROM projects p
  LEFT JOIN project_invoices pi ON p.id = pi.project_id
  LEFT JOIN project_expenses pe ON p.id = pe.project_id
  WHERE p.deleted_at IS NULL
  ORDER BY margin DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
