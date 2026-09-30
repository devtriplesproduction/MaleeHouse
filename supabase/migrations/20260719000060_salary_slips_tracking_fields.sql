-- ============================================================
-- FILE: 20260719000060_salary_slips_tracking_fields.sql
-- PURPOSE: Add tracking fields to salary_slips
-- ============================================================

ALTER TABLE public.salary_slips
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_downloaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS emailed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_salary_slips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_salary_slips_updated_at ON public.salary_slips;
CREATE TRIGGER trg_salary_slips_updated_at
    BEFORE UPDATE ON public.salary_slips
    FOR EACH ROW
    EXECUTE FUNCTION public.update_salary_slips_updated_at();
