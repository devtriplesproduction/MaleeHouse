-- ============================================================
-- FILE: 20260719000059_additional_payroll_constraints.sql
-- PURPOSE: Add unique constraints to payroll schema
-- ============================================================

-- Ensure each employee only has one salary slip per payroll cycle
ALTER TABLE public.salary_slips 
ADD CONSTRAINT unique_employee_cycle_slip UNIQUE (employee_id, cycle_id);

-- Ensure there is only ever one payroll cycle per month/year
ALTER TABLE public.payroll_cycles
ADD CONSTRAINT unique_month_year_cycle UNIQUE (month, year);
