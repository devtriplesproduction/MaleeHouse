-- ============================================================
-- FILE: 20260719000057_salary_slips.sql
-- PURPOSE: Create table to track generated salary slips
-- ============================================================

CREATE TABLE IF NOT EXISTS public.salary_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.payroll_cycles(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES public.payroll_snapshots(id) ON DELETE CASCADE,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  emailed BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'generated'
);

-- Enable RLS
ALTER TABLE public.salary_slips ENABLE ROW LEVEL SECURITY;

-- Create policies (admin/HR can manage everything, employees can read their own)
CREATE POLICY "Admins and HR can manage all salary slips"
  ON public.salary_slips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Employees can read own salary slips"
  ON public.salary_slips FOR SELECT
  USING (employee_id = auth.uid());
