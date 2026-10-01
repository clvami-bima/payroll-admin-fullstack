-- =========================================================
-- ATTENDANCE MODULE MIGRATION
-- Check-in, Check-out, keterlambatan, dan lembur
-- =========================================================

BEGIN;

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,

  employee_id INTEGER NOT NULL
    REFERENCES employees(id)
    ON DELETE CASCADE,

  attendance_date DATE NOT NULL,

  check_in TIMESTAMP,
  check_out TIMESTAMP,

  late_minutes INTEGER NOT NULL DEFAULT 0,
  overtime_minutes INTEGER NOT NULL DEFAULT 0,

  status VARCHAR(20) NOT NULL DEFAULT 'present'
    CHECK (status IN (
      'present',
      'late',
      'absent',
      'leave',
      'sick'
    )),

  notes TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (employee_id, attendance_date),

  CHECK (
    check_out IS NULL
    OR check_in IS NULL
    OR check_out >= check_in
  ),

  CHECK (late_minutes >= 0),
  CHECK (overtime_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee
ON attendance(employee_id);

CREATE INDEX IF NOT EXISTS idx_attendance_date
ON attendance(attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
ON attendance(employee_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_status
ON attendance(status);

COMMIT;
