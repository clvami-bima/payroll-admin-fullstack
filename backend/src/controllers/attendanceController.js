const pool = require('../config/db');

function calculateLateMinutes(checkIn) {
  if (!checkIn) return 0;

  const date = new Date(checkIn);

  const workStart = new Date(date);
  workStart.setHours(8, 0, 0, 0);

  const diff = Math.floor((date - workStart) / 60000);

  return Math.max(diff, 0);
}

function calculateOvertimeMinutes(checkOut) {
  if (!checkOut) return 0;

  const date = new Date(checkOut);

  const workEnd = new Date(date);
  workEnd.setHours(17, 0, 0, 0);

  const diff = Math.floor((date - workEnd) / 60000);

  return Math.max(diff, 0);
}

async function listAttendance(req, res, next) {
  try {
    const { employee_id, date, start_date, end_date, status } = req.query;

    const conditions = [];
    const values = [];

    if (employee_id) {
      values.push(employee_id);
      conditions.push(`a.employee_id = $${values.length}`);
    }

    if (date) {
      values.push(date);
      conditions.push(`a.attendance_date = $${values.length}`);
    }

    if (start_date) {
      values.push(start_date);
      conditions.push(`a.attendance_date >= $${values.length}`);
    }

    if (end_date) {
      values.push(end_date);
      conditions.push(`a.attendance_date <= $${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`a.status = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const { rows } = await pool.query(
      `
      SELECT
        a.*,
        e.employee_code,
        e.name AS employee_name,
        e.department,
        e.position
      FROM attendance a
      JOIN employees e
        ON e.id = a.employee_id
      ${whereClause}
      ORDER BY a.attendance_date DESC, e.name ASC
      `,
      values
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getAttendance(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT
        a.*,
        e.employee_code,
        e.name AS employee_name,
        e.department,
        e.position
      FROM attendance a
      JOIN employees e
        ON e.id = a.employee_id
      WHERE a.id = $1
      `,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Data absensi tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function checkIn(req, res, next) {
  try {
    const {
      employee_id,
      attendance_date,
      check_in,
      notes
    } = req.body;

    if (!employee_id || !attendance_date) {
      return res.status(400).json({
        message: 'employee_id dan attendance_date wajib diisi.'
      });
    }

    const checkInTime = check_in
      ? new Date(check_in)
      : new Date();

    const lateMinutes = calculateLateMinutes(checkInTime);

    const status = lateMinutes > 0
      ? 'late'
      : 'present';

    const { rows } = await pool.query(
      `
      INSERT INTO attendance (
        employee_id,
        attendance_date,
        check_in,
        late_minutes,
        status,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        employee_id,
        attendance_date,
        checkInTime,
        lateMinutes,
        status,
        notes || null
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        message: 'Karyawan sudah memiliki data absensi pada tanggal tersebut.'
      });
    }

    next(err);
  }
}

async function checkOut(req, res, next) {
  try {
    const { id } = req.params;
    const { check_out } = req.body;

    const checkOutTime = check_out
      ? new Date(check_out)
      : new Date();

    const overtimeMinutes = calculateOvertimeMinutes(checkOutTime);

    const { rows } = await pool.query(
      `
      UPDATE attendance
      SET
        check_out = $1,
        overtime_minutes = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [
        checkOutTime,
        overtimeMinutes,
        id
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Data absensi tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function createAttendance(req, res, next) {
  try {
    const {
      employee_id,
      attendance_date,
      check_in,
      check_out,
      status = 'present',
      notes
    } = req.body;

    if (!employee_id || !attendance_date) {
      return res.status(400).json({
        message: 'employee_id dan attendance_date wajib diisi.'
      });
    }

    const checkInTime = check_in
      ? new Date(check_in)
      : null;

    const checkOutTime = check_out
      ? new Date(check_out)
      : null;

    const lateMinutes = calculateLateMinutes(checkInTime);
    const overtimeMinutes = calculateOvertimeMinutes(checkOutTime);

    const { rows } = await pool.query(
      `
      INSERT INTO attendance (
        employee_id,
        attendance_date,
        check_in,
        check_out,
        late_minutes,
        overtime_minutes,
        status,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        employee_id,
        attendance_date,
        checkInTime,
        checkOutTime,
        lateMinutes,
        overtimeMinutes,
        status,
        notes || null
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        message: 'Karyawan sudah memiliki data absensi pada tanggal tersebut.'
      });
    }

    next(err);
  }
}

async function updateAttendance(req, res, next) {
  try {
    const { id } = req.params;

    const {
      check_in,
      check_out,
      status,
      notes
    } = req.body;

    const checkInTime = check_in
      ? new Date(check_in)
      : null;

    const checkOutTime = check_out
      ? new Date(check_out)
      : null;

    const lateMinutes = calculateLateMinutes(checkInTime);
    const overtimeMinutes = calculateOvertimeMinutes(checkOutTime);

    const { rows } = await pool.query(
      `
      UPDATE attendance
      SET
        check_in = COALESCE($1, check_in),
        check_out = COALESCE($2, check_out),
        late_minutes = CASE
          WHEN $1 IS NOT NULL THEN $3
          ELSE late_minutes
        END,
        overtime_minutes = CASE
          WHEN $2 IS NOT NULL THEN $4
          ELSE overtime_minutes
        END,
        status = COALESCE($5, status),
        notes = COALESCE($6, notes),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
      `,
      [
        checkInTime,
        checkOutTime,
        lateMinutes,
        overtimeMinutes,
        status,
        notes,
        id
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Data absensi tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteAttendance(req, res, next) {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `
      DELETE FROM attendance
      WHERE id = $1
      `,
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({
        message: 'Data absensi tidak ditemukan.'
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function attendanceSummary(req, res, next) {
  try {
    const {
      employee_id,
      start_date,
      end_date
    } = req.query;

    const conditions = [];
    const values = [];

    if (employee_id) {
      values.push(employee_id);
      conditions.push(`a.employee_id = $${values.length}`);
    }

    if (start_date) {
      values.push(start_date);
      conditions.push(`a.attendance_date >= $${values.length}`);
    }

    if (end_date) {
      values.push(end_date);
      conditions.push(`a.attendance_date <= $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const { rows } = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE a.status = 'present'
        ) AS present_days,

        COUNT(*) FILTER (
          WHERE a.status = 'late'
        ) AS late_days,

        COUNT(*) FILTER (
          WHERE a.status = 'absent'
        ) AS absent_days,

        COUNT(*) FILTER (
          WHERE a.status = 'leave'
        ) AS leave_days,

        COUNT(*) FILTER (
          WHERE a.status = 'sick'
        ) AS sick_days,

        COALESCE(SUM(a.late_minutes), 0) AS total_late_minutes,

        COALESCE(SUM(a.overtime_minutes), 0) AS total_overtime_minutes

      FROM attendance a
      ${whereClause}
      `,
      values
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAttendance,
  getAttendance,
  checkIn,
  checkOut,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  attendanceSummary
};