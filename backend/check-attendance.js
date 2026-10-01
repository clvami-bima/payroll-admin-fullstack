const pool = require('./src/config/db');

async function run() {
  try {
    const { rows } = await pool.query(`
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'attendance'
      ORDER BY ordinal_position
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
