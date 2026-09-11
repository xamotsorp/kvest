const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireSiteAccess } = require('../middleware/auth');

router.use('/plays', requireSiteAccess);

router.post('/plays', async (req, res) => {
  try {
    const result = await pool.query(
      'insert into plays default values returning id, started_at'
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.post('/plays/:id/stations/:key', async (req, res) => {
  const { id, key } = req.params;
  const payload = req.body || {};
  try {
    await pool.query(
      `insert into station_results (play_id, station_key, payload)
       values ($1, $2, $3)
       on conflict (play_id, station_key)
       do update set payload = excluded.payload, created_at = now()`,
      [id, key, payload]
    );

    if (key === 'summary') {
      await pool.query('update plays set finished_at = now() where id = $1', [id]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/plays/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const playResult = await pool.query('select * from plays where id = $1', [id]);
    if (playResult.rows.length === 0) {
      return res.status(404).json({ error: 'not_found' });
    }
    const stationsResult = await pool.query(
      'select station_key, payload, created_at from station_results where play_id = $1 order by created_at asc',
      [id]
    );
    res.json({ play: playResult.rows[0], stations: stationsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
