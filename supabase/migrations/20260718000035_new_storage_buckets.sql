-- 59_new_storage_buckets.sql

-- 1. Create EOD Photos Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('eod-photos', 'eod-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for EOD Photos
-- Anyone logged in can insert (create their own EOD photo)
CREATE POLICY "Users can upload their own EOD photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'eod-photos' AND 
    auth.role() = 'authenticated'
  );

-- Anyone logged in can view EOD photos (since EOD reports are generally visible to managers/admins, we can leave this relatively open for authenticated users)
CREATE POLICY "Authenticated users can view EOD photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'eod-photos' AND 
    auth.role() = 'authenticated'
  );

-- Admins can do anything
CREATE POLICY "Admins have full access to EOD photos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'eod-photos' AND 
    get_user_role() = 'admin'
  );


-- 2. Create HR Documents Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hr-documents', 'hr-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for HR Documents
-- Admins can insert/update/delete HR docs
CREATE POLICY "Admins can manage HR documents" ON storage.objects
  FOR ALL USING (
    bucket_id = 'hr-documents' AND 
    get_user_role() = 'admin'
  );

-- Users can read their own documents (the file path usually contains the user id)
CREATE POLICY "Users can read own HR documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'hr-documents' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid()::text = name)
  );

