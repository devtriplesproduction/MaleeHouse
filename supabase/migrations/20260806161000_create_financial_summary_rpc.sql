-- Function to calculate financial summaries for the Reports page
-- Replaces heavy Node.js array looping and nested fetches with optimized PostgreSQL CTEs

CREATE OR REPLACE FUNCTION public.get_financial_summary_report(
    start_date timestamptz,
    end_date timestamptz
)
RETURNS TABLE (
    "projectId" text,
    "quotationNo" text,
    "projectName" text,
    "contactNo" text,
    "serviceType" text,
    "location" text,
    "totalInvoiceValue" numeric,
    "budgetExpences" numeric,
    "totalExpences" numeric,
    "totalReceived" numeric,
    "totalPending" numeric,
    "totalProfitLoss" numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    WITH invoice_aggs AS (
        SELECT project_id, SUM(amount) as total_invoiced
        FROM invoices
        WHERE status NOT IN ('cancelled', 'rejected')
        GROUP BY project_id
    ),
    payment_aggs AS (
        SELECT project_id, SUM(amount) as total_received
        FROM payments
        WHERE status != 'rejected'
        GROUP BY project_id
    ),
    expense_aggs AS (
        SELECT project_id, SUM(amount) as total_expenses
        FROM expenses
        GROUP BY project_id
    ),
    visit_aggs AS (
        SELECT project_id, SUM(visit_cost) as total_visit_cost
        FROM project_visits
        GROUP BY project_id
    ),
    finance_aggs AS (
        SELECT project_id, MAX(total_quoted_amount) as budget_expenses
        FROM project_finances
        GROUP BY project_id
    )
    SELECT 
        p.id as "projectId",
        'N/A' as "quotationNo",
        p.name || ' / ' || COALESCE(p.client_name, 'N/A') as "projectName",
        COALESCE(p.client_contact, 'N/A') as "contactNo",
        COALESCE(p.site_type, 'General') as "serviceType",
        COALESCE(p.client_address, 'N/A') as "location",
        COALESCE(ia.total_invoiced, 0) as "totalInvoiceValue",
        COALESCE(fa.budget_expenses, 0) as "budgetExpences",
        (COALESCE(ea.total_expenses, 0) + COALESCE(va.total_visit_cost, 0)) as "totalExpences",
        COALESCE(pa.total_received, 0) as "totalReceived",
        GREATEST(0, COALESCE(ia.total_invoiced, 0) - COALESCE(pa.total_received, 0)) as "totalPending",
        COALESCE(ia.total_invoiced, 0) - (COALESCE(ea.total_expenses, 0) + COALESCE(va.total_visit_cost, 0)) as "totalProfitLoss"
    FROM projects p
    LEFT JOIN invoice_aggs ia ON p.id = ia.project_id
    LEFT JOIN payment_aggs pa ON p.id = pa.project_id
    LEFT JOIN expense_aggs ea ON p.id = ea.project_id
    LEFT JOIN visit_aggs va ON p.id = va.project_id
    LEFT JOIN finance_aggs fa ON p.id = fa.project_id
    WHERE p.created_at >= start_date 
      AND p.created_at <= end_date
      AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC;
$$;
