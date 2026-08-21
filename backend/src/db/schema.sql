-- =========================================================
-- Skema database Payroll Admin (PostgreSQL)
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  employee_code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  position VARCHAR(100),
  department VARCHAR(100),
  join_date DATE NOT NULL,
  base_salary NUMERIC(14,2) NOT NULL DEFAULT 0,
  bank_account VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_components (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('allowance', 'deduction')),
  name VARCHAR(100) NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_percentage BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_periods (
  id SERIAL PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (month, year)
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id SERIAL PRIMARY KEY,
  period_id INTEGER NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  base_salary NUMERIC(14,2) NOT NULL,
  total_allowance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_deduction NUMERIC(14,2) NOT NULL DEFAULT 0,
  gross_salary NUMERIC(14,2) NOT NULL,
  net_salary NUMERIC(14,2) NOT NULL,
  component_breakdown JSONB,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (period_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_salary_components_employee ON salary_components(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs(period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_employee ON payroll_runs(employee_id);
