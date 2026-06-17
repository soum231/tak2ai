const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || null;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || null;
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

function sendOTP(phone, otp) {
  const message = `Your Tak2ai verification code is: ${otp}. Valid for 5 minutes.`;

  if (WHATSAPP_API_TOKEN && WHATSAPP_PHONE_ID) {
    return fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone.replace(/[^0-9]/g, ''),
        type: 'text',
        text: { body: message }
      })
    }).then(r => r.json()).then(data => {
      if (data.error) {
        console.error('[WhatsApp OTP] API returned error:', data.error);
        return { success: false, error: data.error.message || 'API error', otp };
      }
      console.log('[WhatsApp OTP] Sent via API to', phone);
      return { success: true, otp };
    }).catch(err => {
      console.error('[WhatsApp OTP] API error:', err);
      return { success: false, error: err.message, otp };
    });
  }

  console.log(`[WhatsApp OTP] SIMULATED — OTP for ${phone}: ${otp}`);
  return Promise.resolve({ success: true, simulated: true, otp });
}

module.exports = { sendOTP };
