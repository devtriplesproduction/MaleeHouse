-- ============================================================
-- FILE: 10_payments.sql
-- PURPOSE: Payment records with full verification workflow.
-- DEPENDS ON: 08_invoices.sql, 03_projects.sql, 02_profiles.sql, 01_enums.sql
-- ROLLBACK: DROP TABLE IF EXISTS payments CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invoice_id        TEXT REFERENCES invoices(id) ON DELETE SET NULL,

  -- Financial
  amount            NUMERIC(14, 2) NOT NULL,
  payment_method    TEXT NOT NULL DEFAULT 'bank_transfer',
  transaction_id    TEXT UNIQUE,  -- bank/UPI reference — must be unique to prevent duplicates
  receipt_url       TEXT,         -- uploaded bank receipt URL

  -- Verification
  status            payment_status NOT NULL DEFAULT 'pending',
  verified_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at       TIMESTAMPTZ,
  rejection_reason  TEXT,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index: transaction_id uniqueness (excluding NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_id
  ON payments(transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_project_id  ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id  ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at  ON payments(created_at DESC);

COMMENT ON TABLE payments IS 'Payment records. Duplicate prevention via unique transaction_id and receipt_url.';
COMMENT ON COLUMN payments.transaction_id IS 'Bank/UPI reference number. Unique constraint prevents duplicate logging.';
COMMENT ON COLUMN payments.verified_by IS 'Accountant/Admin who verified or rejected the payment.';
