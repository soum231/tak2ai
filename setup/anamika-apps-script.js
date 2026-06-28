/**
 * Anamika Makeover Salon — Call Reports Dashboard
 * Google Apps Script Backend
 *
 * 1. Open your Google Sheet
 * 2. Extensions → Apps Script
 * 3. Paste this code
 * 4. Deploy → New deployment → Web App
 * 5. Execute as: Me | Who has access: Anyone
 * 6. Copy the web app URL
 */

// ═══════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════
const CONFIG = {
  SHEET_ID: '1-yPyZbO_oMcmjVf_HjP3e9WBD0Ff44fc5Da-IJvdvRQ',
  DATA_SHEET: '',
  LOGIN_SHEET: 'Login',
  CREDITS_SHEET: 'Credits',
};

const EXCLUDED_SHEETS = ['Credits', 'Login'];

// ═══════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════
function doGet(e) {
  const action = e?.parameter?.action || 'fetch';

  if (action === 'login') return handleLogin(e);
  if (action === 'getSheets') return getSheetNames();

  const sheetName = e?.parameter?.sheet || CONFIG.DATA_SHEET;
  return fetchData(sheetName);
}

// ═══════════════════════════════════════════════
// FETCH DATA
// ═══════════════════════════════════════════════
function fetchData(sheetName) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = sheetName
      ? ss.getSheetByName(sheetName)
      : ss.getSheets()[0];

    if (!sheet) {
      return jsonError('Sheet not found: ' + sheetName);
    }

    const [headers, ...rows] = sheet.getDataRange().getValues();

    const cleanHeaders = headers.map(h =>
      h.toString().trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    );

    const data = rows.map(row => {
      const obj = {};
      cleanHeaders.forEach((h, i) => {
        obj[h] = String(row[i] ?? '').trim();
      });
      return obj;
    });

    const totalUsedMinutes = getTotalUsedMinutes(ss);
    const credits = getCredits(totalUsedMinutes);

    return jsonOutput({ calls: data, credits: credits });
  } catch (err) {
    return jsonError('Server error: ' + err.message);
  }
}

// ═══════════════════════════════════════════════
// SUM used minutes across all data sheets
// ═══════════════════════════════════════════════
function getTotalUsedMinutes(ss) {
  let total = 0;
  const allSheets = ss.getSheets();

  for (const s of allSheets) {
    const name = s.getName();
    if (EXCLUDED_SHEETS.includes(name)) continue;

    const range = s.getDataRange();
    if (range.getNumRows() < 2) continue;

    const vals = range.getValues();
    const hdrs = vals[0].map(h => h.toString().trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_'));

    const statusIdx = hdrs.indexOf('call_status');
    const minsIdx = hdrs.indexOf('call_duration_in_minutes');
    const secsIdx = hdrs.indexOf('call_duration_in_seconds');

    if (statusIdx === -1) continue;

    for (let r = 1; r < vals.length; r++) {
      const status = String(vals[r][statusIdx] ?? '').trim();
      if (status === 'completed') {
        if (minsIdx > -1) {
          total += parseFloat(String(vals[r][minsIdx] ?? '0').replace(/[^0-9.]/g, '')) || 0;
        } else if (secsIdx > -1) {
          total += (parseFloat(String(vals[r][secsIdx] ?? '0').replace(/[^0-9.]/g, '')) || 0) / 60;
        }
      }
    }
  }

  return Math.round(total);
}

// ═══════════════════════════════════════════════
// READ CREDITS
// ═══════════════════════════════════════════════
function getCredits(usedMinutes) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const allSheets = ss.getSheets();
    let sheet = null;
    for (const s of allSheets) {
      if (s.getName().toLowerCase() === CONFIG.CREDITS_SHEET.toLowerCase()) {
        sheet = s;
        break;
      }
    }
    if (!sheet) return null;

    const vals = sheet.getDataRange().getValues();
    if (vals.length < 2) return null;

    let totalMinutes = 0;
    const firstRow = vals[0].map(h => h.toString().trim().toLowerCase().replace(/\s+/g, '_'));

    const possibleHeaders = ['total_minutes', 'total minutes', 'totalmins', 'total_mins', 'minutes', 'credit', 'credits', 'balance', 'allocated'];
    let colIdx = -1;
    for (const ph of possibleHeaders) {
      const idx = firstRow.indexOf(ph);
      if (idx > -1) { colIdx = idx; break; }
    }

    if (colIdx > -1 && vals[1][colIdx]) {
      totalMinutes = parseFloat(String(vals[1][colIdx]).replace(/[^0-9.]/g, '')) || 0;
    }

    if (!totalMinutes) {
      for (let c = 0; c < vals[1].length; c++) {
        const v = parseFloat(String(vals[1][c]).replace(/[^0-9.]/g, ''));
        if (v > 0) { totalMinutes = v; break; }
      }
    }

    if (!totalMinutes) {
      for (let r = 1; r < vals.length && !totalMinutes; r++) {
        for (let c = 0; c < vals[r].length; c++) {
          const v = parseFloat(String(vals[r][c]).replace(/[^0-9.]/g, ''));
          if (v > 0) { totalMinutes = v; break; }
        }
      }
    }

    if (!totalMinutes) return null;

    const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);
    const usagePercent = totalMinutes > 0 ? Math.round((usedMinutes / totalMinutes) * 100) : 0;

    return {
      totalMinutes: totalMinutes,
      usedMinutes: usedMinutes,
      remainingMinutes: remainingMinutes,
      usagePercent: usagePercent
    };
  } catch (e) {
    return null;
  }
}

// ═══════════════════════════════════════════════
// HANDLE LOGIN
// ═══════════════════════════════════════════════
function handleLogin(e) {
  const user = (e?.parameter?.username || '').trim();
  const pass = (e?.parameter?.password || '').trim();

  if (!user || !pass) {
    return jsonOutput({ success: false, error: 'Username and password required' });
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.LOGIN_SHEET);

    if (sheet) {
      const loginData = sheet.getDataRange().getValues();
      if (loginData.length > 1) {
        const loginHeaders = loginData[0].map(h => h.toString().trim().toLowerCase());
        const userCol = loginHeaders.indexOf('username');
        const passCol = loginHeaders.indexOf('password');

        if (userCol > -1 && passCol > -1) {
          for (let i = 1; i < loginData.length; i++) {
            const sheetUser = String(loginData[i][userCol] ?? '').trim();
            const sheetPass = String(loginData[i][passCol] ?? '').trim();
            if (sheetUser === user && sheetPass === pass) {
              return jsonOutput({ success: true });
            }
          }
        }
      }
    }
  } catch (e) {}

  // Hardcoded fallback
  const VALID_USERS = {
    admin: 'anamika123',
    manager: 'anamika@2026',
  };

  if (VALID_USERS[user] && VALID_USERS[user] === pass) {
    return jsonOutput({ success: true });
  }

  return jsonOutput({ success: false, error: 'Invalid username or password' });
}

// ═══════════════════════════════════════════════
// SHEET NAMES
// ═══════════════════════════════════════════════
function getSheetNames() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheets = ss.getSheets();
    const names = sheets.map(s => s.getName());
    return jsonOutput({ sheets: names });
  } catch (err) {
    return jsonError(err.message);
  }
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════
function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
