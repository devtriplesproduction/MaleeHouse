-- 62_drop_handle_new_user_trigger.sql

-- 1. Drop the trigger from auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function
DROP FUNCTION IF EXISTS handle_new_user();

-- Note: The sync_profile_to_auth_users trigger on public.profiles is kept intact
-- to ensure role claims are synchronized during manual application inserts.
