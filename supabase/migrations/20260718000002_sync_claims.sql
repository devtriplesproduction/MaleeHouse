-- ============================================================
-- FILE: 30_sync_claims.sql
-- PURPOSE: Sync role from profiles to auth.users.raw_app_meta_data
-- DEPENDS ON: 29_rls.sql
-- ============================================================

CREATE OR REPLACE FUNCTION sync_profile_to_auth_users()
RETURNS TRIGGER AS $$
BEGIN
  -- We only want to run this if the role or is_active actually changed or is newly inserted
  IF TG_OP = 'INSERT' OR NEW.role IS DISTINCT FROM OLD.role OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    UPDATE auth.users
    SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
        'role', NEW.role,
        'is_active', NEW.is_active
    )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS sync_profile_role ON public.profiles;

-- Create the trigger
CREATE TRIGGER sync_profile_role
  AFTER INSERT OR UPDATE OF role, is_active ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_to_auth_users();

-- Backfill existing users
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb) 
                      || jsonb_build_object('role', p.role, 'is_active', p.is_active)
FROM public.profiles p
WHERE u.id = p.id;
