-- Add new client response statuses to invoice_status enum
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'in_review';
