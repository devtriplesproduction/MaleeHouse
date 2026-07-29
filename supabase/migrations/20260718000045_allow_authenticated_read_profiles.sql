-- Allow all authenticated users to read profiles so they can see names of project creators, assignees, etc.
CREATE POLICY "Authenticated users can read all profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
