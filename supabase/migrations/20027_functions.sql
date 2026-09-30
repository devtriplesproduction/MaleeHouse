-- ============================================================
-- FILE: 27_functions.sql
-- PURPOSE: All database functions used by triggers and RLS.
-- DEPENDS ON: All tables
-- ============================================================

-- ==========================================
-- 1. get_next_project_id()
-- Purpose: Generates sequential project ID PRJ-YYMM-NNN
-- ==========================================
CREATE OR REPLACE FUNCTION get_next_project_id()
RETURNS TEXT AS $$
DECLARE
  current_yymm TEXT;
  last_id TEXT;
  next_num INTEGER;
  new_id TEXT;
BEGIN
  -- Get current year/month in YYMM format
  current_yymm := to_char(CURRENT_DATE, 'YYMM');
  
  -- Find the highest ID for the current month
  SELECT id INTO last_id
  FROM projects
  WHERE id LIKE 'PRJ-' || current_yymm || '-%'
  ORDER BY id DESC
  LIMIT 1;
  
  IF last_id IS NULL THEN
    -- First project of the month
    new_id := 'PRJ-' || current_yymm || '-001';
  ELSE
    -- Extract the numeric part and increment
    next_num := CAST(SUBSTRING(last_id FROM 10 FOR 3) AS INTEGER) + 1;
    new_id := 'PRJ-' || current_yymm || '-' || LPAD(next_num::TEXT, 3, '0');
  END IF;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. get_user_role()
-- Purpose: Gets the role of the current authenticated user.
-- Used extensively in RLS policies.
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  current_role user_role;
BEGIN
  SELECT role INTO current_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN current_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. is_project_participant(project_id)
-- Purpose: Checks if current user is assigned to the given project.
-- ==========================================
CREATE OR REPLACE FUNCTION is_project_participant(p_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_assigned BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM project_assignments
    WHERE project_id = p_id AND user_id = auth.uid()
  ) INTO is_assigned;
  
  RETURN is_assigned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. set_updated_at()
-- Purpose: Trigger function to update the updated_at timestamp.
-- ==========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. handle_new_user()
-- Purpose: Trigger function on auth.users to auto-create profile.
-- ==========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
