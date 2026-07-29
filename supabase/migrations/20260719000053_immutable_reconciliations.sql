-- Drop the existing overly-permissive FOR ALL policy
DROP POLICY IF EXISTS "Admins and accountants can manage reconciliations" ON public.bank_reconciliations;

-- Create SELECT policy
CREATE POLICY "Admins and accountants can view reconciliations"
    ON public.bank_reconciliations FOR SELECT
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
    );

-- Create INSERT policy
CREATE POLICY "Admins and accountants can insert reconciliations"
    ON public.bank_reconciliations FOR INSERT
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
    );
