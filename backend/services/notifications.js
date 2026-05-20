const pool = require('../config/database');

async function notify(type, title, body, userEmail = null) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_email, type, title, body) VALUES ($1,$2,$3,$4)`,
      [userEmail, type, title, body]
    );
  } catch (e) {
    console.warn('[notifications] insert failed:', e.message);
  }
}

module.exports = { notify };
