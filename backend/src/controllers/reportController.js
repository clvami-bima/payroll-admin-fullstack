const pool = require('../config/db');

// GET /api/reports/summary?month=&year=
// Ringkasan dashboard: total karyawan aktif, total gaji dibayar periode terakhir, dsb.
async function dashboardSummary(req, res, next) {
  try {
    const employeeCountResult = await pool.query("SELECT COUNT(*) FROM employees WHERE status = 'active'");
    const latestPeriodResult = await pool.query(
      `SELECT * FROM payroll_periods WHERE status = 'processed' ORDER BY year DESC, month DESC LIMIT 1`
    );
    const latestPeriod = latestPeriodResult.rows[0];

    let payrollSummary = { total_gross: 0, total_net: 0, total_deduction: 0, employee_count: 0 };
    if (latestPeriod) {
      const sumResult = await pool.query(
        `SELECT
          COALESCE(SUM(gross_salary),0) AS total_gross,
          COALESCE(SUM(net_salary),0) AS total_net,
          COALESCE(SUM(total_deduction),0) AS total_deduction,
          COUNT(*) AS employee_count
         FROM payroll_runs WHERE period_id = $1`,
        [latestPeriod.id]
      );
      payrollSummary = sumResult.rows[0];
    }

    const byDepartmentResult = await pool.query(
      `SELECT department, COUNT(*) AS total FROM employees WHERE status='active' GROUP BY department ORDER BY total DESC`
    );

    res.json({
      total_active_employees: Number(employeeCountResult.rows[0].count),
      latest_period: latestPeriod || null,
      payroll_summary: payrollSummary,
      employees_by_department: byDepartmentResult.rows,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/reports/payroll?year=&department=&page=&limit=
// Laporan histori payroll dengan filter, untuk tabel laporan di frontend.
async function payrollReport(req, res, next) {
  try {
    const { year = '', department = '', month = '', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    const values = [];
    let idx = 1;

    if (year) {
      conditions.push(`pp.year = $${idx}`);
      values.push(year);
      idx++;
    }
    if (month) {
      conditions.push(`pp.month = $${idx}`);
      values.push(month);
      idx++;
    }
    if (department) {
      conditions.push(`e.department = $${idx}`);
      values.push(department);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM payroll_runs pr
       JOIN employees e ON e.id = pr.employee_id
       JOIN payroll_periods pp ON pp.id = pr.period_id
       ${whereClause}`,
      values
    );

    values.push(limit, offset);
    const dataResult = await pool.query(
      `SELECT pr.id, pr.base_salary, pr.total_allowance, pr.total_deduction, pr.gross_salary, pr.net_salary,
              e.name AS employee_name, e.employee_code, e.department,
              pp.month, pp.year
       FROM payroll_runs pr
       JOIN employees e ON e.id = pr.employee_id
       JOIN payroll_periods pp ON pp.id = pr.period_id
       ${whereClause}
       ORDER BY pp.year DESC, pp.month DESC, e.name
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        total: Number(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(Number(countResult.rows[0].count) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboardSummary, payrollReport };
