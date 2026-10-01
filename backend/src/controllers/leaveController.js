const pool = require('../config/db');

function calculateTotalDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diff = end.getTime() - start.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

async function listLeaveRequests(req, res, next) {
  try {
    const { employeeId, status } = req.query;

    let query = `
      SELECT
        lr.id,
        lr.employee_id,
        e.employee_code,
        e.name AS employee_name,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.approved_by,
        lr.approved_at,
        lr.rejection_reason,
        lr.created_at,
        lr.updated_at
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
    `;

    const conditions = [];
    const params = [];

    if (employeeId) {
      params.push(employeeId);
      conditions.push(`lr.employee_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`lr.status = $${params.length}`);
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      ORDER BY lr.start_date DESC, lr.id DESC
    `;

    const { rows } = await pool.query(query, params);

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getLeaveRequest(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT
        lr.id,
        lr.employee_id,
        e.employee_code,
        e.name AS employee_name,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.approved_by,
        lr.approved_at,
        lr.rejection_reason,
        lr.created_at,
        lr.updated_at
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      WHERE lr.id = $1
      `,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Pengajuan cuti tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function createLeaveRequest(req, res, next) {
  const client = await pool.connect();

  try {
    const {
      employee_id,
      leave_type,
      start_date,
      end_date,
      reason
    } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        message: 'Employee wajib dipilih.'
      });
    }

    const allowedTypes = [
      'annual',
      'sick',
      'permission',
      'maternity',
      'other'
    ];

    if (!allowedTypes.includes(leave_type)) {
      return res.status(400).json({
        message: 'Jenis cuti tidak valid.'
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        message: 'Tanggal mulai dan tanggal selesai wajib diisi.'
      });
    }

    const totalDays = calculateTotalDays(start_date, end_date);

    if (totalDays <= 0) {
      return res.status(400).json({
        message: 'Rentang tanggal cuti tidak valid.'
      });
    }

    const employee = await client.query(
      `
      SELECT id
      FROM employees
      WHERE id = $1
        AND status = 'active'
      `,
      [employee_id]
    );

    if (!employee.rows[0]) {
      return res.status(400).json({
        message: 'Employee tidak ditemukan atau tidak aktif.'
      });
    }

    const overlapping = await client.query(
      `
      SELECT id
      FROM leave_requests
      WHERE employee_id = $1
        AND status IN ('pending', 'approved')
        AND start_date <= $3
        AND end_date >= $2
      LIMIT 1
      `,
      [employee_id, start_date, end_date]
    );

    if (overlapping.rows[0]) {
      return res.status(400).json({
        message: 'Tanggal cuti bertabrakan dengan pengajuan cuti lain.'
      });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `
      INSERT INTO leave_requests (
        employee_id,
        leave_type,
        start_date,
        end_date,
        total_days,
        reason
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        employee_id,
        leave_type,
        start_date,
        end_date,
        totalDays,
        reason || null
      ]
    );

    await client.query('COMMIT');

    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

async function approveLeaveRequest(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const leaveResult = await client.query(
      `
      SELECT *
      FROM leave_requests
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    const leave = leaveResult.rows[0];

    if (!leave) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        message: 'Pengajuan cuti tidak ditemukan.'
      });
    }

    if (leave.status !== 'pending') {
      await client.query('ROLLBACK');

      return res.status(400).json({
        message: 'Hanya pengajuan pending yang dapat disetujui.'
      });
    }

    if (leave.leave_type === 'annual') {
      const year = new Date(leave.start_date).getFullYear();

      const balanceResult = await client.query(
        `
        INSERT INTO employee_leave_balances (
          employee_id,
          year
        )
        VALUES ($1, $2)
        ON CONFLICT (employee_id, year)
        DO UPDATE SET updated_at = NOW()
        RETURNING *
        `,
        [leave.employee_id, year]
      );

      const balance = balanceResult.rows[0];

      const remaining =
        balance.annual_quota - balance.annual_used;

      if (leave.total_days > remaining) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          message: 'Sisa cuti tahunan tidak mencukupi.',
          remaining_days: remaining
        });
      }

      await client.query(
        `
        UPDATE employee_leave_balances
        SET
          annual_used = annual_used + $1,
          updated_at = NOW()
        WHERE employee_id = $2
          AND year = $3
        `,
        [
          leave.total_days,
          leave.employee_id,
          year
        ]
      );
    }

    const result = await client.query(
      `
      UPDATE leave_requests
      SET
        status = 'approved',
        approved_by = $1,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [
        req.user?.id || null,
        id
      ]
    );

    await client.query('COMMIT');

    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

async function rejectLeaveRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const { rows } = await pool.query(
      `
      UPDATE leave_requests
      SET
        status = 'rejected',
        rejection_reason = $1,
        updated_at = NOW()
      WHERE id = $2
        AND status = 'pending'
      RETURNING *
      `,
      [
        rejection_reason || null,
        id
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Pengajuan cuti tidak ditemukan atau sudah diproses.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function cancelLeaveRequest(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      UPDATE leave_requests
      SET
        status = 'cancelled',
        updated_at = NOW()
      WHERE id = $1
        AND status = 'pending'
      RETURNING *
      `,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Pengajuan cuti tidak ditemukan atau tidak dapat dibatalkan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function getLeaveBalance(req, res, next) {
  try {
    const { employeeId } = req.params;
    const year =
      Number(req.query.year) ||
      new Date().getFullYear();

    const { rows } = await pool.query(
      `
      INSERT INTO employee_leave_balances (
        employee_id,
        year
      )
      VALUES ($1, $2)
      ON CONFLICT (employee_id, year)
      DO UPDATE SET updated_at = NOW()
      RETURNING
        id,
        employee_id,
        year,
        annual_quota,
        annual_used,
        annual_quota - annual_used AS annual_remaining
      `,
      [employeeId, year]
    );

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function getLeaveHistory(req, res, next) {
  try {
    const { employeeId } = req.params;

    const { rows } = await pool.query(
      `
      SELECT
        lr.id,
        lr.employee_id,
        e.employee_code,
        e.name AS employee_name,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        lr.status,
        lr.rejection_reason,
        lr.approved_at,
        lr.created_at
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      WHERE lr.employee_id = $1
      ORDER BY lr.start_date DESC, lr.id DESC
      `,
      [employeeId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listLeaveRequests,
  getLeaveRequest,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getLeaveBalance,
  getLeaveHistory
};
