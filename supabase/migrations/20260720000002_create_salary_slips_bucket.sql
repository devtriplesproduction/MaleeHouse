-- ============================================================
-- FILE: 20260720000000_create_salary_slips_bucket.sql
-- PURPOSE: Create salary_slips storage bucket and define RLS policies
-- ============================================================

-- 1. Create Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('salary_slips', 'salary_slips', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for salary_slips bucket

-- Admins and HR have full access to insert, select, update, delete
CREATE POLICY "Admins and HR have full access to salary slips" ON storage.objects
  FOR ALL USING (
    bucket_id = 'salary_slips' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'hr')
    )
  );

-- Employees can read their own salary slips
-- Path format: year/month/employee_id/salary-slip.pdf
CREATE POLICY "Employees can read own salary slips" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'salary_slips' AND 
    (auth.uid()::text = (storage.foldername(name))[3])
  );
