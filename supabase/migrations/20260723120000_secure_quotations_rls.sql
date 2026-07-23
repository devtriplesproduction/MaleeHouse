-- ============================================================
-- FILE: 20260723120000_secure_quotations_rls.sql
-- PURPOSE: Fix quotations table RLS policy
-- ============================================================

-- 1. Drop the insecure public policy
DROP POLICY IF EXISTS "Public can view quotation by token" ON public.quotations;

-- 2. Ensure authorized users can access their own quotations
CREATE POLICY "Users can manage their own quotations" ON public.quotations
  FOR ALL
  USING (
    auth.uid() = created_by OR
    auth.uid() = assigned_to
  );
