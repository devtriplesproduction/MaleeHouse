-- ============================================================
-- FILE: 20260724000001_optimize_rls_auth_uid_wrapping.sql
-- PURPOSE: Performance fix - wrap all bare auth.uid() calls in RLS
--          policies as (select auth.uid()) so Postgres evaluates
--          it once per query (initplan) instead of once per row.
--          Mechanically generated from existing policy definitions;
--          logic/roles/conditions are unchanged, only the auth.uid()
--          call sites are wrapped.
-- ============================================================

-- 1. Make get_user_role() STABLE so Postgres can cache/reuse its
--    result within a single query instead of re-querying `profiles`
--    once per row evaluated.
ALTER FUNCTION get_user_role() STABLE;

-- from 20029_rls.sql
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (id = (select auth.uid()));

-- from 20029_rls.sql
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = (select auth.uid()));

-- from 20029_rls.sql
DROP POLICY IF EXISTS "Accountants can read owned projects" ON public.projects;
CREATE POLICY "Accountants can read owned projects" ON public.projects
  FOR SELECT USING (
    get_user_role() = 'accountant'
    AND EXISTS (SELECT 1 FROM project_accounts_owners WHERE project_id = projects.id AND accountant_id = (select auth.uid()))
    AND deleted_at IS NULL
  );

-- from 20029_rls.sql
DROP POLICY IF EXISTS "Users can see their own assignments" ON public.project_assignments;
CREATE POLICY "Users can see their own assignments" ON public.project_assignments
  FOR SELECT USING (user_id = (select auth.uid()));

-- from 20029_rls.sql
DROP POLICY IF EXISTS "CAD can insert own revisions" ON public.cad_revisions;
CREATE POLICY "CAD can insert own revisions" ON public.cad_revisions
  FOR INSERT WITH CHECK (get_user_role() = 'cad' AND submitted_by = (select auth.uid()));

-- from 20029_rls.sql
DROP POLICY IF EXISTS "Field can insert own reports" ON public.field_reports;
CREATE POLICY "Field can insert own reports" ON public.field_reports
  FOR INSERT WITH CHECK (get_user_role() IN ('field', 'field_engineer') AND submitted_by = (select auth.uid()));

-- from 20029_rls.sql
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (user_id = (select auth.uid()));

-- from 20260718000001_storage_rls.sql
DROP POLICY IF EXISTS "Admins can manage storage" ON storage.objects;
CREATE POLICY "Admins can manage storage" ON storage.objects
  FOR ALL USING (bucket_id = 'project-assets' AND (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'admin');

-- from 20260718000016_rls_policies.sql
DROP POLICY IF EXISTS "Users can read own EOD reports" ON public.eod_reports;
CREATE POLICY "Users can read own EOD reports" ON public.eod_reports
  FOR SELECT USING (user_id = (select auth.uid()));

-- from 20260718000016_rls_policies.sql
DROP POLICY IF EXISTS "Users can insert own EOD reports" ON public.eod_reports;
CREATE POLICY "Users can insert own EOD reports" ON public.eod_reports
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- from 20260718000016_rls_policies.sql
DROP POLICY IF EXISTS "Users can read own leaves" ON public.leaves;
CREATE POLICY "Users can read own leaves" ON public.leaves
  FOR SELECT USING (user_id = (select auth.uid()));

-- from 20260718000016_rls_policies.sql
DROP POLICY IF EXISTS "Users can insert own leaves" ON public.leaves;
CREATE POLICY "Users can insert own leaves" ON public.leaves
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- from 20260718000016_rls_policies.sql
DROP POLICY IF EXISTS "Users can update own pending leaves" ON public.leaves;
CREATE POLICY "Users can update own pending leaves" ON public.leaves
  FOR UPDATE USING (user_id = (select auth.uid()) AND status = 'pending');

-- from 20260718000020_material_requests.sql
DROP POLICY IF EXISTS "Admin and engineers can view all material requests" ON public.material_requests;
CREATE POLICY "Admin and engineers can view all material requests" ON public.material_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'engineer')
    )
  );

