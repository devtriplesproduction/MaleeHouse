-- ============================================================
-- FILE: 20260723140000_secure_ops_tables_rls.sql
-- PURPOSE: Fix missing RLS on operations tables
-- ============================================================

-- Enable RLS (already enabled, but good practice to be explicit)
ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- 1. sops
CREATE POLICY "Admins can manage sops" ON public.sops
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Authenticated users can read sops" ON public.sops
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. project_visits
CREATE POLICY "Admins can manage project_visits" ON public.project_visits
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Participants can manage project_visits" ON public.project_visits
  FOR ALL USING (is_project_participant(project_id));

-- 3. delivery_checklist
CREATE POLICY "Admins can manage delivery_checklist" ON public.delivery_checklist
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Participants can manage delivery_checklist" ON public.delivery_checklist
  FOR ALL USING (is_project_participant(project_id));

-- 4. issues
CREATE POLICY "Admins can manage issues" ON public.issues
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Participants can manage issues" ON public.issues
  FOR ALL USING (is_project_participant(project_id));
