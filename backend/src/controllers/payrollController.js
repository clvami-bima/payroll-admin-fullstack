const pool = require('../config/db');
const { generatePayslipPdf } = require('../utils/payslipPdf');

// Hitung gaji satu karyawan berdasarkan komponen gaji miliknya.
function calculateSalary(baseSalary, components) {
  let totalAllowance = 0;
  let totalDeduction = 0;
  const breakdown = [];

  for (const c of components) {
    const computedAmount = c.is_percentage
      ? Math.round((Number(c.amount) / 100) * Number(baseSalary))
      : Number(c.amount);

    if (c.type === 'allowance') totalAllowance += computedAmount;
    else totalDeduction += computedAmount;

    breakdown.push({
      name: c.name,
      type: c.type,
      is_percentage: c.is_percentage,
      amount: Number(c.amount),
      computed_amount: computedAmount,
    });
  }

  const grossSalary = Number(baseSalary) + totalAllowance;
  const netSalary = grossSalary - totalDeduction;

  return { totalAllowance, totalDeduction, grossSalary, netSalary, breakdown };
}

// POST /api/payroll/periods { month, year }
async function createPeriod(req, res, next) {
  try {
    const { month, year } = req.body;
    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ message: 'Bulan (1-12) dan tahun wajib diisi dengan benar.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO payroll_periods (month, year) VALUES ($1,$2)
       ON CONFLICT (month, year) DO NOTHING RETURNING *`,
      [month, year]
    );

    if (!rows[0]) {
      const existing = await pool.query('SELECT * FROM payroll_periods WHERE month=$1 AND year=$2', [month, year]);
      return res.status(200).json(existing.rows[0]);
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listPeriods(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM payroll_periods ORDER BY year DESC, month DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/payroll/periods/:periodId/run
// Menjalankan payroll untuk semua karyawan aktif pada periode ini.
async function runPayroll(req, res, next) {
  const client = await pool.connect();
  try {
    const { periodId } = req.params;

    const periodResult = await client.query('SELECT * FROM payroll_periods WHERE id = $1', [periodId]);
    const period = periodResult.rows[0];
    if (!period) return res.status(404).json({ message: 'Periode payroll tidak ditemukan.' });

    const employeesResult = await client.query("SELECT * FROM employees WHERE status = 'active'");
    const employees = employeesResult.rows;

    await client.query('BEGIN');

    const results = [];
    for (const emp of employees) {
      const componentsResult = await client.query('SELECT * FROM salary_components WHERE employee_id = $1', [emp.id]);
      const calc = calculateSalary(emp.base_salary, componentsResult.rows);

      const { rows } = await client.query(
        `INSERT INTO payroll_runs
          (period_id, employee_id, base_salary, total_allowance, total_deduction, gross_salary, net_salary, component_breakdown)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (period_id, employee_id) DO UPDATE SET
           base_salary = EXCLUDED.base_salary,
           total_allowance = EXCLUDED.total_allowance,
           total_deduction = EXCLUDED.total_deduction,
           gross_salary = EXCLUDED.gross_salary,
           net_salary = EXCLUDED.net_salary,
           component_breakdown = EXCLUDED.component_breakdown,
           generated_at = NOW()
         RETURNING *`,
        [periodId, emp.id, emp.base_salary, calc.totalAllowance, calc.totalDeduction, calc.grossSalary, calc.netSalary, JSON.stringify(calc.breakdown)]
      );
      results.push(rows[0]);
    }

    await client.query("UPDATE payroll_periods SET status = 'processed' WHERE id = $1", [periodId]);
    await client.query('COMMIT');

    res.json({ message: `Payroll berhasil dijalankan untuk ${results.length} karyawan.`, data: results });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// GET /api/payroll/periods/:periodId/runs
async function listPayrollRuns(req, res, next) {
  try {
    const { periodId } = req.params;
    const { rows } = await pool.query(
      `SELECT pr.*, e.name AS employee_name, e.employee_code, e.department
       FROM payroll_runs pr
       JOIN employees e ON e.id = pr.employee_id
       WHERE pr.period_id = $1
       ORDER BY e.name`,
      [periodId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/payroll/runs/:runId/payslip -> download PDF
async function downloadPayslip(req, res, next) {
  try {
    const { runId } = req.params;

    const runResult = await pool.query(
      `SELECT pr.*, e.name, e.employee_code, e.position, e.department,
              pp.month, pp.year
       FROM payroll_runs pr
       JOIN employees e ON e.id = pr.employee_id
       JOIN payroll_periods pp ON pp.id = pr.period_id
       WHERE pr.id = $1`,
      [runId]
    );

    const run = runResult.rows[0];
    if (!run) return res.status(404).json({ message: 'Data payroll tidak ditemukan.' });

    generatePayslipPdf(res, {
      employee: {
        name: run.name,
        employee_code: run.employee_code,
        position: run.position,
        department: run.department,
      },
      period: { month: run.month, year: run.year },
      payrollRun: {
        base_salary: run.base_salary,
        gross_salary: run.gross_salary,
        total_deduction: run.total_deduction,
        net_salary: run.net_salary,
        component_breakdown: run.component_breakdown,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPeriod, listPeriods, runPayroll, listPayrollRuns, downloadPayslip, calculateSalary };
