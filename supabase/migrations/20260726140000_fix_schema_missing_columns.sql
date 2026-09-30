-- Add missing deadline column to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline DATE;

-- Add pending to invoice_status enum
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'pending';

-- Add payment_verification_pending to milestone_status enum
ALTER TYPE milestone_status ADD VALUE IF NOT EXISTS 'payment_verification_pending';

-- Add status column to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
