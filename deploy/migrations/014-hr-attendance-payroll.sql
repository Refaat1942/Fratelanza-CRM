-- Migration 014: HR attendance, payroll, employee clock tokens
-- Safe to re-run. Apply to every existing tenant database.

BEGIN;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS pay_type TEXT DEFAULT 'monthly';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS clock_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_employees_clock_token ON employees(clock_token);

CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  branch_id INTEGER,
  type TEXT NOT NULL,
  clocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method TEXT NOT NULL DEFAULT 'qr',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_clocked_at ON attendance_records(clocked_at);
CREATE INDEX IF NOT EXISTS idx_attendance_branch ON attendance_records(branch_id);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id SERIAL PRIMARY KEY,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  branch_id INTEGER,
  total_amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  notes_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);

CREATE TABLE IF NOT EXISTS payroll_lines (
  id SERIAL PRIMARY KEY,
  payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  base_salary REAL NOT NULL DEFAULT 0,
  hours_worked REAL NOT NULL DEFAULT 0,
  overtime_hours REAL NOT NULL DEFAULT 0,
  overtime_pay REAL NOT NULL DEFAULT 0,
  deductions REAL NOT NULL DEFAULT 0,
  net_amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payroll_lines_run ON payroll_lines(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_lines_employee ON payroll_lines(employee_id);

COMMIT;
