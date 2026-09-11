require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');

const pinRoutes = require('./routes/pin');
const playsRoutes = require('./routes/plays');
const adminRoutes = require('./routes/admin');
const registerRoutes = require('./routes/register');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET is not set — cookies will not be secure. Set it in .env');
}

app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET || 'dev-secret'));

app.use('/', pinRoutes);
app.use('/', playsRoutes);
app.use('/', adminRoutes);
app.use('/', registerRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`stancii-backend listening on :${PORT}`);
});
