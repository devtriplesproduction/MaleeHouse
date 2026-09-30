-- Add assigned_to column to quotations table
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_quotations_assigned_to ON public.quotations(assigned_to);
