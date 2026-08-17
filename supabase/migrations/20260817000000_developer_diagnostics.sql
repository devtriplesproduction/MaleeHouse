-- ============================================================
-- FILE: 20260817000000_developer_diagnostics.sql
-- PURPOSE: Create tables for Error Logs and Performance Metrics
-- ============================================================

-- ERROR LOGS
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  stack_trace TEXT,
  module TEXT,
  severity TEXT DEFAULT 'MEDIUM',
  path TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developers can view error logs" ON public.error_logs;

CREATE POLICY "Developers can view error logs" 
ON public.error_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'developer'
  )
);


COMMENT ON TABLE public.error_logs IS 'System error logs and exceptions tracking.';

-- PERFORMANCE METRICS
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  method TEXT,
  duration_ms INTEGER NOT NULL,
  status_code INTEGER,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_perf_metrics_path ON public.performance_metrics(path);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_created_at ON public.performance_metrics(created_at DESC);

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developers can view performance metrics" ON public.performance_metrics;

CREATE POLICY "Developers can view performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'developer'
  )
);

COMMENT ON TABLE public.performance_metrics IS 'System performance metrics for API and Server Actions.';
