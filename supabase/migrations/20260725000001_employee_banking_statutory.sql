-- Migration: 20260725000001_employee_banking_statutory.sql
-- Purpose: Implement secure employee banking and statutory data foundation with append-only history and strict RLS.

-- 1. Create employee_bank_details table
CREATE TABLE IF NOT EXISTS employee_bank_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    is_active BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create employee_statutory_details table
CREATE TABLE IF NOT EXISTS employee_statutory_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pan_number TEXT,
    uan_number TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    is_active BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enforce One Active Record per Employee using Partial Unique Indexes
CREATE UNIQUE INDEX idx_unique_active_bank ON employee_bank_details (employee_id) WHERE is_active = true;
CREATE UNIQUE INDEX idx_unique_active_statutory ON employee_statutory_details (employee_id) WHERE is_active = true;

-- 4. Enable RLS
ALTER TABLE employee_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_statutory_details ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for employee_bank_details

-- Employees can only view their own records
CREATE POLICY "bank_view_own" ON employee_bank_details
FOR SELECT USING (auth.uid() = employee_id);

-- Employees can only insert their own records (backend validation ensures they can't set status=approved or is_active=true)
CREATE POLICY "bank_insert_own" ON employee_bank_details
FOR INSERT WITH CHECK (auth.uid() = employee_id);

-- HR/Admin can view all records
CREATE POLICY "bank_view_hr_admin" ON employee_bank_details
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('hr', 'admin')
    )
);

-- HR/Admin can update all records (for approval)
CREATE POLICY "bank_update_hr_admin" ON employee_bank_details
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('hr', 'admin')
    )
);

-- 6. RLS Policies for employee_statutory_details

-- Employees can only view their own records
CREATE POLICY "statutory_view_own" ON employee_statutory_details
FOR SELECT USING (auth.uid() = employee_id);

-- Employees can only insert their own records
CREATE POLICY "statutory_insert_own" ON employee_statutory_details
FOR INSERT WITH CHECK (auth.uid() = employee_id);

-- HR/Admin can view all records
CREATE POLICY "statutory_view_hr_admin" ON employee_statutory_details
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('hr', 'admin')
    )
);

-- HR/Admin can update all records (for approval)
CREATE POLICY "statutory_update_hr_admin" ON employee_statutory_details
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('hr', 'admin')
    )
);
