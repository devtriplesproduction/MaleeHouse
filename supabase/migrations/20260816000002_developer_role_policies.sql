-- ============================================================
-- FILE: 20260816000002_developer_role_policies.sql
-- PURPOSE: Update audit_logs RLS to use the new developer enum
-- ============================================================

-- Drop the old policy
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- Add the new policy so developers (not just admins) can view audit logs
CREATE POLICY "Developers can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'developer'
  )
);
