-- 58_notifications_insert_rls.sql
-- Allow any authenticated user to insert notifications for other users
-- This removes the need for createAdminClient when generating system notifications

CREATE POLICY "Anyone can insert notifications" ON notifications
  FOR INSERT WITH CHECK (TRUE);
