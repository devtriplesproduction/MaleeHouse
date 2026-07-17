-- 60_add_bank_details_to_company_settings.sql

ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS "bankName" TEXT,
ADD COLUMN IF NOT EXISTS "accountName" TEXT,
ADD COLUMN IF NOT EXISTS "accountNumber" TEXT,
ADD COLUMN IF NOT EXISTS "ifscCode" TEXT,
ADD COLUMN IF NOT EXISTS "branchName" TEXT,
ADD COLUMN IF NOT EXISTS "upiId" TEXT;
