-- ============================================================
-- FILE: 59_hr_eod_leaves_rls.sql
-- PURPOSE: Allow HR to view all EOD reports and leaves, and update leaves
-- ============================================================

-- EOD Reports Policies
DROP POLICY IF EXISTS "Admins can read all EOD reports" ON eod_reports;
CREATE POLICY "Admins and HR can read all EOD reports" ON eod_reports
  FOR SELECT USING (get_user_role() IN ('admin', 'hr'));

-- Leaves Policies
DROP POLICY IF EXISTS "Admins can read all leaves" ON leaves;
CREATE POLICY "Admins and HR can read all leaves" ON leaves
  FOR SELECT USING (get_user_role() IN ('admin', 'hr'));

DROP POLICY IF EXISTS "Admins can update leaves" ON leaves;
CREATE POLICY "Admins and HR can update leaves" ON leaves
  FOR UPDATE USING (get_user_role() IN ('admin', 'hr'));
