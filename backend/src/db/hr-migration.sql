-- =========================================================
-- HR MODULE MIGRATION
-- Menambahkan Departemen, Jabatan, Kontrak Kerja,
-- dan Riwayat Pekerjaan tanpa menghapus data employees lama.
-- =========================================================

BEGIN;

-- =========================================================
-- 1. DEPARTMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 2. POSITIONS / JABATAN
-- =========================================================

CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 3. TAMBAHKAN RELASI DEPARTEMEN & JABATAN KE EMPLOYEES
-- =========================================================

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS department_id INTEGER;

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS position_id INTEGER;

-- =========================================================
-- 4. FOREIGN KEY
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_employees_department'
  ) THEN
    ALTER TABLE employees
    ADD CONSTRAINT fk_employees_department
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_employees_position'
  ) THEN
    ALTER TABLE employees
    ADD CONSTRAINT fk_employees_position
    FOREIGN KEY (position_id)
    REFERENCES positions(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- =========================================================
-- 5. KONTRAK KERJA
-- =========================================================

CREATE TABLE IF NOT EXISTS employment_contracts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL
    REFERENCES employees(id)
    ON DELETE CASCADE,

  contract_type VARCHAR(30) NOT NULL
    CHECK (contract_type IN ('permanent', 'contract', 'internship')),

  start_date DATE NOT NULL,
  end_date DATE,

  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'terminated')),

  notes TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CHECK (end_date IS NULL OR end_date >= start_date)
);

-- =========================================================
-- 6. RIWAYAT PEKERJAAN
-- =========================================================

CREATE TABLE IF NOT EXISTS employment_history (
  id SERIAL PRIMARY KEY,

  employee_id INTEGER NOT NULL
    REFERENCES employees(id)
    ON DELETE CASCADE,

  position_id INTEGER
    REFERENCES positions(id)
    ON DELETE SET NULL,

  department_id INTEGER
    REFERENCES departments(id)
    ON DELETE SET NULL,

  start_date DATE NOT NULL,
  end_date DATE,

  notes TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CHECK (end_date IS NULL OR end_date >= start_date)
);

-- =========================================================
-- 7. INDEX
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_employees_department_id
ON employees(department_id);

CREATE INDEX IF NOT EXISTS idx_employees_position_id
ON employees(position_id);

CREATE INDEX IF NOT EXISTS idx_employment_contracts_employee
ON employment_contracts(employee_id);

CREATE INDEX IF NOT EXISTS idx_employment_contracts_status
ON employment_contracts(status);

CREATE INDEX IF NOT EXISTS idx_employment_history_employee
ON employment_history(employee_id);

CREATE INDEX IF NOT EXISTS idx_employment_history_department
ON employment_history(department_id);

CREATE INDEX IF NOT EXISTS idx_employment_history_position
ON employment_history(position_id);

COMMIT;