const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { requireRole } = require('../middleware/rbac');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const stamp = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    cb(null, `${stamp}-${safe}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/attachments?entity_type=&entity_id=
router.get('/', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const { entity_type, entity_id } = req.query;
    let r;
    if (entity_type && entity_id) {
      r = await pool.query(
        'SELECT * FROM attachments WHERE entity_type=$1 AND entity_id=$2 ORDER BY created_at DESC',
        [entity_type, entity_id]
      );
    } else {
      r = await pool.query('SELECT * FROM attachments ORDER BY created_at DESC LIMIT 200');
    }
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/attachments — multipart/form-data with entity_type, entity_id, file
router.post('/', requireRole('admin', 'registrar'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required (form field "file")' });
    const { entity_type, entity_id } = req.body;
    const r = await pool.query(
      `INSERT INTO attachments (entity_type, entity_id, filename, original_name, mime_type, size_bytes, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        entity_type || 'misc',
        entity_id || null,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        (req.user && req.user.email) || null,
      ]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/attachments/:id/download
router.get('/:id/download', requireRole('admin', 'registrar', 'auditor'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM attachments WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    const f = r.rows[0];
    const p = path.join(UPLOAD_DIR, f.filename);
    if (!fs.existsSync(p)) return res.status(410).json({ error: 'file missing on disk' });
    res.download(p, f.original_name || f.filename);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM attachments WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    try { fs.unlinkSync(path.join(UPLOAD_DIR, r.rows[0].filename)); } catch (_) {}
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
