// Article 6.2 / 6.4 corresponding-adjustment & vintage tracker
// (Pass 7 — NEEDS-PRODUCT-DECISION shipped as first-class CRUD).
//
// Tracks ITMOs (Internationally Transferred Mitigation Outcomes) and their
// authorization / cancellation / corresponding-adjustment status under the
// Paris Agreement Article 6.

const express = require('express');
const pool = require('../config/database');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

const COLS = [
  'adjustment_id', 'host_country', 'acquiring_country', 'project',
  'vintage_year', 'tons_co2e', 'article', 'authorization_status',
  'corresponding_adjustment_applied', 'first_transfer_at', 'cancelled_at', 'notes',
];

router.get('/', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM corresponding_adjustments ORDER BY first_transfer_at DESC NULLS LAST, id DESC`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM corresponding_adjustments WHERE id=$1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'adjustment_not_found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireRole('admin', 'registrar'), async (req, res) => {
  try {
    const values = COLS.map((c) => req.body[c] === undefined ? null : req.body[c]);
    const placeholders = COLS.map((_, i) => `$${i + 1}`).join(',');
    const r = await pool.query(
      `INSERT INTO corresponding_adjustments (${COLS.join(',')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', requireRole('admin', 'registrar'), async (req, res) => {
  try {
    const values = COLS.map((c) => req.body[c] === undefined ? null : req.body[c]);
    const setClause = COLS.map((c, i) => `${c}=$${i + 1}`).join(', ');
    const r = await pool.query(
      `UPDATE corresponding_adjustments SET ${setClause}, updated_at=NOW() WHERE id=$${COLS.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'adjustment_not_found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query(`DELETE FROM corresponding_adjustments WHERE id=$1 RETURNING *`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'adjustment_not_found' });
    res.json({ message: 'adjustment_deleted', adjustment: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Summary by host country
router.get('/summary/by-country', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT host_country,
              COUNT(*)::int AS adjustments,
              COALESCE(SUM(tons_co2e), 0) AS total_tco2e,
              SUM(CASE WHEN corresponding_adjustment_applied THEN 1 ELSE 0 END)::int AS applied_count
         FROM corresponding_adjustments
         GROUP BY host_country
         ORDER BY total_tco2e DESC`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
