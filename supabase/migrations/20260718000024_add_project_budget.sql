-- Add budget column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0;

-- Update the comments
COMMENT ON COLUMN public.projects.budget IS 'The allocated budget for the project';
