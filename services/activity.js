const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'activities.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');
}

function readAll() {
  ensureDir();
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; }
}

function writeAll(data) {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function logActivity({ type, user_id, user_name, user_email, minutes, amount, notes, created_by, created_at }) {
  const all = readAll();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: type || 'recharge',
    user_id,
    user_name: user_name || 'Unknown',
    user_email: user_email || '',
    minutes: parseFloat(minutes) || 0,
    amount: parseFloat(amount) || 0,
    notes: notes || '',
    created_by: created_by || 'admin',
    created_at: created_at || new Date().toISOString()
  };
  all.push(entry);
  writeAll(all);
  return entry;
}

function getUserActivities(userId) {
  return readAll()
    .filter(a => a.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getAllActivities() {
  return readAll().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

module.exports = { logActivity, getUserActivities, getAllActivities };
