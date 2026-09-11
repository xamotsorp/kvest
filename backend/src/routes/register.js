const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const { pool } = require('../db');
const { requireSiteAccess } = require('../middleware/auth');

const MEDIA_DIR = path.join(__dirname, '..', '..', 'media');
const UPLOADS_DIR = path.join(MEDIA_DIR, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) return cb(null, true);
    cb(new Error('unsupported_file_type'));
  }
});

router.use('/register', requireSiteAccess);

router.post('/register', upload.single('photo'), async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim().slice(0, 60);
    if (!name) return res.status(400).json({ error: 'name_required' });
    if (!req.file) return res.status(400).json({ error: 'photo_required' });

    const ext = EXT_BY_MIME[req.file.mimetype];
    const result = await pool.query(
      'insert into plays (name) values ($1) returning id, name, started_at',
      [name]
    );
    const play = result.rows[0];

    const fileName = `${play.id}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, fileName), req.file.buffer);
    const photoUrl = `/media/uploads/${fileName}`;

    await pool.query('update plays set photo_path = $1 where id = $2', [photoUrl, play.id]);

    res.json({ id: play.id, name: play.name, photoUrl });
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  if (err.message === 'unsupported_file_type') {
    return res.status(400).json({ error: 'unsupported_file_type' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'file_too_large' });
  }
  console.error(err);
  res.status(500).json({ error: 'server_error' });
});

module.exports = router;
