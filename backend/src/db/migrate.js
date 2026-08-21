const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Migration berhasil - tabel siap digunakan.');
  } catch (err) {
    console.error('Migration gagal:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
