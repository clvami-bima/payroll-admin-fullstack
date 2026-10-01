const pool = require('../config/db');

// =========================================================
// DEPARTMENTS
// =========================================================

async function listDepartments(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT d.*,
              COUNT(e.id)::int AS employee_count
       FROM departments d
       LEFT JOIN employees e ON e.department_id = d.id
       GROUP BY d.id
       ORDER BY d.name ASC`
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { name, description, status = 'active' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Nama departemen wajib diisi.',
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO departments (name, description, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), description || null, status]
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
        message: 'Departemen tidak ditemukan.',
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
      'DELETE FROM departments WHERE id = $1',
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({
        message: 'Departemen tidak ditemukan.',
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// =========================================================
// POSITIONS
// =========================================================

async function listPositions(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT p.*,
              COUNT(e.id)::int AS employee_count
       FROM positions p
       LEFT JOIN employees e ON e.position_id = p.id
       GROUP BY p.id
       ORDER BY p.name ASC`
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function createPosition(req, res, next) {
  try {
    const { name, description, status = 'active' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Nama jabatan wajib diisi.',
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO positions (name, description, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), description || null, status]
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
        message: 'Jabatan tidak ditemukan.',
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
      'DELETE FROM positions WHERE id = $1',
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({
        message: 'Jabatan tidak ditemukan.',
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// =========================================================
// EMPLOYEE HR DETAIL
// =========================================================

async function getEmployeeHR(req, res, next) {
  try {
    const { id } = req.params;

    const employeeResult = await pool.query(
      `SELECT
         e.*,
         d.name AS department_name,
         p.name AS position_name
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN positions p ON p.id = e.position_id
       WHERE e.id = $1`,
      [id]
    );

    if (!employeeResult.rows[0]) {
      return res.status(404).json({
        message: 'Karyawan tidak ditemukan.',
      });
    }

    const contractsResult = await pool.query(
      `SELECT *
       FROM employment_contracts
       WHERE employee_id = $1
       ORDER BY start_date DESC, id DESC`,
      [id]
    );

    const historyResult = await pool.query(
      `SELECT
         h.*,
         p.name AS position_name,
         d.name AS department_name
       FROM employment_history h
       LEFT JOIN positions p ON p.id = h.position_id
       LEFT JOIN departments d ON d.id = h.department_id
       WHERE h.employee_id = $1
       ORDER BY h.start_date DESC, h.id DESC`,
      [id]
    );

    res.json({
      ...employeeResult.rows[0],
      contracts: contractsResult.rows,
      employment_history: historyResult.rows,
    });
  } catch (err) {
    next(err);
  }
}

// =========================================================
// EMPLOYMENT CONTRACTS
// =========================================================

async function listContracts(req, res, next) {
  try {
    const { id } = req.params;

    const employeeResult = await pool.query(
      'SELECT id FROM employees WHERE id = $1',
      [id]
    );

    if (!employeeResult.rows[0]) {
      return res.status(404).json({
        message: 'Karyawan tidak ditemukan.',
      });
    }

    const { rows } = await pool.query(
      `SELECT *
       FROM employment_contracts
       WHERE employee_id = $1
       ORDER BY start_date DESC, id DESC`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function createContract(req, res, next) {
  try {
    const { id } = req.params;

    const {
      contract_type,
      start_date,
      end_date,
      status = 'active',
      notes,
    } = req.body;

    if (!contract_type || !start_date) {
      return res.status(400).json({
        message: 'Jenis kontrak dan tanggal mulai wajib diisi.',
      });
    }

    const employeeResult = await pool.query(
      'SELECT id FROM employees WHERE id = $1',
      [id]
    );

    if (!employeeResult.rows[0]) {
      return res.status(404).json({
        message: 'Karyawan tidak ditemukan.',
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO employment_contracts
       (employee_id, contract_type, start_date, end_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        contract_type,
        start_date,
        end_date || null,
        status,
        notes || null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateContract(req, res, next) {
  try {
    const { id, contractId } = req.params;

    const {
      contract_type,
      start_date,
      end_date,
      status,
      notes,
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
         AND employee_id = $7
       RETURNING *`,
      [
        contract_type,
        start_date,
        end_date,
        status,
        notes,
        contractId,
        id,
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Kontrak tidak ditemukan.',
      });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// =========================================================
// EMPLOYMENT HISTORY
// =========================================================

async function listEmploymentHistory(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT
         h.*,
         p.name AS position_name,
         d.name AS department_name
       FROM employment_history h
       LEFT JOIN positions p ON p.id = h.position_id
       LEFT JOIN departments d ON d.id = h.department_id
       WHERE h.employee_id = $1
       ORDER BY h.start_date DESC, h.id DESC`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function createEmploymentHistory(req, res, next) {
  try {
    const { id } = req.params;

    const {
      position_id,
      department_id,
      start_date,
      end_date,
      notes,
    } = req.body;

    if (!start_date) {
      return res.status(400).json({
        message: 'Tanggal mulai wajib diisi.',
      });
    }

    const employeeResult = await pool.query(
      'SELECT id FROM employees WHERE id = $1',
      [id]
    );

    if (!employeeResult.rows[0]) {
      return res.status(404).json({
        message: 'Karyawan tidak ditemukan.',
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO employment_history
       (employee_id, position_id, department_id, start_date, end_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        position_id || null,
        department_id || null,
        start_date,
        end_date || null,
        notes || null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,

  listPositions,
  createPosition,
  updatePosition,
  deletePosition,

  getEmployeeHR,

  listContracts,
  createContract,
  updateContract,

  listEmploymentHistory,
  createEmploymentHistory,
};