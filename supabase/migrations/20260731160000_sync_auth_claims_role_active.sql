-- Sync role + is_active into auth.users.raw_app_meta_data so Edge middleware
-- can authorize from the JWT without a profiles round-trip.

CREATE OR REPLACE FUNCTION public.sync_profile_to_auth_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
  THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      jsonb_set(
        jsonb_set(
          COALESCE(raw_app_meta_data, '{}'::jsonb),
          '{role}',
          to_jsonb(NEW.role)
        ),
        '{is_active}',
        to_jsonb(COALESCE(NEW.is_active, true))
      )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_role ON public.profiles;
DROP TRIGGER IF EXISTS sync_profile_claims ON public.profiles;

CREATE TRIGGER sync_profile_claims
  AFTER INSERT OR UPDATE OF role, is_active ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_auth_users();

-- One-time backfill so existing users get claims without re-login
UPDATE auth.users u
SET raw_app_meta_data =
  jsonb_set(
    jsonb_set(
      COALESCE(u.raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(p.role)
    ),
    '{is_active}',
    to_jsonb(COALESCE(p.is_active, true))
  )
FROM public.profiles p
WHERE p.id = u.id
  AND (
    u.raw_app_meta_data->>'role' IS DISTINCT FROM p.role::text
    OR u.raw_app_meta_data->>'is_active' IS DISTINCT FROM COALESCE(p.is_active, true)::text
  );
