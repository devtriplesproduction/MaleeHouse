-- Function to get active project financials optimized
-- Aggregates quotations and payments in PostgreSQL instead of Node.js using Grouped Joins

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
        SELECT 
            project_id,
            MAX(CASE WHEN status::text ILIKE 'approved' THEN total_amount ELSE NULL END) as approved_amt,
            MAX(total_amount) as max_amt
        FROM quotations
        GROUP BY project_id
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
        COALESCE(qa.approved_amt, qa.max_amt, 0) AS contract_value,
        COALESCE(pa.received_amount, 0) AS received_amount,
        GREATEST(0, COALESCE(qa.approved_amt, qa.max_amt, 0) - COALESCE(pa.received_amount, 0)) AS pending_amount,
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
