-- ============================================================
-- FILE: 30_seed.sql
-- PURPOSE: Core auth users and profile initialization.
-- DEPENDS ON: All previous files.
-- ============================================================

-- Note: In Supabase, the best practice is to create auth.users 
-- using the Management API or GoTrue endpoints (as done in seed_db.mjs).
-- If you need to seed profiles manually, the trigger on auth.users 
-- will automatically create them.

-- This file is intentionally left blank for SQL migrations.
-- User seeding should be executed via the Node.js script:
-- node seed_db.mjs
