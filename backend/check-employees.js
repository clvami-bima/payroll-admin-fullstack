const pool = require('./src/config/db');

async function run() {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        employee_code,
        name,
        department,
        position,
        base_salary,
        status
      FROM employees
      ORDER BY id
    `);

    console.table(rows);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
