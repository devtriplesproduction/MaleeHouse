-- Migration to create tables for dynamic financial reports

-- 1. Project Budget Items
CREATE TABLE IF NOT EXISTS public.project_budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    section TEXT NOT NULL, -- e.g., 'Survey Costing', 'Planning Costing'
    particulars TEXT NOT NULL,
    qty NUMERIC DEFAULT 1,
    rate NUMERIC DEFAULT 0,
    days NUMERIC DEFAULT 1,
    amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for project_budget_items
ALTER TABLE public.project_budget_items ENABLE ROW LEVEL SECURITY;

-- Create policies for project_budget_items
CREATE POLICY "Enable read access for all authenticated users" ON public.project_budget_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.project_budget_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.project_budget_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.project_budget_items FOR DELETE TO authenticated USING (true);


-- 2. Fund Allocations
CREATE TABLE IF NOT EXISTS public.fund_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    service_divide TEXT NOT NULL, -- e.g., 'Survey Engineer Salary'
    day NUMERIC DEFAULT 1,
    amount NUMERIC DEFAULT 0,
    remark TEXT, -- e.g., 'Freeze', 'Unfreeze'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for fund_allocations
ALTER TABLE public.fund_allocations ENABLE ROW LEVEL SECURITY;

-- Create policies for fund_allocations
CREATE POLICY "Enable read access for all authenticated users" ON public.fund_allocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.fund_allocations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.fund_allocations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.fund_allocations FOR DELETE TO authenticated USING (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_budget_items_modtime
BEFORE UPDATE ON public.project_budget_items
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_fund_allocations_modtime
BEFORE UPDATE ON public.fund_allocations
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
