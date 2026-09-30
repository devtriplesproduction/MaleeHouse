-- Optional signed share tokens for invoices (harder to enumerate than raw IDs)

CREATE TABLE IF NOT EXISTS public.public_share_tokens (
  token           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type   text NOT NULL CHECK (resource_type IN ('invoice', 'receipt_invoice', 'receipt_milestone')),
  resource_id     text NOT NULL,
  expires_at      timestamptz NOT NULL,
  created_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_public_share_tokens_resource
  ON public.public_share_tokens (resource_type, resource_id)
  WHERE revoked_at IS NULL;

ALTER TABLE public.public_share_tokens ENABLE ROW LEVEL SECURITY;

-- Authenticated staff can create/list their tokens; public resolve only via RPC
DROP POLICY IF EXISTS "staff manage share tokens" ON public.public_share_tokens;
CREATE POLICY "staff manage share tokens" ON public.public_share_tokens
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = (select auth.uid())
        AND pr.role IN ('admin', 'accountant', 'sales')
        AND pr.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = (select auth.uid())
        AND pr.role IN ('admin', 'accountant', 'sales')
        AND pr.is_active = true
    )
  );

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
    v_payload := public.get_public_invoice(v_tok.resource_id);
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

CREATE OR REPLACE FUNCTION public.create_public_share_token(
  p_resource_type text,
  p_resource_id text,
  p_ttl_hours int DEFAULT 168
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_token uuid;
  v_ttl int := LEAST(GREATEST(COALESCE(p_ttl_hours, 168), 1), 720);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid AND is_active = true;
  IF v_role IS NULL OR v_role NOT IN ('admin', 'accountant', 'sales') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_resource_type NOT IN ('invoice', 'receipt_invoice', 'receipt_milestone') THEN
    RAISE EXCEPTION 'Invalid resource type';
  END IF;

  INSERT INTO public.public_share_tokens (resource_type, resource_id, expires_at, created_by)
  VALUES (p_resource_type, p_resource_id, now() + (v_ttl || ' hours')::interval, v_uid)
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_public_share_token(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_public_share_token(text, text, int) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.create_public_share_token(text, text, int) FROM anon;
