-- Add the payment_date column to the payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone;

-- Optional: If you want existing rows to have a default payment_date equal to their created_at date
UPDATE public.payments 
SET payment_date = created_at 
WHERE payment_date IS NULL;