-- from 20260718000020_material_requests.sql
DROP POLICY IF EXISTS "Admin and engineers can update material requests" ON public.material_requests;
CREATE POLICY "Admin and engineers can update material requests" ON public.material_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role IN ('admin', 'engineer')
    )
  );

-- from 20260718000020_material_requests.sql
DROP POLICY IF EXISTS "Users can view their own material requests" ON public.material_requests;
CREATE POLICY "Users can view their own material requests" ON public.material_requests FOR SELECT
  USING (requested_by = (select auth.uid()));

-- from 20260718000020_material_requests.sql
DROP POLICY IF EXISTS "Users can insert their own material requests" ON public.material_requests;
CREATE POLICY "Users can insert their own material requests" ON public.material_requests FOR INSERT
  WITH CHECK (requested_by = (select auth.uid()));

-- from 20260718000022_hr_features.sql
DROP POLICY IF EXISTS "Users can view their own documents" ON public.employee_documents;
CREATE POLICY "Users can view their own documents" ON public.employee_documents FOR SELECT USING ((select auth.uid()) = employee_id OR get_user_role() IN ('admin', 'hr'));

-- from 20260718000028_bank_accounts.sql
DROP POLICY IF EXISTS "Enable read access for all internal users" ON public.bank_accounts;
CREATE POLICY "Enable read access for all internal users" ON public.bank_accounts
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (select auth.uid())
        AND role IN ('admin', 'accountant', 'sales', 'engineer', 'qc')
      )
    );

-- from 20260718000028_bank_accounts.sql
DROP POLICY IF EXISTS "Enable insert for admin and accountant" ON public.bank_accounts;
CREATE POLICY "Enable insert for admin and accountant" ON public.bank_accounts
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (select auth.uid())
        AND role IN ('admin', 'accountant')
      )
    );

-- from 20260718000028_bank_accounts.sql
DROP POLICY IF EXISTS "Enable update for admin and accountant" ON public.bank_accounts;
CREATE POLICY "Enable update for admin and accountant" ON public.bank_accounts
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (select auth.uid())
        AND role IN ('admin', 'accountant')
      )
    );

-- from 20260718000028_bank_accounts.sql
DROP POLICY IF EXISTS "Enable delete for admin and accountant" ON public.bank_accounts;
CREATE POLICY "Enable delete for admin and accountant" ON public.bank_accounts
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (select auth.uid())
        AND role IN ('admin', 'accountant')
      )
    );

-- from 20260718000030_salary_increments.sql
DROP POLICY IF EXISTS "Admins and HR can read all salary increments" ON public.salary_increments;
CREATE POLICY "Admins and HR can read all salary increments" ON public.salary_increments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin', 'hr')
    )
  );

-- from 20260718000030_salary_increments.sql
DROP POLICY IF EXISTS "Admins and HR can insert salary increments" ON public.salary_increments;
CREATE POLICY "Admins and HR can insert salary increments" ON public.salary_increments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin', 'hr')
    )
  );

-- from 20260718000030_salary_increments.sql
DROP POLICY IF EXISTS "Employees can read own salary increments" ON public.salary_increments;
CREATE POLICY "Employees can read own salary increments" ON public.salary_increments FOR SELECT
  USING (employee_id = (select auth.uid()));

-- from 20260718000035_new_storage_buckets.sql
DROP POLICY IF EXISTS "Users can read own HR documents" ON storage.objects;
CREATE POLICY "Users can read own HR documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'hr-documents' AND 
    ((select auth.uid())::text = (storage.foldername(name))[1] OR (select auth.uid())::text = name)
  );

-- from 20260718000100_fix_rls.sql
DROP POLICY IF EXISTS "Authorized roles can update projects" ON public.projects;
CREATE POLICY "Authorized roles can update projects" ON public.projects
  FOR UPDATE USING (
    get_user_role() IN ('admin', 'sales') OR
    (get_user_role() IN ('engineer', 'cad', 'field', 'field_engineer', 'qc') AND is_project_participant(id)) OR
    (get_user_role() = 'accountant' AND EXISTS (SELECT 1 FROM project_accounts_owners WHERE project_id = projects.id AND accountant_id = (select auth.uid())))
  );

