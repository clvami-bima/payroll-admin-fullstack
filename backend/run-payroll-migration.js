const fs = require('fs');
const pool = require('./src/config/db');

async function run() {
  try {
    const sql = fs.readFileSync(
      './src/db/payroll-migration.sql',
      'utf8'
    );

    await pool.query(sql);

    console.log('Payroll migration berhasil diterapkan.');
  } catch (err) {
    console.error('Migration gagal:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
