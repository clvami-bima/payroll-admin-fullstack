const pool = require('./src/config/db');

async function check() {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role,
              (password_hash IS NOT NULL) AS has_password
       FROM users
       WHERE email = $1`,
      ['admin@company.com']
    );

    console.log(result.rows);
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

check();