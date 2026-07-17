-- 61_secure_notifications_rpc.sql

-- 1. Remove the insecure INSERT policy created in migration 58
DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;

-- 2. Create the secure RPC for inserting notifications
CREATE OR REPLACE FUNCTION generate_system_notification(
  p_target_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_related_project_id TEXT
) RETURNS VOID AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_id UUID := auth.uid();
BEGIN
  -- Get caller role
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;
  
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
  -- (e.g. EOD reminders, though those usually come from cron)
  ELSIF p_target_user_id = v_caller_id THEN
     -- Allow self-insert
     NULL;
     
  ELSE
     RAISE EXCEPTION 'Unauthorized: Caller lacks permissions to generate this notification';
  END IF;

  -- Insert the notification
  INSERT INTO notifications (id, user_id, title, message, type, is_read, related_project_id, created_at)
  VALUES (
    'ntf-' || (extract(epoch from now()) * 1000)::bigint::text || '-' || substr(md5(random()::text), 1, 4),
    p_target_user_id,
    p_title,
    p_message,
    p_type,
    false,
    p_related_project_id,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix HR Storage Upload Policy
CREATE POLICY "HR can manage HR documents" ON storage.objects
  FOR ALL USING (
    bucket_id = 'hr-documents' AND 
    get_user_role() IN ('admin', 'hr')
  );

-- 4. Fix Admin Notification Management Policy
-- This allows Admins to mark notifications for *other* users as read
CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL USING (get_user_role() = 'admin');

