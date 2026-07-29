-- Fix missing default values for ID columns in activity_logs and workflow_history
ALTER TABLE public.activity_logs ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.workflow_history ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
