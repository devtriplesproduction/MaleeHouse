-- 1. Fix any existing data anomalies (keep the most recently created bank as default, set others to false)
WITH latest_default AS (
    SELECT id 
    FROM public.bank_accounts 
    WHERE is_default = true 
    ORDER BY created_at DESC 
    LIMIT 1
)
UPDATE public.bank_accounts
SET is_default = false
WHERE is_default = true 
  AND id NOT IN (SELECT id FROM latest_default);

-- 2. Add a unique partial index to guarantee only one default account can exist at a time
CREATE UNIQUE INDEX IF NOT EXISTS unique_default_bank_account 
ON public.bank_accounts (is_default) 
WHERE is_default = true;
