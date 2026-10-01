const pool = require('./src/config/db');

async function run() {
  try {
    const { rows } = await pool.query(`
      SELECT id, month, year, status
      FROM payroll_periods
      ORDER BY year DESC, month DESC, id DESC
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
