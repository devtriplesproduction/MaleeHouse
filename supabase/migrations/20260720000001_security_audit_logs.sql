CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  route TEXT,
  http_method TEXT,
  status_code INTEGER,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying security events quickly
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_module ON public.security_audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_status_code ON public.security_audit_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);

-- RLS Policies
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
-- Note: Inserts to this table are performed strictly via service role client on the backend.
