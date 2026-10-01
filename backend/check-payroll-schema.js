const pool = require('./src/config/db');

async function run() {
  try {
    const { rows } = await pool.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name IN (
        'salary_components',
        'payroll_periods',
        'payroll_runs'
      )
      ORDER BY table_name, ordinal_position
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
