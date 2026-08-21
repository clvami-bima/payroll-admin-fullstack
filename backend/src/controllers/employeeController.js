const pool = require('../config/db');

// GET /api/employees?search=&department=&status=&page=&limit=
async function listEmployees(req, res, next) {
  try {
    const { search = '', department = '', status = '', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    const values = [];
    let idx = 1;

    if (search) {
      conditions.push(`(name ILIKE $${idx} OR employee_code ILIKE $${idx} OR email ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }
    if (department) {
      conditions.push(`department = $${idx}`);
      values.push(department);
      idx++;
    }
    if (status) {
      conditions.push(`status = $${idx}`);
      values.push(status);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM employees ${whereClause}`, values);
    const total = Number(countResult.rows[0].count);

    values.push(limit, offset);
    const dataResult = await pool.query(
      `SELECT * FROM employees ${whereClause} ORDER BY id DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    res.json({
      data: dataResult.rows,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

async function getEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Karyawan tidak ditemukan.' });

    const components = await pool.query(
      'SELECT * FROM salary_components WHERE employee_id = $1 ORDER BY type, name',
      [id]
    );

    res.json({ ...rows[0], salary_components: components.rows });
  } catch (err) {
    next(err);
  }
}

async function createEmployee(req, res, next) {
  try {
    const { employee_code, name, email, position, department, join_date, base_salary, bank_account } = req.body;

    if (!employee_code || !name || !email || !join_date) {
      return res.status(400).json({ message: 'Kode karyawan, nama, email, dan tanggal join wajib diisi.' });
    }
    if (Number(base_salary) < 0) {
      return res.status(400).json({ message: 'Gaji pokok tidak boleh negatif.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO employees (employee_code, name, email, position, department, join_date, base_salary, bank_account)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [employee_code, name, email, position, department, join_date, base_salary || 0, bank_account]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, position, department, join_date, base_salary, bank_account, status } = req.body;

    const { rows } = await pool.query(
      `UPDATE employees SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        position = COALESCE($3, position),
        department = COALESCE($4, department),
        join_date = COALESCE($5, join_date),
        base_salary = COALESCE($6, base_salary),
        bank_account = COALESCE($7, bank_account),
        status = COALESCE($8, status),
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [name, email, position, department, join_date, base_salary, bank_account, status, id]
    );

    if (!rows[0]) return res.status(404).json({ message: 'Karyawan tidak ditemukan.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM employees WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ message: 'Karyawan tidak ditemukan.' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };
