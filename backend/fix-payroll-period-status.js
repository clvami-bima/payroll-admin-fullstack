const pool = require('./src/config/db');

async function run() {
  try {
    await pool.query(`
      UPDATE payroll_periods
      SET status = 'completed'
      WHERE status = 'processed'
    `);

    console.log('Status payroll_periods berhasil dinormalisasi.');
  } catch (err) {
    console.error('Gagal:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
