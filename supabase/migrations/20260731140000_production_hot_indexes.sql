-- Production hot-path indexes (inbox, milestones cron, soft-delete lists, expenses)

-- Notifications inbox: every authenticated layout load
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON public.notifications (user_id, is_read, created_at DESC);

-- Milestone auto-invoice cron: status + due_date window
CREATE INDEX IF NOT EXISTS idx_project_milestones_status_due
  ON public.project_milestones (status, due_date)
  WHERE status IN ('pending', 'payment_verification_pending');

-- Active projects list (soft-delete heavy tables)
CREATE INDEX IF NOT EXISTS idx_projects_active_created
  ON public.projects (created_at DESC)
  WHERE deleted_at IS NULL AND status IS DISTINCT FROM 'archived';

-- Expenses by project / status
CREATE INDEX IF NOT EXISTS idx_expenses_project_created
  ON public.expenses (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_status
  ON public.expenses (status)
  WHERE status = 'pending';

-- Follow-up tasks used by sales pipeline
CREATE INDEX IF NOT EXISTS idx_tasks_status_title
  ON public.tasks (status, title)
  WHERE status = 'pending';
