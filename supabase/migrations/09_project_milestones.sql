-- ============================================================
-- FILE: 09_project_milestones.sql
-- PURPOSE: Billing milestones with payment gates and stage links.
-- DEPENDS ON: 03_projects.sql, 08_invoices.sql, 01_enums.sql
-- ROLLBACK: DROP TABLE IF EXISTS project_milestones CASCADE;
-- ============================================================

CREATE TABLE IF NOT EXISTS project_milestones (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Content
  title               TEXT NOT NULL,
  description         TEXT DEFAULT '',

  -- Finance
  amount              NUMERIC(14, 2) NOT NULL DEFAULT 0,
  due_date            DATE,

  -- Workflow Integration
  linked_stage        TEXT,  -- project_status value that gets unlocked on payment
  is_activation_gate  BOOLEAN NOT NULL DEFAULT FALSE,  -- if true, project activates on payment

  -- Status
  status              milestone_status NOT NULL DEFAULT 'pending',

  -- Compulsory flag (cannot be deleted)
  is_compulsory       BOOLEAN NOT NULL DEFAULT FALSE,

  -- Order
  sort_order          INTEGER DEFAULT 0,

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from invoices to milestones (deferred from 08_invoices.sql)
ALTER TABLE invoices
  ADD CONSTRAINT fk_invoices_milestone_id
  FOREIGN KEY (milestone_id)
  REFERENCES project_milestones(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id  ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status      ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_project_milestones_linked_stage ON project_milestones(linked_stage);

COMMENT ON TABLE project_milestones IS 'Billing milestones. Linked stages are gated until milestone is paid.';
COMMENT ON COLUMN project_milestones.is_activation_gate IS 'If true, full project is activated on payment of this milestone.';
COMMENT ON COLUMN project_milestones.linked_stage IS 'Workflow stage that gets unlocked when this milestone is paid.';
COMMENT ON COLUMN project_milestones.is_compulsory IS 'Compulsory milestones cannot be deleted by accountants.';
