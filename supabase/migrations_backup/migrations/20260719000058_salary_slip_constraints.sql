ALTER TABLE public.salary_slips 
ADD CONSTRAINT unique_snapshot_salary_slip UNIQUE (snapshot_id);
