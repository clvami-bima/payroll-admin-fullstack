const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ['Admin Payroll', 'admin@company.com', passwordHash]
    );

    const employees = [
      ['EMP001', 'Siti Aminah', 'siti@company.com', 'Staff Finance', 'Finance', '2022-01-10', 6500000],
      ['EMP002', 'Budi Santoso', 'budi@company.com', 'Software Engineer', 'IT', '2021-06-01', 9500000],
      ['EMP003', 'Rina Kartika', 'rina@company.com', 'HR Officer', 'HR', '2023-03-15', 6000000],
    ];

    for (const emp of employees) {
      const res = await client.query(
        `INSERT INTO employees (employee_code, name, email, position, department, join_date, base_salary)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (employee_code) DO NOTHING
         RETURNING id`,
        emp
      );
      const empId = res.rows[0]?.id;
      if (empId) {
        await client.query(
          `INSERT INTO salary_components (employee_id, type, name, amount, is_percentage)
           VALUES
           ($1, 'allowance', 'Tunjangan Transport', 500000, false),
           ($1, 'allowance', 'Tunjangan Makan', 400000, false),
           ($1, 'deduction', 'BPJS Kesehatan', 1, true),
           ($1, 'deduction', 'BPJS Ketenagakerjaan', 2, true)`,
          [empId]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Seed data berhasil ditambahkan (login: admin@company.com / admin123)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed gagal:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