-- from 20260718000100_fix_rls.sql
DROP POLICY IF EXISTS "Assigned users can update tasks" ON public.tasks;
CREATE POLICY "Assigned users can update tasks" ON public.tasks
  FOR UPDATE USING (
    assigned_to = (select auth.uid()) OR 
    get_user_role() = 'admin'
  );

-- from 20260718000100_fix_rls.sql
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (
    assigned_to = (select auth.uid()) OR 
    get_user_role() = 'admin'
  );

-- from 20260718000100_fix_rls.sql
DROP POLICY IF EXISTS "Authors can update comments" ON public.comments;
CREATE POLICY "Authors can update comments" ON public.comments
  FOR UPDATE USING (
    user_id = (select auth.uid()) OR 
    get_user_role() = 'admin'
  );

-- from 20260718000100_fix_rls.sql
DROP POLICY IF EXISTS "Authors can delete comments" ON public.comments;
CREATE POLICY "Authors can delete comments" ON public.comments
  FOR DELETE USING (
    user_id = (select auth.uid()) OR 
    get_user_role() = 'admin'
  );

-- from 20260719000051_reconciliation_engine.sql
DROP POLICY IF EXISTS "Admins and accountants can manage reconciliations" ON public.bank_reconciliations;
CREATE POLICY "Admins and accountants can manage reconciliations" ON public.bank_reconciliations FOR ALL
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'accountant'))
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'accountant'))
    );

-- from 20260719000053_immutable_reconciliations.sql
DROP POLICY IF EXISTS "Admins and accountants can view reconciliations" ON public.bank_reconciliations;
CREATE POLICY "Admins and accountants can view reconciliations" ON public.bank_reconciliations FOR SELECT
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'accountant'))
    );

-- from 20260719000053_immutable_reconciliations.sql
DROP POLICY IF EXISTS "Admins and accountants can insert reconciliations" ON public.bank_reconciliations;
CREATE POLICY "Admins and accountants can insert reconciliations" ON public.bank_reconciliations FOR INSERT
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'accountant'))
    );

-- from 20260719000057_salary_slips.sql
DROP POLICY IF EXISTS "Admins and HR can manage all salary slips" ON public.salary_slips;
CREATE POLICY "Admins and HR can manage all salary slips" ON public.salary_slips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin', 'hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin', 'hr')
    )
  );

-- from 20260719000057_salary_slips.sql
DROP POLICY IF EXISTS "Employees can read own salary slips" ON public.salary_slips;
CREATE POLICY "Employees can read own salary slips" ON public.salary_slips FOR SELECT
  USING (employee_id = (select auth.uid()));

-- from 20260720000001_security_audit_logs.sql
DROP POLICY IF EXISTS "Admins can view security audit logs" ON public.security_audit_logs;
CREATE POLICY "Admins can view security audit logs" ON public.security_audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
  )
);

-- from 20260720000002_create_salary_slips_bucket.sql
DROP POLICY IF EXISTS "Admins and HR have full access to salary slips" ON storage.objects;
CREATE POLICY "Admins and HR have full access to salary slips" ON storage.objects
  FOR ALL USING (
    bucket_id = 'salary_slips' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role IN ('admin', 'hr')
    )
  );

-- from 20260720000002_create_salary_slips_bucket.sql
DROP POLICY IF EXISTS "Employees can read own salary slips" ON storage.objects;
CREATE POLICY "Employees can read own salary slips" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'salary_slips' AND 
    ((select auth.uid())::text = (storage.foldername(name))[3])
  );

-- from 20260723120000_secure_quotations_rls.sql
DROP POLICY IF EXISTS "Users can manage their own quotations" ON public.quotations;
CREATE POLICY "Users can manage their own quotations" ON public.quotations
  FOR ALL
  USING (
    (select auth.uid()) = created_by OR
    (select auth.uid()) = assigned_to
  );

-- from 20260723130000_secure_payroll_rls.sql
DROP POLICY IF EXISTS "Employees can view own employee_financial_ledger" ON public.employee_financial_ledger;
CREATE POLICY "Employees can view own employee_financial_ledger" ON public.employee_financial_ledger
  FOR SELECT USING ((select auth.uid()) = employee_id);
