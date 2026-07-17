-- 63_delete_seed_users.sql
-- Removes 6 incomplete seed/test users from both profiles and auth.users.
-- Preserves: admin@maleehouse.com, rajesh.sapakal@maleehouse.com, divya.katakar@maleehouse.com

DO $$
DECLARE
  user_ids UUID[] := ARRAY[
    'cfda6417-8f44-4ea2-a232-7f1375306f49', -- cad@maleehouse.com
    'a60afe55-7794-4222-8659-d5c29293f352', -- field@maleehouse.com
    '87bc908e-f156-42fe-ade3-e3d2424f3ffe', -- sales@maleehouse.com
    '8bd53907-5c16-4d16-b8da-b82f47263f04', -- qc@maleehouse.com
    '7aa3038c-c0a7-45f4-8e40-a9225fa4d187', -- accountant@maleehouse.com
    '206b2fe4-19ce-444b-b012-d4107759d757'  -- engineer@maleehouse.com
  ];
BEGIN
  -- 1. Delete profiles first (avoids FK constraint issues)
  DELETE FROM public.profiles WHERE id = ANY(user_ids);

  -- 2. Delete auth users
  DELETE FROM auth.users WHERE id = ANY(user_ids);
END $$;
