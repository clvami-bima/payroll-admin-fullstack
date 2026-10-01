const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

async function check() {
  try {
    const result = await pool.query(
      'SELECT email, password_hash FROM users WHERE email = $1',
      ['admin@company.com']
    );

    if (!result.rows[0]) {
      console.log('USER TIDAK DITEMUKAN');
      return;
    }

    const valid = await bcrypt.compare(
      'admin123',
      result.rows[0].password_hash
    );

    console.log('Password admin123 cocok:', valid);
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

check();