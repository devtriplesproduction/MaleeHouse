-- ============================================================
-- FILE: 56_salary_increments.sql
-- PURPOSE: Create table to track employee salary increments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.salary_increments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_salary         NUMERIC(12, 2) NOT NULL,
  new_salary              NUMERIC(12, 2) NOT NULL,
  increment_amount        NUMERIC(12, 2),
  increment_percentage    NUMERIC(5, 2),
  effective_date          DATE NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  created_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.salary_increments ENABLE ROW LEVEL SECURITY;

-- Create policies (admin/HR can do everything, employees can read their own)
CREATE POLICY "Admins and HR can read all salary increments"
  ON public.salary_increments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admins and HR can insert salary increments"
  ON public.salary_increments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Employees can read own salary increments"
  ON public.salary_increments FOR SELECT
  USING (employee_id = auth.uid());
