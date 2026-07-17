CREATE POLICY "Admins and HR can insert EOD reports for anyone" ON eod_reports FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'hr'));
