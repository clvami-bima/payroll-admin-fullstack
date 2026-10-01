const pool = require('../config/db');

async function listDepartments(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT *
       FROM departments
       ORDER BY name ASC`
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getDepartment(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT *
       FROM departments
       WHERE id = $1`,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Departemen tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { name, description, status = 'active' } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Nama departemen wajib diisi.'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO departments (name, description, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, status]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const { rows } = await pool.query(
      `UPDATE departments
       SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name, description, status, id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Departemen tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM departments
       WHERE id = $1`,
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({
        message: 'Departemen tidak ditemukan.'
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
};