const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');

const pagesRouter = require('./routes/pages');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
const { seedAdmin } = require('./setup/seed-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// CORS — allow cross-origin requests (needed by Omnidim webhook)
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Cookie-based session (works on Vercel serverless)
app.use(cookieSession({
  name: 'tak2ai_session',
  secret: process.env.SESSION_SECRET || 'tak2ai-secret',
  httpOnly: true,
  sameSite: 'lax'
}));

// Routes
app.use('/', pagesRouter);
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// Session debug endpoint
app.get('/__session', (req, res) => {
  res.json({
    hasSession: !!req.session,
    hasUserId: !!req.session?.userId,
    userId: req.session?.userId || null
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('ERROR:', err.message);
  console.error(err.stack);
  res.status(500).send('Something broke! ' + err.message);
});

// Seed admin user on startup
if (require.main === module) {
  seedAdmin();
}

// Only listen when run directly (not as Vercel serverless function)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Tak2ai Node server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
