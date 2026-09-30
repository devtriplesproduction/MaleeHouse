-- Migration to optimize financial report aggregations strictly matching existing business logic

DROP FUNCTION IF EXISTS get_revenue_by_project(timestamptz, timestamptz, uuid);
DROP FUNCTION IF EXISTS get_expense_by_category(timestamptz, timestamptz, uuid);
DROP FUNCTION IF EXISTS get_income_statement_transactions(timestamptz, timestamptz, uuid);
DROP FUNCTION IF EXISTS get_balance_sheet_summary(timestamptz, uuid);
DROP FUNCTION IF EXISTS get_project_statement_summary(uuid);
DROP FUNCTION IF EXISTS get_project_budget_sheet_summary(uuid);
DROP FUNCTION IF EXISTS get_project_actual_sheet_summary(uuid);

-- 1. get_revenue_by_project
CREATE OR REPLACE FUNCTION get_revenue_by_project(
    p_start_date timestamptz,
    p_end_date timestamptz,
    p_project_id text DEFAULT NULL
)
RETURNS TABLE (
    project_name text,
    total_amount numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(pr.name, 'Company-wide') as project_name,
        SUM(p.amount) as total_amount
    FROM payments p
    LEFT JOIN projects pr ON p.project_id = pr.id
    WHERE p.created_at >= p_start_date AND p.created_at <= p_end_date
      AND p.status != 'rejected'
      AND (p_project_id IS NULL OR p.project_id = p_project_id)
    GROUP BY COALESCE(pr.name, 'Company-wide');
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 2. get_expense_by_category
CREATE OR REPLACE FUNCTION get_expense_by_category(
    p_start_date timestamptz,
    p_end_date timestamptz,
    p_project_id text DEFAULT NULL
)
RETURNS TABLE (
    category text,
    total_amount numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH all_expenses AS (
        SELECT COALESCE(e.category, 'Other') as cat, e.amount as amount
        FROM expenses e
        WHERE e.expense_date >= p_start_date AND e.expense_date <= p_end_date
          AND (p_project_id IS NULL OR e.project_id = p_project_id)
        UNION ALL
        SELECT 'Field Visit' as cat, v.visit_cost as amount
        FROM project_visits v
        WHERE v.created_at >= p_start_date AND v.created_at <= p_end_date
          AND (p_project_id IS NULL OR v.project_id = p_project_id)
          AND v.visit_cost > 0
    )
    SELECT cat as category, SUM(amount) as total_amount
    FROM all_expenses
    GROUP BY cat;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;


-- 3. get_income_statement_transactions
CREATE OR REPLACE FUNCTION get_income_statement_transactions(
    p_start_date timestamptz,
    p_end_date timestamptz,
    p_project_id text DEFAULT NULL
)
RETURNS TABLE (
    date timestamptz,
    project text,
    amount numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.created_at as date,
        COALESCE(pr.name, 'Company-wide') as project,
        p.amount as amount
    FROM payments p
    LEFT JOIN projects pr ON p.project_id = pr.id
    WHERE p.created_at >= p_start_date AND p.created_at <= p_end_date
      AND p.status != 'rejected'
      AND (p_project_id IS NULL OR p.project_id = p_project_id)
    ORDER BY p.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 4. get_balance_sheet_summary
CREATE OR REPLACE FUNCTION get_balance_sheet_summary(
    p_as_of_date timestamptz,
    p_project_id text DEFAULT NULL
)
RETURNS TABLE (
    total_income numeric,
    total_expenses numeric,
    total_visit_cost numeric,
    total_invoiced numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH payments_agg AS (
        SELECT SUM(amount) as total_inc
        FROM payments
        WHERE created_at <= p_as_of_date
          AND status != 'rejected'
          AND (p_project_id IS NULL OR project_id = p_project_id)
    ),
    expenses_agg AS (
        SELECT SUM(amount) as total_exp
        FROM expenses
        WHERE expense_date <= p_as_of_date
          AND (p_project_id IS NULL OR project_id = p_project_id)
    ),
    visits_agg AS (
        SELECT SUM(visit_cost) as total_vis
        FROM project_visits
        WHERE created_at <= p_as_of_date
          AND status != 'cancelled'
          AND visit_cost > 0
          AND (p_project_id IS NULL OR project_id = p_project_id)
    ),
    invoices_agg AS (
        SELECT SUM(total_amount) as total_inv
        FROM invoices
        WHERE created_at <= p_as_of_date
          AND status != 'cancelled'
          AND (p_project_id IS NULL OR project_id = p_project_id)
    )
    SELECT 
        COALESCE((SELECT total_inc FROM payments_agg), 0) as total_income,
        COALESCE((SELECT total_exp FROM expenses_agg), 0) as total_expenses,
        COALESCE((SELECT total_vis FROM visits_agg), 0) as total_visit_cost,
        COALESCE((SELECT total_inv FROM invoices_agg), 0) as total_invoiced;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 5. get_project_statement_summary
CREATE OR REPLACE FUNCTION get_project_statement_summary(p_project_id text)
RETURNS TABLE (
    id uuid,
    title text,
    base_amount numeric,
    gst_amount numeric,
    total_amount numeric,
    status text,
    due_date date
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.title,
        pm.amount as base_amount,
        (pm.amount * 0.09) + (pm.amount * 0.09) as gst_amount,
        pm.amount + (pm.amount * 0.09) * 2 as total_amount,
        pm.status,
        pm.due_date
    FROM project_milestones pm
    WHERE pm.project_id = p_project_id
    ORDER BY pm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 6. get_project_budget_sheet_summary
CREATE OR REPLACE FUNCTION get_project_budget_sheet_summary(p_project_id text)
RETURNS TABLE (
    category text,
    description text,
    amount numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(e.category, 'General') as category,
        COALESCE(e.description, 'Expense') as description,
        e.amount
    FROM expenses e
    WHERE e.project_id = p_project_id
    ORDER BY e.created_at DESC
    LIMIT 500;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 7. get_project_actual_sheet_summary
CREATE OR REPLACE FUNCTION get_project_actual_sheet_summary(p_project_id text)
RETURNS TABLE (
    date timestamptz,
    particulars text,
    debit numeric,
    credit numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.created_at as date,
        'Payment Received'::text as particulars,
        NULL::numeric as debit,
        COALESCE(p.amount, 0) as credit
    FROM payments p
    WHERE p.project_id = p_project_id
    UNION ALL
    SELECT 
        e.expense_date as date,
        (e.category || ' - ' || COALESCE(e.description, ''))::text as particulars,
        COALESCE(e.amount, 0) as debit,
        NULL::numeric as credit
    FROM expenses e
    WHERE e.project_id = p_project_id
    ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
