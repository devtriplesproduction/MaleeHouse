-- Create trigger to automatically update the updated_at column on the projects table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
    CREATE TRIGGER update_projects_updated_at
      BEFORE UPDATE ON public.projects
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
