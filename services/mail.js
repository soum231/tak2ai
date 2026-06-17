const https = require('https');
const fs = require('fs');

function sendLeadNotification({ name, email, phone, category, message }) {
  const data = JSON.stringify({
    _subject: 'New Tak2ai Lead — ' + name,
    Name: name,
    Email: email,
    Phone: phone,
    Category: category || 'Not specified',
    Message: message || 'None'
  });

  const logEntry = `[${new Date().toISOString()}] ${name} | ${email} | ${phone} | ${category || '-'} | ${message || '-'}\n`;
  fs.appendFileSync('leads.log', logEntry);

  const req = https.request({
    hostname: 'formsubmit.co',
    path: '/ajax/soummajumder231@gmail.com',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }, function (res) {
    let body = '';
    res.on('data', function (c) { body += c; });
    res.on('end', function () {
      console.log('[Mail] FormSubmit status:', res.statusCode, body);
    });
  });

  req.on('error', function (err) {
    console.error('[Mail] FormSubmit error:', err.message);
  });

  req.write(data);
  req.end();
}

module.exports = { sendLeadNotification };
