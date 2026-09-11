const express = require('express');
const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  signed: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === '1',
  maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
};

router.post('/pin', (req, res) => {
  const { pin } = req.body || {};
  if (typeof pin === 'string' && pin === process.env.PIN) {
    res.cookie('site_access', '1', COOKIE_OPTS);
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'wrong_pin' });
});

router.get('/pin/check', (req, res) => {
  const ok = req.signedCookies && req.signedCookies.site_access === '1';
  res.json({ ok: !!ok });
});

module.exports = router;
