ALTER TABLE projects ADD COLUMN dispatch_override_requested BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN dispatch_override_approved BOOLEAN DEFAULT false;
