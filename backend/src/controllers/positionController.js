const pool = require('../config/db');

async function listPositions(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT *
       FROM positions
       ORDER BY name ASC`
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getPosition(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT *
       FROM positions
       WHERE id = $1`,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Jabatan tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function createPosition(req, res, next) {
  try {
    const { name, description, status = 'active' } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Nama jabatan wajib diisi.'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO positions (name, description, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, status]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updatePosition(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const { rows } = await pool.query(
      `UPDATE positions
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
        message: 'Jabatan tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deletePosition(req, res, next) {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM positions
       WHERE id = $1`,
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({
        message: 'Jabatan tidak ditemukan.'
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition
};