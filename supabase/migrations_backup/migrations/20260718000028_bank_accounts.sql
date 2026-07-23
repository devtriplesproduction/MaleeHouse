-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add bank_id to quotations
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- Add bank_id to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS bank_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Allow accountant and admin to manage bank accounts
CREATE POLICY "Enable read access for all internal users" ON public.bank_accounts
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'accountant', 'sales', 'engineer', 'qc')
      )
    );

CREATE POLICY "Enable insert for admin and accountant" ON public.bank_accounts
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'accountant')
      )
    );

CREATE POLICY "Enable update for admin and accountant" ON public.bank_accounts
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'accountant')
      )
    );

CREATE POLICY "Enable delete for admin and accountant" ON public.bank_accounts
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'accountant')
      )
    );

-- Trigger for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
