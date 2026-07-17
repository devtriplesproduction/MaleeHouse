-- 60_hr_rls.sql

-- Give HR role access to profiles
CREATE POLICY "HR can view all profiles" ON profiles
  FOR SELECT USING (get_user_role() = 'hr');

-- Give HR role access to EOD reports (for attendance tracking)
CREATE POLICY "HR can read all EOD reports" ON eod_reports
  FOR SELECT USING (get_user_role() = 'hr');

CREATE POLICY "HR can update EOD reports" ON eod_reports
  FOR UPDATE USING (get_user_role() = 'hr');

-- Give HR role access to leaves
CREATE POLICY "HR can read all leaves" ON leaves
  FOR SELECT USING (get_user_role() = 'hr');

-- Give HR role access to attendance logs
CREATE POLICY "HR can read all attendance logs" ON attendance_logs
  FOR SELECT USING (get_user_role() = 'hr');
