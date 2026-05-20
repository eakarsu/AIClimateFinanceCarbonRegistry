const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM holders ORDER BY registered_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM holders WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Holder not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { holder_id, name, type, country, kyc_status, email } = req.body;
    const result = await pool.query(
      `INSERT INTO holders (holder_id, name, type, country, kyc_status, email)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [holder_id, name, type, country, kyc_status || 'pending', email || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { holder_id, name, type, country, kyc_status, email } = req.body;
    const result = await pool.query(
      `UPDATE holders SET holder_id=$1, name=$2, type=$3, country=$4, kyc_status=$5, email=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [holder_id, name, type, country, kyc_status, email, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Holder not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM holders WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Holder not found' });
    res.json({ message: 'Holder deleted', holder: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
