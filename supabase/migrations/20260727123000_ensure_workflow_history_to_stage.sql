-- Migration: Ensure workflow_history.to_stage is never null
-- Description: Automatically populates to_stage with the current project status if omitted.

CREATE OR REPLACE FUNCTION set_default_workflow_to_stage()
RETURNS TRIGGER AS $$
DECLARE
  v_status text;
BEGIN
  -- Only intervene if the application did not provide a to_stage
  IF NEW.to_stage IS NULL THEN
    -- Look up the current status of the project into a local variable
    SELECT status INTO v_status FROM projects WHERE id = NEW.project_id;
    
    -- Fail fast if the project does not exist or has no status
    IF v_status IS NULL THEN
      RAISE EXCEPTION 'Cannot insert into workflow_history: Project % does not exist or has no valid status to use as a fallback.', NEW.project_id;
    END IF;

    -- Safely assign to the NEW record
    NEW.to_stage := v_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Idempotent trigger creation
DROP TRIGGER IF EXISTS ensure_workflow_history_to_stage ON workflow_history;
CREATE TRIGGER ensure_workflow_history_to_stage
  BEFORE INSERT ON workflow_history
  FOR EACH ROW
  EXECUTE FUNCTION set_default_workflow_to_stage();
