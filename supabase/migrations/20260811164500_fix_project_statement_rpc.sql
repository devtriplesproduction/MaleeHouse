-- Migration to fix get_project_statement_summary return type mismatch for id column

DROP FUNCTION IF EXISTS get_project_statement_summary(text);

CREATE OR REPLACE FUNCTION get_project_statement_summary(p_project_id text)
RETURNS TABLE (
    id text,
    title text,
    base_amount numeric,
    gst_amount numeric,
    total_amount numeric,
    status text,
    due_date date
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.title,
        pm.amount as base_amount,
        (pm.amount * 0.09) + (pm.amount * 0.09) as gst_amount,
        pm.amount + (pm.amount * 0.09) * 2 as total_amount,
        pm.status,
        pm.due_date
    FROM project_milestones pm
    WHERE pm.project_id = p_project_id
    ORDER BY pm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
