const pool = require('../config/db');

async function listSalaryComponents(req, res, next) {
  try {
    const { employeeId } = req.query;

    let query = `
      SELECT
        sc.id,
        sc.employee_id,
        e.employee_code,
        e.name AS employee_name,
        sc.type,
        sc.category,
        sc.name,
        sc.amount,
        sc.is_percentage,
        sc.created_at
      FROM salary_components sc
      JOIN employees e ON e.id = sc.employee_id
    `;

    const params = [];

    if (employeeId) {
      params.push(employeeId);
      query += ` WHERE sc.employee_id = $1`;
    }

    query += ` ORDER BY e.name ASC, sc.category ASC, sc.name ASC`;

    const { rows } = await pool.query(query, params);

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getSalaryComponent(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT
        sc.id,
        sc.employee_id,
        e.employee_code,
        e.name AS employee_name,
        sc.type,
        sc.category,
        sc.name,
        sc.amount,
        sc.is_percentage,
        sc.created_at
      FROM salary_components sc
      JOIN employees e ON e.id = sc.employee_id
      WHERE sc.id = $1
      `,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Komponen gaji tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function createSalaryComponent(req, res, next) {
  try {
    const {
      employee_id,
      type,
      category,
      name,
      amount = 0,
      is_percentage = false
    } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        message: 'Employee wajib dipilih.'
      });
    }

    if (!type || !['allowance', 'deduction'].includes(type)) {
      return res.status(400).json({
        message: 'Type harus allowance atau deduction.'
      });
    }

    if (!name) {
      return res.status(400).json({
        message: 'Nama komponen wajib diisi.'
      });
    }

    if (Number(amount) < 0) {
      return res.status(400).json({
        message: 'Nominal komponen tidak boleh negatif.'
      });
    }

    const normalizedCategory =
      category ||
      (type === 'deduction' ? 'deduction' : 'allowance');

    const { rows } = await pool.query(
      `
      INSERT INTO salary_components (
        employee_id,
        type,
        category,
        name,
        amount,
        is_percentage
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        employee_id,
        type,
        normalizedCategory,
        name,
        amount,
        is_percentage
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateSalaryComponent(req, res, next) {
  try {
    const { id } = req.params;

    const {
      type,
      category,
      name,
      amount,
      is_percentage
    } = req.body;

    const { rows } = await pool.query(
      `
      UPDATE salary_components
      SET
        type = COALESCE($1, type),
        category = COALESCE($2, category),
        name = COALESCE($3, name),
        amount = COALESCE($4, amount),
        is_percentage = COALESCE($5, is_percentage)
      WHERE id = $6
      RETURNING *
      `,
      [
        type,
        category,
        name,
        amount,
        is_percentage,
        id
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Komponen gaji tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteSalaryComponent(req, res, next) {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `
      DELETE FROM salary_components
      WHERE id = $1
      `,
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({
        message: 'Komponen gaji tidak ditemukan.'
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSalaryComponents,
  getSalaryComponent,
  createSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent
};
