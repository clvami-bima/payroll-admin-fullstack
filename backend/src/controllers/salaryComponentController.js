const pool = require('../config/db');

async function listByEmployee(req, res, next) {
  try {
    const { employeeId } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM salary_components WHERE employee_id = $1 ORDER BY type, name',
      [employeeId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function createComponent(req, res, next) {
  try {
    const { employeeId } = req.params;
    const { type, name, amount, is_percentage } = req.body;

    if (!['allowance', 'deduction'].includes(type)) {
      return res.status(400).json({ message: "Tipe komponen harus 'allowance' atau 'deduction'." });
    }
    if (!name || amount === undefined || Number(amount) < 0) {
      return res.status(400).json({ message: 'Nama dan jumlah komponen wajib diisi dan tidak boleh negatif.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO salary_components (employee_id, type, name, amount, is_percentage)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [employeeId, type, name, amount, !!is_percentage]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateComponent(req, res, next) {
  try {
    const { id } = req.params;
    const { name, amount, is_percentage } = req.body;

    const { rows } = await pool.query(
      `UPDATE salary_components SET
        name = COALESCE($1, name),
        amount = COALESCE($2, amount),
        is_percentage = COALESCE($3, is_percentage)
       WHERE id = $4 RETURNING *`,
      [name, amount, is_percentage, id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Komponen gaji tidak ditemukan.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteComponent(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM salary_components WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ message: 'Komponen gaji tidak ditemukan.' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listByEmployee, createComponent, updateComponent, deleteComponent };
