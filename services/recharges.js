const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'recharges.json');
const ADJ_FILE = path.join(DATA_DIR, 'used-adjustments.json');
const { logActivity } = require('./activity');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');
  if (!fs.existsSync(ADJ_FILE)) fs.writeFileSync(ADJ_FILE, '{}');
}

function readAdjustments() {
  ensureDir();
  try { return JSON.parse(fs.readFileSync(ADJ_FILE, 'utf8')); } catch { return {}; }
}

function writeAdjustments(data) {
  ensureDir();
  fs.writeFileSync(ADJ_FILE, JSON.stringify(data, null, 2));
}

function setUsedAdjustment(userId, minutes, { user_name, user_email, notes, created_by } = {}) {
  const adj = readAdjustments();
  const prev = adj[userId] || 0;
  adj[userId] = minutes;
  writeAdjustments(adj);
  const diff = parseFloat(minutes) - prev;
  logActivity({ type: 'adjustment', user_id: userId, user_name, user_email, minutes: parseFloat(minutes), notes: notes || (diff >= 0 ? `Added ${diff.toFixed(2)} used min` : `Reduced by ${Math.abs(diff).toFixed(2)} used min`), created_by });
}

function getUsedAdjustment(userId) {
  return readAdjustments()[userId] || 0;
}

function readAll() {
  ensureDir();
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeAll(data) {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function addRecharge({ user_id, user_name, user_email, minutes, amount, notes, created_by }) {
  const all = readAll();
  const minVal = parseInt(minutes) || 0;
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    user_id,
    user_name: user_name || 'Unknown',
    user_email: user_email || '',
    minutes: minVal,
    amount: parseFloat(amount) || 0,
    notes: notes || '',
    created_by: created_by || 'admin',
    created_at: new Date().toISOString()
  };
  all.push(entry);
  writeAll(all);
  logActivity({ type: minVal >= 0 ? 'recharge' : 'deduction', user_id, user_name, user_email, minutes: minVal, amount: parseFloat(amount) || 0, notes, created_by });
  return entry;
}

function getUserRecharges(userId) {
  return readAll().filter(r => r.user_id === userId);
}

function getAllRecharges() {
  return readAll().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getUserBalance(userId) {
  const recharges = getUserRecharges(userId);
  return recharges.reduce((sum, r) => sum + (r.minutes || 0), 0);
}

function getAllUsersWithBalance() {
  const all = readAll();
  const userMap = {};
  for (const r of all) {
    if (!userMap[r.user_id]) {
      userMap[r.user_id] = { user_id: r.user_id, user_name: r.user_name, user_email: r.user_email, total_minutes: 0, total_amount: 0, recharge_count: 0, last_recharge: null };
    }
    userMap[r.user_id].total_minutes += r.minutes || 0;
    userMap[r.user_id].total_amount += r.amount || 0;
    userMap[r.user_id].recharge_count += 1;
    if (!userMap[r.user_id].last_recharge || r.created_at > userMap[r.user_id].last_recharge) {
      userMap[r.user_id].last_recharge = r.created_at;
    }
  }
  return Object.values(userMap).sort((a, b) => new Date(b.last_recharge || 0) - new Date(a.last_recharge || 0));
}

async function getRemainingBalance(userId, supabaseAdmin) {
  const recharged = getUserBalance(userId);

  const { data: reports } = await supabaseAdmin
    .from('omnidim_reports')
    .select('duration_seconds')
    .eq('user_id', userId);

  const usedSeconds = (reports || []).reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
  const usedMinutes = Math.ceil(usedSeconds / 60);
  const adjustmentMinutes = getUsedAdjustment(userId);
  const totalUsed = usedMinutes + adjustmentMinutes;

  return {
    recharged_minutes: recharged,
    used_minutes: totalUsed,
    remaining_minutes: Math.round(Math.max(0, recharged - totalUsed))
  };
}

module.exports = { addRecharge, getUserRecharges, getAllRecharges, getUserBalance, getAllUsersWithBalance, getRemainingBalance, setUsedAdjustment, getUsedAdjustment };
