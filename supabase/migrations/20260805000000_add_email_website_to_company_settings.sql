ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT 'info@maleehouse.com',
ADD COLUMN IF NOT EXISTS website TEXT DEFAULT 'www.maleehouse.com';
