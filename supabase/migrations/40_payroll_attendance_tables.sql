-- 40_payroll_attendance_tables.sql

CREATE TABLE IF NOT EXISTS payroll_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  locked_by UUID REFERENCES profiles(id),
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES payroll_cycles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id),
  employee_name TEXT,
  employee_id_external TEXT,
  department TEXT,
  designation TEXT,
  base_salary NUMERIC,
  days_present INTEGER,
  days_field INTEGER,
  days_paid_leave INTEGER,
  days_unpaid_leave INTEGER,
  days_absent INTEGER,
  net_payable NUMERIC,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  finalized BOOLEAN DEFAULT false,
  notes TEXT,
  locked_payroll_cycle_id UUID REFERENCES payroll_cycles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payroll_cycles_month_year ON payroll_cycles(month, year);
CREATE INDEX IF NOT EXISTS idx_payroll_snapshots_cycle_id ON payroll_snapshots(cycle_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_employee_id_date ON attendance_logs(employee_id, date);
