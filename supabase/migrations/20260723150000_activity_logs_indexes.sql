-- FILE: 20260723150000_activity_logs_indexes.sql

-- Add composite index to optimize fetching recent logs per project
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_created 
ON activity_logs(project_id, created_at DESC);
