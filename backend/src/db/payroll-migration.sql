-- =========================================================
-- PAYROLL MODULE MIGRATION
-- =========================================================

BEGIN;

ALTER TABLE salary_components
ADD COLUMN IF NOT EXISTS category VARCHAR(30);

UPDATE salary_components
SET category = CASE
  WHEN type = 'allowance' THEN 'allowance'
  WHEN type = 'deduction' THEN 'deduction'
  ELSE type
END
WHERE category IS NULL;

ALTER TABLE salary_components
ALTER COLUMN category SET DEFAULT 'allowance';

CREATE INDEX IF NOT EXISTS idx_salary_components_category
ON salary_components(category);

-- =========================================================
-- TAMBAHAN DATA PAYROLL RUN
-- =========================================================

ALTER TABLE payroll_runs
ADD COLUMN IF NOT EXISTS total_bonus NUMERIC(14,2) NOT NULL DEFAULT 0;

ALTER TABLE payroll_runs
ADD COLUMN IF NOT EXISTS total_tax NUMERIC(14,2) NOT NULL DEFAULT 0;

ALTER TABLE payroll_runs
ADD COLUMN IF NOT EXISTS total_bpjs NUMERIC(14,2) NOT NULL DEFAULT 0;

-- =========================================================
-- STATUS PAYROLL PERIOD
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payroll_period_status_check'
  ) THEN
    ALTER TABLE payroll_periods
    ADD CONSTRAINT payroll_period_status_check
    CHECK (
      status IN (
        'draft',
        'processing',
        'completed',
        'locked'
      )
    );
  END IF;
END $$;

COMMIT;
