const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const COOKIE_OPTS = {
  httpOnly: true,
  signed: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === '1',
  maxAge: 1000 * 60 * 60 * 12 // 12 hours
};

router.post('/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (typeof password === 'string' && password === process.env.ADMIN_PASSWORD) {
    res.cookie('admin_session', '1', COOKIE_OPTS);
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'wrong_password' });
});

router.get('/admin/check', (req, res) => {
  const ok = req.signedCookies && req.signedCookies.admin_session === '1';
  res.json({ ok: !!ok });
});

router.get('/admin/plays', requireAdmin, async (req, res) => {
  try {
    const playsResult = await pool.query('select * from plays order by started_at desc');
    const stationsResult = await pool.query('select * from station_results order by created_at asc');

    const stationsByPlay = {};
    for (const row of stationsResult.rows) {
      if (!stationsByPlay[row.play_id]) stationsByPlay[row.play_id] = [];
      stationsByPlay[row.play_id].push(row);
    }

    const plays = playsResult.rows.map((play) => ({
      ...play,
      stations: stationsByPlay[play.id] || []
    }));

    res.json({ plays });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
