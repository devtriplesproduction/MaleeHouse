-- ============================================================
-- FILE: 49_hr_features.sql
-- PURPOSE: Create tables for Holidays, Announcements, and HR Documents
-- ============================================================

CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    name TEXT NOT NULL,
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    posted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_roles TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view holidays" ON holidays FOR SELECT USING (true);
CREATE POLICY "Admins and HR can manage holidays" ON holidays FOR ALL USING (get_user_role() IN ('admin', 'hr'));

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admins and HR can manage announcements" ON announcements FOR ALL USING (get_user_role() IN ('admin', 'hr'));

ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own documents" ON employee_documents FOR SELECT USING (auth.uid() = employee_id OR get_user_role() IN ('admin', 'hr'));
CREATE POLICY "Admins and HR can manage documents" ON employee_documents FOR ALL USING (get_user_role() IN ('admin', 'hr'));
