-- Admin dashboard KPIs + financial overview aggregates (one round-trip each)

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_kpis()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'ongoing_projects', (
      SELECT count(*)::int FROM public.projects
      WHERE deleted_at IS NULL
        AND status IN ('prototype', 'review', 'field_work', 'data_sync', 'final_review')
    ),
    'pending_expenses', (
      SELECT count(*)::int FROM public.expenses WHERE status = 'pending'
    ),
    'pending_milestones', (
      SELECT count(*)::int FROM public.project_milestones
      WHERE status IN ('pending', 'payment_verification_pending')
    ),
    'pending_field_approvals', (
      SELECT count(*)::int FROM public.field_reports WHERE status = 'submitted'
    ),
    'equipment_issues', (
      SELECT count(*)::int FROM public.field_reports WHERE report_type = 'issue'
    ),
    'pending_eods', (
      SELECT count(*)::int FROM public.eod_reports WHERE status = 'pending'
    ),
    'project_statuses', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('status', status)), '[]'::jsonb)
      FROM (
        SELECT status FROM public.projects
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 500
      ) s
    ),
    'upcoming_holiday', (
      SELECT to_jsonb(sub)
      FROM (
        SELECT name, date
        FROM public.holidays
        WHERE date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
        ORDER BY date ASC
        LIMIT 1
      ) sub
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_financial_overview_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_year int := EXTRACT(YEAR FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'))::int;
  v_month int := EXTRACT(MONTH FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'))::int;
  v_total_income numeric := 0;
  v_total_expenses numeric := 0;
  v_month_income numeric := 0;
  v_month_expense numeric := 0;
  v_total_invoiced numeric := 0;
  v_outstanding numeric := 0;
  v_payable numeric := 0;
  v_cashflow jsonb := '[]'::jsonb;
BEGIN
  SELECT coalesce(sum(amount), 0) INTO v_total_income
  FROM public.payments
  WHERE status IS DISTINCT FROM 'rejected';

  SELECT coalesce(sum(amount), 0)
    + coalesce((SELECT sum(visit_cost) FROM public.project_visits WHERE visit_cost IS NOT NULL AND visit_cost > 0), 0)
  INTO v_total_expenses
  FROM public.expenses;

  SELECT coalesce(sum(amount), 0) INTO v_month_income
  FROM public.payments
  WHERE status IS DISTINCT FROM 'rejected'
    AND EXTRACT(YEAR FROM coalesce(payment_date, created_at AT TIME ZONE 'Asia/Kolkata')) = v_year
    AND EXTRACT(MONTH FROM coalesce(payment_date, created_at AT TIME ZONE 'Asia/Kolkata')) = v_month;

  SELECT coalesce(sum(amount), 0)
    + coalesce((
        SELECT sum(visit_cost) FROM public.project_visits
        WHERE visit_cost IS NOT NULL AND visit_cost > 0
          AND EXTRACT(YEAR FROM coalesce(scheduled_date, created_at AT TIME ZONE 'Asia/Kolkata')) = v_year
          AND EXTRACT(MONTH FROM coalesce(scheduled_date, created_at AT TIME ZONE 'Asia/Kolkata')) = v_month
      ), 0)
  INTO v_month_expense
  FROM public.expenses
  WHERE EXTRACT(YEAR FROM coalesce(expense_date, created_at AT TIME ZONE 'Asia/Kolkata')) = v_year
    AND EXTRACT(MONTH FROM coalesce(expense_date, created_at AT TIME ZONE 'Asia/Kolkata')) = v_month;

  SELECT coalesce(sum(total_amount), 0) INTO v_total_invoiced
  FROM public.invoices
  WHERE status IS DISTINCT FROM 'cancelled';

  SELECT coalesce(sum(total_amount), 0) INTO v_outstanding
  FROM public.invoices
  WHERE status IN ('pending', 'issued', 'sent');

  SELECT coalesce(sum(amount), 0) INTO v_payable
  FROM public.expenses
  WHERE status = 'pending';

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'month', to_char(make_date(v_year, m.mon, 1), 'Mon'),
      'income', m.income,
      'expense', m.expense
    ) ORDER BY m.mon
  ), '[]'::jsonb)
  INTO v_cashflow
  FROM (
    SELECT
      gs.mon,
      coalesce((
        SELECT sum(p.amount) FROM public.payments p
        WHERE p.status IS DISTINCT FROM 'rejected'
          AND EXTRACT(YEAR FROM coalesce(p.payment_date, p.created_at AT TIME ZONE 'Asia/Kolkata')) = v_year
          AND EXTRACT(MONTH FROM coalesce(p.payment_date, p.created_at AT TIME ZONE 'Asia/Kolkata')) = gs.mon
      ), 0) AS income,
      coalesce((
        SELECT sum(e.amount) FROM public.expenses e
        WHERE EXTRACT(YEAR FROM coalesce(e.expense_date, e.created_at AT TIME ZONE 'Asia/Kolkata')) = v_year
          AND EXTRACT(MONTH FROM coalesce(e.expense_date, e.created_at AT TIME ZONE 'Asia/Kolkata')) = gs.mon
      ), 0)
      + coalesce((
        SELECT sum(v.visit_cost) FROM public.project_visits v
        WHERE v.visit_cost IS NOT NULL AND v.visit_cost > 0
          AND EXTRACT(YEAR FROM coalesce(v.scheduled_date, v.created_at AT TIME ZONE 'Asia/Kolkata')) = v_year
          AND EXTRACT(MONTH FROM coalesce(v.scheduled_date, v.created_at AT TIME ZONE 'Asia/Kolkata')) = gs.mon
      ), 0) AS expense
    FROM generate_series(1, 12) AS gs(mon)
  ) m;

  RETURN jsonb_build_object(
    'totalIncome', v_total_income,
    'totalExpenses', v_total_expenses,
    'monthlyProfit', v_month_income - v_month_expense,
    'accountsReceivable', greatest(0, v_total_invoiced - v_total_income),
    'outstandingPayments', v_outstanding,
    'accountsPayable', v_payable,
    'monthlyCashFlow', v_cashflow,
    'expenseByCategory', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('category', category, 'amount', amount)), '[]'::jsonb)
      FROM (
        SELECT coalesce(category, 'Other') AS category, sum(amount) AS amount
        FROM public.expenses
        GROUP BY 1
      ) cats
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_kpis() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_dashboard_kpis() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_kpis() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_financial_overview_summary() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_financial_overview_summary() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_financial_overview_summary() TO authenticated, service_role;
