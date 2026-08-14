-- ============================================================
-- FILE: 20260812000000_batch_processing_rpcs.sql
-- PURPOSE: Batch processing functions for notifications and finance
-- ============================================================

-- 1. Batch Notification RPC (mirrors security of generate_system_notification)
CREATE OR REPLACE FUNCTION generate_system_notifications_batch(
  payloads JSONB
) RETURNS VOID AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_id UUID := auth.uid();
  payload JSONB;
  p_target_user_id UUID;
  p_title TEXT;
  p_message TEXT;
  p_type TEXT;
  p_related_project_id TEXT;
BEGIN
  -- Get caller role
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;

  FOR payload IN SELECT * FROM jsonb_array_elements(payloads)
  LOOP
    p_target_user_id := (payload->>'user_id')::UUID;
    p_title := payload->>'title';
    p_message := payload->>'message';
    p_type := payload->>'type';
    p_related_project_id := payload->>'related_project_id';

    -- Rule 1: Admins, Accountants, HR, and Sales can always generate notifications
    IF v_caller_role IN ('admin', 'accountant', 'hr', 'sales') THEN
       -- Allow insert
       NULL;
    
    -- Rule 2: Operations can only generate notifications if they are assigned to the project
    ELSIF v_caller_role IN ('engineer', 'cad', 'field', 'field_engineer', 'qc') AND p_related_project_id IS NOT NULL THEN
       IF NOT is_project_participant(p_related_project_id) THEN
          RAISE EXCEPTION 'Unauthorized: Not a participant of this project';
       END IF;
    
    -- Rule 3: Allow users to create self-assigned notifications or generic non-project system alerts 
    ELSIF p_target_user_id = v_caller_id THEN
       -- Allow self-insert
       NULL;
       
    ELSE
       RAISE EXCEPTION 'Unauthorized: Caller lacks permissions to generate this notification';
    END IF;

    -- Insert the notification
    INSERT INTO notifications (id, user_id, title, message, type, is_read, related_project_id, created_at)
    VALUES (
      'ntf-' || (extract(epoch from now()) * 1000)::bigint::text || '-' || substr(md5(random()::text), 1, 6),
      p_target_user_id,
      p_title,
      p_message,
      p_type,
      false,
      p_related_project_id,
      now()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Bulk Update Invoices Due Date
CREATE OR REPLACE FUNCTION bulk_update_invoices_due_date(
  p_milestone_ids TEXT[],
  p_due_dates DATE[]
) RETURNS VOID AS $$
DECLARE
  i INTEGER;
BEGIN
  -- Ensure arrays are same length
  IF array_length(p_milestone_ids, 1) != array_length(p_due_dates, 1) THEN
    RAISE EXCEPTION 'Array lengths must match';
  END IF;

  FOR i IN 1 .. array_upper(p_milestone_ids, 1)
  LOOP
    UPDATE invoices
    SET due_date = p_due_dates[i]
    WHERE milestone_id = p_milestone_ids[i];
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Bulk Update Project Milestones
CREATE OR REPLACE FUNCTION bulk_update_project_milestones(
  payloads JSONB
) RETURNS VOID AS $$
DECLARE
  payload JSONB;
BEGIN
  FOR payload IN SELECT * FROM jsonb_array_elements(payloads)
  LOOP
    UPDATE project_milestones
    SET
      title = COALESCE((payload->>'title')::TEXT, title),
      description = COALESCE((payload->>'description')::TEXT, description),
      amount = COALESCE((payload->>'amount')::NUMERIC, amount),
      due_date = CASE 
                   WHEN payload ? 'due_date' THEN (payload->>'due_date')::DATE 
                   ELSE due_date 
                 END,
      is_activation_gate = COALESCE((payload->>'is_activation_gate')::BOOLEAN, is_activation_gate),
      sort_order = COALESCE((payload->>'sort_order')::INTEGER, sort_order)
    WHERE id = payload->>'id';
  END LOOP;
END;
$$ LANGUAGE plpgsql;
