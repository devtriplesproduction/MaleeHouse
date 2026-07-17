-- Migration 47: Material Requests Table

CREATE TABLE IF NOT EXISTS public.material_requests (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'delivered', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;

-- Admins and engineers can see all material requests
CREATE POLICY "Admin and engineers can view all material requests"
  ON public.material_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'engineer')
    )
  );

-- Admins and engineers can update material requests
CREATE POLICY "Admin and engineers can update material requests"
  ON public.material_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'engineer')
    )
  );

-- Field workers can view their own requests
CREATE POLICY "Users can view their own material requests"
  ON public.material_requests FOR SELECT
  USING (requested_by = auth.uid());

-- Field workers can insert their own requests
CREATE POLICY "Users can insert their own material requests"
  ON public.material_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_material_requests_project_id ON public.material_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_requested_by ON public.material_requests(requested_by);
