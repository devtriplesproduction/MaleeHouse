-- Expose bank details on public invoices
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
      'client_contact', p.client_contact,
      'gst_number', p.gst_number,
      'budget', p.budget,
      'site_details', p.site_details
    ),
    'bank', CASE WHEN b.id IS NOT NULL THEN jsonb_build_object(
      'bank_name', b.bank_name,
      'account_name', b.account_name,
      'account_number', b.account_number,
      'ifsc_code', b.ifsc_code
    ) ELSE NULL END,
    'payments', coalesce((
      SELECT jsonb_agg(jsonb_build_object('amount', pay.amount, 'status', pay.status))
      FROM public.payments pay
      WHERE pay.invoice_id = i.id AND pay.status IN ('verified', 'paid', 'approved')
    ), '[]'::jsonb)
  )
  INTO v_row
  FROM public.invoices i
  LEFT JOIN public.projects p ON p.id = i.project_id AND p.deleted_at IS NULL
  LEFT JOIN public.bank_accounts b ON b.id = i.bank_id
  WHERE i.id = p_id
    AND i.status IS DISTINCT FROM 'draft'
    AND i.status IS DISTINCT FROM 'cancelled';

  RETURN v_row;
END;
$$;
