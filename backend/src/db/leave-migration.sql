-- =========================================================
-- LEAVE / CUTI MODULE MIGRATION
-- =========================================================

BEGIN;

CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,

  employee_id INTEGER NOT NULL
    REFERENCES employees(id)
    ON DELETE CASCADE,

  leave_type VARCHAR(30) NOT NULL
    CHECK (
      leave_type IN (
        'annual',
        'sick',
        'permission',
        'maternity',
        'other'
      )
    ),

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  total_days INTEGER NOT NULL,

  reason TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'approved',
        'rejected',
        'cancelled'
      )
    ),

  approved_by INTEGER
    REFERENCES users(id)
    ON DELETE SET NULL,

  approved_at TIMESTAMP,

  rejection_reason TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CHECK (end_date >= start_date),
  CHECK (total_days > 0)
);

CREATE TABLE IF NOT EXISTS employee_leave_balances (
  id SERIAL PRIMARY KEY,

  employee_id INTEGER NOT NULL
    REFERENCES employees(id)
    ON DELETE CASCADE,

  year INTEGER NOT NULL,

  annual_quota INTEGER NOT NULL DEFAULT 12,
  annual_used INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (employee_id, year),

  CHECK (annual_quota >= 0),
  CHECK (annual_used >= 0),
  CHECK (annual_used <= annual_quota)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee
ON leave_requests(employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status
ON leave_requests(status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_dates
ON leave_requests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year
ON employee_leave_balances(employee_id, year);

COMMIT;
