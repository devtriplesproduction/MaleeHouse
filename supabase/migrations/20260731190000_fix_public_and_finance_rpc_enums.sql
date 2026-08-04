-- Fix enum mismatches in production RPCs

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

  -- invoice_status: draft | sent | paid | overdue | cancelled | accepted | rejected | in_review | pending
  SELECT coalesce(sum(total_amount), 0) INTO v_outstanding
  FROM public.invoices
  WHERE status IN ('pending', 'sent', 'overdue', 'in_review');

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

CREATE OR REPLACE FUNCTION public.get_public_invoice(p_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row jsonb;
BEGIN
  IF p_id IS NULL OR length(trim(p_id)) < 3 OR length(p_id) > 80 THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', i.id,
    'invoice_number', i.invoice_number,
    'amount', i.amount,
    'gst_amount', i.gst_amount,
    'total_amount', i.total_amount,
    'status', i.status,
    'due_date', i.due_date,
    'created_at', i.created_at,
    'project_id', i.project_id,
    'projects', jsonb_build_object(
      'name', p.name,
      'client_name', p.client_name,
      'budget', p.budget
    ),
    'payments', coalesce((
      SELECT jsonb_agg(jsonb_build_object('amount', pay.amount, 'status', pay.status))
      FROM public.payments pay
      WHERE pay.invoice_id = i.id AND pay.status = 'verified'
    ), '[]'::jsonb)
  )
  INTO v_row
  FROM public.invoices i
  LEFT JOIN public.projects p ON p.id = i.project_id AND p.deleted_at IS NULL
  WHERE i.id = p_id
    AND i.status IS DISTINCT FROM 'draft'
    AND i.status IS DISTINCT FROM 'cancelled';

  RETURN v_row;
END;
$$;
