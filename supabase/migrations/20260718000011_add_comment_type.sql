-- ============================================================
-- FILE: 38_add_comment_type.sql
-- PURPOSE: Add comment_type column to comments table
-- ============================================================

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS comment_type TEXT NOT NULL DEFAULT 'general';

-- Tell PostgREST to reload the schema cache so the API recognizes the new column immediately
NOTIFY pgrst, 'reload schema';
