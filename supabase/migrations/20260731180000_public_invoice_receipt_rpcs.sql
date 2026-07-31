-- Public-safe invoice/receipt readers — no service_role in Next pages.
-- Only non-draft / non-cancelled financial rows are exposed.

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
      WHERE pay.invoice_id = i.id AND pay.status IN ('verified', 'paid', 'approved')
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

CREATE OR REPLACE FUNCTION public.get_public_receipt(
  p_id text,
  p_type text DEFAULT 'invoice'
)
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

  IF p_type = 'milestone' THEN
    SELECT jsonb_build_object(
      'id', m.id,
      'title', m.title,
      'amount', m.amount,
      'project_id', m.project_id,
      'created_at', m.created_at,
      'updated_at', m.updated_at,
      'status', m.status,
      'projects', jsonb_build_object(
        'name', p.name,
        'client_name', p.client_name,
        'gst_number', p.gst_number
      )
    )
    INTO v_row
    FROM public.project_milestones m
    LEFT JOIN public.projects p ON p.id = m.project_id AND p.deleted_at IS NULL
    WHERE m.id = p_id
      AND m.status IN ('paid', 'invoiced');
  ELSE
    SELECT jsonb_build_object(
      'id', i.id,
      'invoice_number', i.invoice_number,
      'total_amount', i.total_amount,
      'created_at', i.created_at,
      'project_id', i.project_id,
      'status', i.status,
      'projects', jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'client_name', p.client_name,
        'gst_number', p.gst_number
      )
    )
    INTO v_row
    FROM public.invoices i
    LEFT JOIN public.projects p ON p.id = i.project_id AND p.deleted_at IS NULL
    WHERE i.id = p_id
      AND i.status IS DISTINCT FROM 'draft'
      AND i.status IS DISTINCT FROM 'cancelled';
  END IF;

  RETURN v_row;
END;
$$;

-- Callable by anon (public share links) — functions only return non-sensitive slices
GRANT EXECUTE ON FUNCTION public.get_public_invoice(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_receipt(text, text) TO anon, authenticated, service_role;
