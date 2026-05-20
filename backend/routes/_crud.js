// Generic CRUD route factory with RBAC.
// Builds an Express router that exposes:
//   GET    /         — all rows (admin | registrar | auditor)
//   GET    /:id      — one row
//   POST   /         — create   (admin | registrar)
//   PUT    /:id      — update   (admin | registrar)
//   DELETE /:id      — delete   (admin)
//
// Each row carries id (PK), entityKey... columns + updated_at.

const express = require('express');
const pool = require('../config/database');
const { requireRole } = require('../middleware/rbac');

function buildRouter({ table, entityKey, columns, orderBy }) {
  const router = express.Router();
  const cols = columns;
  const colList = cols.join(', ');
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
  const setClause = cols.map((c, i) => `${c}=$${i + 1}`).join(', ');

  router.get('/', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
    try {
      const sql = `SELECT * FROM ${table} ORDER BY ${orderBy || 'id'} DESC`;
      const r = await pool.query(sql);
      res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.get('/:id', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
    try {
      const r = await pool.query(`SELECT * FROM ${table} WHERE id=$1`, [req.params.id]);
      if (!r.rows.length) return res.status(404).json({ error: `${entityKey} not found` });
      res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/', requireRole('admin', 'registrar'), async (req, res) => {
    try {
      const values = cols.map((c) => req.body[c] === undefined ? null : req.body[c]);
      const sql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) RETURNING *`;
      const r = await pool.query(sql, values);
      res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.put('/:id', requireRole('admin', 'registrar'), async (req, res) => {
    try {
      const values = cols.map((c) => req.body[c] === undefined ? null : req.body[c]);
      const sql = `UPDATE ${table} SET ${setClause}, updated_at=NOW() WHERE id=$${cols.length + 1} RETURNING *`;
      const r = await pool.query(sql, [...values, req.params.id]);
      if (!r.rows.length) return res.status(404).json({ error: `${entityKey} not found` });
      res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.delete('/:id', requireRole('admin'), async (req, res) => {
    try {
      const r = await pool.query(`DELETE FROM ${table} WHERE id=$1 RETURNING *`, [req.params.id]);
      if (!r.rows.length) return res.status(404).json({ error: `${entityKey} not found` });
      res.json({ message: `${entityKey} deleted`, [entityKey]: r.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  return router;
}

module.exports = { buildRouter };
