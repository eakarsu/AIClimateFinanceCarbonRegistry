const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM methodologies ORDER BY approved_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM methodologies WHERE id=$1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Methodology not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { methodology_id, name, type, scope, version, approved_by, approved_at } = req.body;
    const result = await pool.query(
      `INSERT INTO methodologies (methodology_id, name, type, scope, version, approved_by, approved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [methodology_id, name, type, scope, version, approved_by, approved_at || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { methodology_id, name, type, scope, version, approved_by, approved_at } = req.body;
    const result = await pool.query(
      `UPDATE methodologies SET methodology_id=$1, name=$2, type=$3, scope=$4, version=$5,
         approved_by=$6, approved_at=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [methodology_id, name, type, scope, version, approved_by, approved_at, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Methodology not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM methodologies WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Methodology not found' });
    res.json({ message: 'Methodology deleted', methodology: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
