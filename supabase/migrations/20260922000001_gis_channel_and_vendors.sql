-- GIS channel + vendors + project intake columns
-- New migration only; does not rewrite prior files.

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gst_number TEXT,
  default_pay_when TEXT CHECK (default_pay_when IN ('on_create', 'on_deliver')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_intake TEXT,
  ADD COLUMN IF NOT EXISTS vendor_pay_when TEXT,
  ADD COLUMN IF NOT EXISTS workflow_template TEXT NOT NULL DEFAULT 'gis_direct_client';

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_channel_check;
ALTER TABLE projects ADD CONSTRAINT projects_channel_check
  CHECK (channel IN ('direct', 'vendor'));

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_vendor_intake_check;
ALTER TABLE projects ADD CONSTRAINT projects_vendor_intake_check
  CHECK (vendor_intake IS NULL OR vendor_intake IN ('needs_prototype', 'survey_and_prototype_ready'));

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_vendor_pay_when_check;
ALTER TABLE projects ADD CONSTRAINT projects_vendor_pay_when_check
  CHECK (vendor_pay_when IS NULL OR vendor_pay_when IN ('on_create', 'on_deliver'));

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_vendor_channel_consistency;
ALTER TABLE projects ADD CONSTRAINT projects_vendor_channel_consistency
  CHECK (
    (channel = 'direct' AND vendor_id IS NULL AND vendor_intake IS NULL AND vendor_pay_when IS NULL)
    OR
    (channel = 'vendor' AND vendor_id IS NOT NULL AND vendor_intake IS NOT NULL AND vendor_pay_when IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_projects_channel ON projects(channel);
CREATE INDEX IF NOT EXISTS idx_projects_workflow_template ON projects(workflow_template);
CREATE INDEX IF NOT EXISTS idx_projects_vendor_id ON projects(vendor_id);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vendors_select_authenticated ON vendors;
CREATE POLICY vendors_select_authenticated
  ON vendors FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS vendors_write_ops ON vendors;
CREATE POLICY vendors_write_ops
  ON vendors FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'sales', 'accountant'))
  WITH CHECK (public.get_user_role() IN ('admin', 'sales', 'accountant'));

COMMENT ON COLUMN projects.channel IS 'direct = normal client; vendor = vendor/Wender intake';
COMMENT ON COLUMN projects.workflow_template IS 'Key into src/config/workflow_config.json templates';
