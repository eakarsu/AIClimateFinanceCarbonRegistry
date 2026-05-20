const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireRole } = require('../middleware/rbac');

router.get('/', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/unread/count', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query('SELECT COUNT(*)::int AS c FROM notifications WHERE read=false');
    res.json({ count: r.rows[0].c });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/read', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query('UPDATE notifications SET read=true WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/read-all', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read=true WHERE read=false');
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
