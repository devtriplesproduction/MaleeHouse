-- Migration: Ensure project_finances.id is never null
-- Description: Adds a UUID default to project_finances.id and ensures all tables have robust PK generation.

-- 1. Use standard Postgres DEFAULT for project_finances (better performance than a trigger)
ALTER TABLE IF EXISTS project_finances 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 2. Audit: Ensure other major operational tables also have this safety net
ALTER TABLE IF EXISTS project_assignments 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE IF EXISTS project_milestones 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
