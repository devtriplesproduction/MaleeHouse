-- ============================================================
-- FILE: 50_expenses.sql
-- PURPOSE: Create expenses table for expense tracking
-- DEPENDS ON: 03_projects.sql, 02_profiles.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('labor', 'material', 'travel', 'overhead', 'other')),
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for full admin & accountant access
CREATE POLICY "Admins and accountants can manage all expenses" 
    ON public.expenses 
    FOR ALL 
    USING (get_user_role() IN ('admin', 'accountant'))
    WITH CHECK (get_user_role() IN ('admin', 'accountant'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);

-- Comment on table
COMMENT ON TABLE public.expenses IS 'Expense tracking records for projects or general operations.';
