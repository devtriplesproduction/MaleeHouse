-- Add account_usage column to bank_accounts table
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS account_usage TEXT NOT NULL DEFAULT 'operations';
