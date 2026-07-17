-- ============================================================
-- FILE: 44_add_parent_comment_id.sql
-- PURPOSE: Add parent_comment_id to comments table for replies
-- ============================================================

ALTER TABLE comments
ADD COLUMN IF NOT EXISTS parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
