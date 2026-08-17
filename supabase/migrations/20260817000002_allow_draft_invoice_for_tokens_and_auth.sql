-- Secure draft invoice access:
-- 1. Internal helper function _get_invoice_payload (private, draft selectable only by SECURITY DEFINER callers)
-- 2. Public get_public_invoice(text) strictly excludes draft and cancelled
-- 3. resolve_public_share_token(uuid) verifies token validity/expiry/revocation and allows draft access for valid tokens

-- Internal helper: not exposed to anon or authenticated directly
CREATE OR REPLACE FUNCTION public._get_invoice_payload(p_id text, p_allow_draft boolean DEFAULT false)
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
    'gst_rate', i.gst_rate,
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
      'site_details', jsonb_build_object('address', p.client_address),
      'payments', coalesce((
        SELECT jsonb_agg(jsonb_build_object('amount', pay.amount, 'status', pay.status))
        FROM public.payments pay
        WHERE pay.project_id = p.id AND (pay.status = 'verified' OR pay.status = 'paid')
      ), '[]'::jsonb),
      'quotations', coalesce((
        SELECT jsonb_agg(jsonb_build_object('total_amount', q.total_amount, 'status', q.status, 'gst_rate', q.gst_rate, 'client_details', q.client_details))
        FROM public.quotations q
        WHERE q.project_id = p.id
      ), '[]'::jsonb)
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
      WHERE pay.invoice_id = i.id AND pay.status = 'verified'
    ), '[]'::jsonb)
  )
  INTO v_row
  FROM public.invoices i
  LEFT JOIN public.projects p ON p.id = i.project_id AND p.deleted_at IS NULL
  LEFT JOIN public.bank_accounts b ON b.id = i.bank_id
  WHERE i.id = p_id
    AND (p_allow_draft = true OR i.status IS DISTINCT FROM 'draft')
    AND i.status IS DISTINCT FROM 'cancelled';

  RETURN v_row;
END;
$$;

-- Explicitly revoke access on the internal helper from public/anon/authenticated
REVOKE ALL ON FUNCTION public._get_invoice_payload(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._get_invoice_payload(text, boolean) TO service_role;

-- Public invoice RPC: strictly denies drafts and cancelled
CREATE OR REPLACE FUNCTION public.get_public_invoice(p_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public._get_invoice_payload(p_id, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_invoice(text) TO anon, authenticated, service_role;

-- Public share token resolver: checks validity, expiration, revocation, and allows draft
CREATE OR REPLACE FUNCTION public.resolve_public_share_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tok public.public_share_tokens%ROWTYPE;
  v_payload jsonb;
BEGIN
  SELECT * INTO v_tok
  FROM public.public_share_tokens
  WHERE token = p_token
    AND revoked_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_tok.resource_type = 'invoice' THEN
    v_payload := public._get_invoice_payload(v_tok.resource_id, true);
  ELSIF v_tok.resource_type = 'receipt_invoice' THEN
    v_payload := public.get_public_receipt(v_tok.resource_id, 'invoice');
  ELSIF v_tok.resource_type = 'receipt_milestone' THEN
    v_payload := public.get_public_receipt(v_tok.resource_id, 'milestone');
  END IF;

  IF v_payload IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'resource_type', v_tok.resource_type,
    'resource_id', v_tok.resource_id,
    'expires_at', v_tok.expires_at,
    'data', v_payload
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_public_share_token(uuid) TO anon, authenticated, service_role;
