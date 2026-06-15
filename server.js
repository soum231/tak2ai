const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const pagesRouter = require('./routes/pages');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');

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

// Session
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname) }),
  secret: process.env.SESSION_SECRET || 'tak2ai-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
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

app.listen(PORT, () => {
  console.log(`Tak2ai Node server running on http://localhost:${PORT}`);
});
