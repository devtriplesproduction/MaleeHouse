-- ============================================================
-- FILE: 20260724000000_fix_remaining_rls_gaps.sql
-- PURPOSE: Close RLS gaps missed in the previous security pass:
--   1. quotation_versions - still publicly readable (USING TRUE)
--   2. project_budget_items - any authenticated user could write/delete any row
--   3. fund_allocations     - any authenticated user could write/delete any row
-- ============================================================

-- 1. quotation_versions: remove the public/token policy, scope to
--    the same rule already used for the parent `quotations` table.
DROP POLICY IF EXISTS "Public can view quotation_versions by token" ON public.quotation_versions;

CREATE POLICY "Users can view their own quotation_versions" ON public.quotation_versions
  FOR SELECT USING (
    get_user_role() IN ('admin', 'accountant')
    OR get_user_role() = 'sales'
    OR EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_versions.quotation_id
        AND (q.created_by = (select auth.uid()) OR q.assigned_to = (select auth.uid()))
    )
  );

-- 2. project_budget_items: scope writes to project participants/admins/accountants
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.project_budget_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.project_budget_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.project_budget_items;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.project_budget_items;

CREATE POLICY "Participants and finance roles can read project_budget_items" ON public.project_budget_items
  FOR SELECT USING (
    get_user_role() IN ('admin', 'accountant')
    OR is_project_participant(project_id)
  );

CREATE POLICY "Participants and finance roles can write project_budget_items" ON public.project_budget_items
  FOR INSERT WITH CHECK (
    get_user_role() IN ('admin', 'accountant')
    OR is_project_participant(project_id)
  );

CREATE POLICY "Participants and finance roles can update project_budget_items" ON public.project_budget_items
  FOR UPDATE USING (
    get_user_role() IN ('admin', 'accountant')
    OR is_project_participant(project_id)
  );

CREATE POLICY "Finance roles can delete project_budget_items" ON public.project_budget_items
  FOR DELETE USING (get_user_role() IN ('admin', 'accountant'));

-- 3. fund_allocations: same treatment
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.fund_allocations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.fund_allocations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.fund_allocations;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.fund_allocations;

CREATE POLICY "Participants and finance roles can read fund_allocations" ON public.fund_allocations
  FOR SELECT USING (
    get_user_role() IN ('admin', 'accountant')
    OR is_project_participant(project_id)
  );

CREATE POLICY "Finance roles can write fund_allocations" ON public.fund_allocations
  FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'accountant'));

CREATE POLICY "Finance roles can update fund_allocations" ON public.fund_allocations
  FOR UPDATE USING (get_user_role() IN ('admin', 'accountant'));

CREATE POLICY "Finance roles can delete fund_allocations" ON public.fund_allocations
  FOR DELETE USING (get_user_role() IN ('admin', 'accountant'));
