const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/database');
const { requireRole } = require('../middleware/rbac');
const { fireWebhook } = require('../services/webhooks');

router.get('/', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query('SELECT id, url, events, active, created_at FROM webhooks ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireRole('admin', 'registrar'), async (req, res) => {
  try {
    const { url, events, secret } = req.body || {};
    if (!url || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'url and events[] required' });
    }
    const sec = secret || crypto.randomBytes(16).toString('hex');
    const r = await pool.query(
      `INSERT INTO webhooks (url, events, secret, active) VALUES ($1,$2,$3,true) RETURNING *`,
      [url, events, sec]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM webhooks WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/webhooks/deliveries — recent delivery log
router.get('/deliveries/log', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT d.id, d.webhook_id, d.event, d.signature, d.response_status, d.delivered_at, w.url
         FROM webhook_deliveries d
         JOIN webhooks w ON w.id = d.webhook_id
         ORDER BY d.delivered_at DESC
         LIMIT 100`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/webhooks/test — manually fire an event for testing
router.post('/test', requireRole('admin', 'registrar'), async (req, res) => {
  try {
    const { event, payload } = req.body || {};
    if (!event) return res.status(400).json({ error: 'event required' });
    await fireWebhook(event, payload || { test: true });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
