const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { fireWebhook } = require('../services/webhooks');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM issuances ORDER BY issued_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM issuances WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Issuance not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { issuance_id, project, vintage_year, tons_issued, methodology, issued_by, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO issuances (issuance_id, project, vintage_year, tons_issued, methodology, issued_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [issuance_id, project, vintage_year, tons_issued, methodology, issued_by, notes || '']
    );
    fireWebhook('issuance', result.rows[0]).catch(() => {});
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { issuance_id, project, vintage_year, tons_issued, methodology, issued_by, notes } = req.body;
    const result = await pool.query(
      `UPDATE issuances SET issuance_id=$1, project=$2, vintage_year=$3, tons_issued=$4,
         methodology=$5, issued_by=$6, notes=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [issuance_id, project, vintage_year, tons_issued, methodology, issued_by, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Issuance not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM issuances WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Issuance not found' });
    res.json({ message: 'Issuance deleted', issuance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
