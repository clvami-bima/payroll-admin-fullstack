const pool = require('../config/db');

async function listContracts(req, res, next) {
  try {
    const { employee_id, status } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (employee_id) {
      conditions.push(`ec.employee_id = $${idx}`);
      values.push(employee_id);
      idx++;
    }

    if (status) {
      conditions.push(`ec.status = $${idx}`);
      values.push(status);
      idx++;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const { rows } = await pool.query(
      `SELECT
         ec.*,
         e.employee_code,
         e.name AS employee_name
       FROM employment_contracts ec
       JOIN employees e ON e.id = ec.employee_id
       ${whereClause}
       ORDER BY ec.start_date DESC`,
      values
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getContract(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT
         ec.*,
         e.employee_code,
         e.name AS employee_name
       FROM employment_contracts ec
       JOIN employees e ON e.id = ec.employee_id
       WHERE ec.id = $1`,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Kontrak kerja tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function createContract(req, res, next) {
  try {
    const {
      employee_id,
      contract_type,
      start_date,
      end_date,
      status = 'active',
      notes
    } = req.body;

    if (!employee_id || !contract_type || !start_date) {
      return res.status(400).json({
        message: 'Karyawan, jenis kontrak, dan tanggal mulai wajib diisi.'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO employment_contracts
       (employee_id, contract_type, start_date, end_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        employee_id,
        contract_type,
        start_date,
        end_date || null,
        status,
        notes || null
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateContract(req, res, next) {
  try {
    const { id } = req.params;

    const {
      contract_type,
      start_date,
      end_date,
      status,
      notes
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE employment_contracts
       SET
         contract_type = COALESCE($1, contract_type),
         start_date = COALESCE($2, start_date),
         end_date = COALESCE($3, end_date),
         status = COALESCE($4, status),
         notes = COALESCE($5, notes),
         updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        contract_type,
        start_date,
        end_date,
        status,
        notes,
        id
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Kontrak kerja tidak ditemukan.'
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteContract(req, res, next) {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM employment_contracts
       WHERE id = $1`,
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({
        message: 'Kontrak kerja tidak ditemukan.'
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract
};