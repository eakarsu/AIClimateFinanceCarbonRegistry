const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { notify } = require('../services/notifications');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audits ORDER BY completed_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audits WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { audit_id, project, verifier, finding, report_url, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO audits (audit_id, project, verifier, finding, report_url, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [audit_id, project, verifier, finding, report_url || '', notes || '']
    );
    if (finding === 'major-finding' || finding === 'non-conformance') {
      notify('audit-finding', `Audit finding (${finding}) on ${project}`, notes || '').catch(() => {});
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { audit_id, project, verifier, finding, report_url, notes } = req.body;
    const result = await pool.query(
      `UPDATE audits SET audit_id=$1, project=$2, verifier=$3, finding=$4, report_url=$5,
         notes=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [audit_id, project, verifier, finding, report_url, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM audits WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit not found' });
    res.json({ message: 'Audit deleted', audit: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
