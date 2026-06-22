const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const { count: chatSessions, error: chatError } = await supabaseAdmin
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: userSessions } = await supabaseAdmin
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId);

    let totalMessages = 0;
    if (userSessions && userSessions.length > 0) {
      const ids = userSessions.map(s => s.id);
      const { count, error: msgError } = await supabaseAdmin
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('session_id', ids);
      totalMessages = count || 0;
    }

    const { data: recentSessions, error: recentError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (chatError || recentError) {
      return res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
    }

    res.json({
      success: true,
      data: {
        chat_sessions: chatSessions || 0,
        total_messages: totalMessages,
        recent_sessions: recentSessions || []
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/dashboard/balance', requireAuth, async (req, res) => {
  try {
    const { getRemainingBalance } = require('../services/recharges');
    const balance = await getRemainingBalance(req.session.userId, supabaseAdmin);
    res.json({ success: true, data: balance });
  } catch (err) {
    console.error('Balance error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/leads', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: leads, error, count } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch leads' });
    }

    res.json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('Get leads error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/leads', async (req, res) => {
  try {
    const { name, email, phone, category, message } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Name, email, and phone are required' });
    }

    const { data, error } = await supabaseAdmin.from('leads').insert([{
      name,
      email,
      phone,
      category: category || null,
      message: message || null,
      status: 'new',
      created_at: new Date().toISOString()
    }]).select().single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to submit lead' });
    }

    console.log('[Lead] New submission:', { name, email, phone, category, message });
    fs.appendFileSync('leads.log', JSON.stringify({ name, email, phone, category, message, time: new Date().toISOString() }) + '\n');

    const { sendLeadNotification } = require('../services/mail');
    sendLeadNotification({ name, email, phone, category, message });

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('Create lead error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.patch('/leads/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }
      return res.status(500).json({ success: false, error: 'Failed to update lead' });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.delete('/leads/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to delete lead' });
    }

    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    console.error('Delete lead error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/chat/sessions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const { data: sessions, error } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
    }

    res.json({ success: true, data: sessions || [] });
  } catch (err) {
    console.error('Get chat sessions error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/chat/sessions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { title } = req.body;

    const { data, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert([{
        user_id: userId,
        title: title || 'New Chat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to create session' });
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('Create chat session error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.delete('/chat/sessions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await supabaseAdmin.from('chat_messages').delete().eq('session_id', id);
    await supabaseAdmin.from('chat_sessions').delete().eq('id', id);

    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    console.error('Delete session error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/chat/sessions/:id/messages', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }

    res.json({ success: true, data: messages || [] });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/chat/message', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { session_id, role, content } = req.body;

    if (!session_id || !role || !content) {
      return res.status(400).json({ success: false, error: 'Session ID, role, and content are required' });
    }

    const validRoles = ['user', 'assistant', 'system'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('user_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert([{
        session_id,
        role,
        content,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to save message' });
    }

    await supabaseAdmin
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session_id);

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('Save message error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== AI CHAT (OpenRouter) =====

router.post('/chat/ai', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { session_id, message } = req.body;

    if (!session_id || !message) {
      return res.status(400).json({ success: false, error: 'Session ID and message are required' });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('user_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { error: saveErr } = await supabaseAdmin
      .from('chat_messages')
      .insert([{ session_id, role: 'user', content: message, created_at: new Date().toISOString() }]);

    if (saveErr) {
      return res.status(500).json({ success: false, error: 'Failed to save message' });
    }

    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      return res.json({ success: true, data: { role: 'assistant', content: 'AI is not configured yet. Please set your OpenRouter API key in the .env file and restart the server.' } });
    }

    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const chatMessages = [
      { role: 'system', content: 'You are a sharp, direct AI assistant. Follow these rules strictly:\n1. Give clear, concise answers — get straight to the point, no fluff\n2. If the user asks a question, answer it directly in the first sentence\n3. Use bullet points or short paragraphs for readability\n4. If asked for code, provide working code examples\n5. If you don\'t know something, say so honestly\n6. Keep responses under 200 words unless the topic demands depth\n7. Use markdown formatting (bold, code blocks, lists) for clarity\n8. Current time in India: ' + now },
      ...(history || []).map(m => ({ role: m.role, content: m.content }))
    ];

    const models = [
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'nvidia/nemotron-nano-9b-v2:free',
      'liquid/lfm-2.5-1.2b-instruct:free'
    ];

    let aiContent = null;

    for (let i = 0; i < models.length; i++) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
            'X-Title': 'Tak2ai Chat'
          },
          body: JSON.stringify({ model: models[i], messages: chatMessages, max_tokens: 500 }),
          signal: AbortSignal.timeout(15000)
        });

        if (response.ok) {
          const result = await response.json();
          aiContent = result.choices?.[0]?.message?.content;
          if (aiContent) break;
        }

        const errText = await response.text();
        console.error(`OpenRouter ${models[i]} failed:`, response.status, errText);
      } catch (e) {
        console.error(`OpenRouter ${models[i]} error:`, e.message);
      }
    }

    if (!aiContent) {
      aiContent = "I'm currently experiencing high demand and all AI models are temporarily rate-limited. Please wait a moment and try again. If this persists, check your OpenRouter API key or try a different model.";
    }

    const { data: aiMsg } = await supabaseAdmin
      .from('chat_messages')
      .insert([{ session_id, role: 'assistant', content: aiContent, created_at: new Date().toISOString() }])
      .select()
      .single();

    const { data: sess } = await supabaseAdmin
      .from('chat_sessions')
      .select('title')
      .eq('id', session_id)
      .single();

    if (sess && (sess.title === 'New Chat' || !sess.title)) {
      const title = message.length > 50 ? message.substring(0, 47) + '...' : message;
      await supabaseAdmin
        .from('chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', session_id);
    } else {
      await supabaseAdmin
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', session_id);
    }

    res.json({ success: true, data: aiMsg || { role: 'assistant', content: aiContent } });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// ===== OMNIDIM WEBHOOK =====
// Receives agent call reports from Omnidim's Custom API
router.post('/webhooks/omnidim', async (req, res) => {
  try {
    const token = req.query.token || req.headers['x-webhook-token'];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing webhook token' });
    }

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('webhook_tokens')
      .select('user_id')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return res.status(401).json({ success: false, error: 'Invalid webhook token' });
    }

    const userId = tokenData.user_id;
    const payload = req.body;

    const rawDuration = payload.duration_seconds ?? payload.durationSeconds ?? payload.duration ?? payload.call_duration ?? payload.call_duration_in_seconds ?? null;
    const rawDurationMin = payload.call_duration_in_minutes ?? null;
    let finalDuration = null;
    if (rawDuration != null) {
      if (typeof rawDuration === 'number' && !isNaN(rawDuration)) {
        finalDuration = rawDuration;
      } else if (typeof rawDuration === 'string') {
        const tm = rawDuration.match(/(\d+)\s*m(?:in)?[\s,]*(\d+)\s*s(?:ec)?/i);
        if (tm) {
          finalDuration = parseInt(tm[1]) * 60 + parseInt(tm[2]);
        } else {
          const tc = rawDuration.match(/^(\d+):(\d{1,2})$/);
          if (tc) {
            finalDuration = parseInt(tc[1]) * 60 + parseInt(tc[2]);
          } else {
            const tn = parseFloat(rawDuration);
            if (!isNaN(tn)) finalDuration = tn;
          }
        }
      }
    }
    if (finalDuration == null && rawDurationMin != null) {
      const tn = parseFloat(rawDurationMin);
      if (!isNaN(tn)) finalDuration = Math.round(tn * 60);
    }

    const report = {
      user_id: userId,
      agent_id: payload.agent_id || payload.agentId || null,
      agent_name: payload.agent_name || payload.agentName || null,
      caller_number: payload.caller_number || payload.callerNumber || payload.from || null,
      callee_number: payload.callee_number || payload.calleeNumber || payload.to || null,
      duration_seconds: finalDuration,
      status: payload.status || payload.call_status || payload.callStatus || 'unknown',
      transcript: payload.transcript || null,
      recording_url: payload.recording_url || payload.recordingUrl || null,
      summary: payload.summary || null,
      raw_payload: payload,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('omnidim_reports')
      .insert([report])
      .select()
      .single();

    if (error) {
      console.error('Omnidim webhook insert error:', error);
      return res.status(500).json({ success: false, error: 'Failed to store report' });
    }

    res.status(201).json({ success: true, data: { id: data.id } });
  } catch (err) {
    console.error('Omnidim webhook error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== VOICE DASHBOARD =====

// Get or create the user's webhook token
router.get('/voice/webhook-token', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const { data: existing } = await supabaseAdmin
      .from('webhook_tokens')
      .select('token')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.json({ success: true, data: { token: existing.token } });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const { data, error } = await supabaseAdmin
      .from('webhook_tokens')
      .insert([{ user_id: userId, token }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to create webhook token' });
    }

    res.status(201).json({ success: true, data: { token: data.token } });
  } catch (err) {
    console.error('Webhook token error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Fetch the user's Omnidim reports with filtering
router.get('/voice/reports', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status || '';
    const search = req.query.search || '';
    const fromDate = req.query.from || '';
    const toDate = req.query.to || '';

    let query = supabaseAdmin
      .from('omnidim_reports')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }
    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      query = query.lte('created_at', toDate);
    }
    if (search) {
      query = query.or('caller_number.ilike.%' + search + '%,agent_name.ilike.%' + search + '%');
    }

    const { data: reports, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch reports' });
    }

    res.json({
      success: true,
      data: reports || [],
      pagination: {
        limit,
        offset,
        total: count
      }
    });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Fetch report stats
router.get('/voice/reports/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const fromDate = req.query.from || '';
    const toDate = req.query.to || '';

    let query = supabaseAdmin
      .from('omnidim_reports')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (fromDate) query = query.gte('created_at', fromDate);
    if (toDate) query = query.lte('created_at', toDate);

    const { data: reports, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }

    var total = reports ? reports.length : 0;
    var completed = 0;
    var noAnswer = 0;
    var failed = 0;
    var busy = 0;
    var unknown = 0;
    var totalDur = 0;
    var sentiments = { positive: 0, neutral: 0, negative: 0 };

    (reports || []).forEach(function (r) {
      var s = (r.status || '').toLowerCase();
      if (s === 'completed' || s === 'answered') completed++;
      else if (s === 'no-answer' || s === 'no_answer') noAnswer++;
      else if (s === 'failed') failed++;
      else if (s === 'busy') busy++;
      else unknown++;
      totalDur += r.duration_seconds || 0;
      var sentiment = (r.raw_payload && (r.raw_payload.sentiment || r.raw_payload.Sentiment)) || '';
      if (sentiment) {
        var sl = sentiment.toLowerCase();
        if (sl === 'positive' || sl === '😊 positive') sentiments.positive++;
        else if (sl === 'neutral' || sl === '😐 neutral') sentiments.neutral++;
        else if (sl === 'negative' || sl === '😟 negative') sentiments.negative++;
      }
    });

    res.json({
      success: true,
      data: {
        total,
        completed,
        no_answer: noAnswer,
        failed,
        busy,
        unknown,
        total_duration_seconds: totalDur,
        avg_duration_seconds: total > 0 ? Math.round(totalDur / total) : 0,
        sentiments
      }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== CALL REPORTS (Google Sheet Webhook) =====

const CALL_REPORT_URL = 'https://script.google.com/macros/s/AKfycbyuz00fxXxbee2GuAzh24hkvFRWWbK-Rt0JbyGEz5zYxOPJJTKjotvHDoYAlZ1MG7KY/exec';
var callReportCache = null;
var callReportCacheTime = 0;

router.get('/call-reports', requireAuth, async (req, res) => {
  try {
    const fresh = req.query._t || '';
    if (!fresh && callReportCache && Date.now() - callReportCacheTime < 15000) {
      return res.json({ success: true, data: callReportCache });
    }

    const response = await fetch(CALL_REPORT_URL);
    if (!response.ok) {
      return res.status(502).json({ success: false, error: 'Failed to fetch call reports' });
    }

    const result = await response.json();
    callReportCache = result.calls || [];
    callReportCacheTime = Date.now();

    res.json({ success: true, data: callReportCache });
  } catch (err) {
    console.error('Call reports error:', err);
    if (callReportCache) {
      return res.json({ success: true, data: callReportCache });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== PROFILE =====

router.get('/profile', requireAuth, function (req, res) {
  res.json({ success: true, data: req.user });
});

router.post('/profile', requireAuth, async function (req, res) {
  try {
    var userId = req.session.userId;
    var name = (req.body.name || '').trim();
    var phone = (req.body.phone || '').trim();
    var company = (req.body.company || '').trim();
    if (!name) return res.json({ success: false, error: 'Name is required' });
    var { error } = await supabaseAdmin
      .from('profiles')
      .update({ name: name, phone: phone || null, company_name: company || null, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) return res.json({ success: false, error: error.message });
    res.json({ success: true });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/profile/upload-avatar', requireAuth, upload.single('logo'), async function (req, res) {
  try {
    var file = req.file;
    if (!file) return res.json({ success: false, error: 'No file uploaded' });
    var ext = path.extname(file.originalname) || '.png';
    var fileName = 'avatar_' + req.session.userId + '_' + Date.now() + ext;
    var { data, error } = await supabaseAdmin.storage.from('avatars').upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });
    if (error) return res.json({ success: false, error: error.message });
    var { data: urlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(fileName);
    var publicUrl = urlData.publicUrl;
    await supabaseAdmin.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', req.session.userId);
    res.json({ success: true, data: { url: publicUrl } });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== ADMIN SETUP =====

router.post('/setup/admin', async (req, res) => {
  try {
    const { key } = req.body;
    if (key !== process.env.SESSION_SECRET) {
      return res.status(403).json({ success: false, error: 'Invalid setup key' });
    }
    const { seedAdmin } = require('../setup/seed-admin');
    await seedAdmin();
    res.json({ success: true, message: 'Admin user seeded successfully' });
  } catch (err) {
    console.error('Admin setup error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== ADMIN RECHARGES =====

const { addRecharge, getUserRecharges, getAllRecharges, getAllUsersWithBalance } = require('../services/recharges');

router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const [profileResult, authResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, name, company_name, phone, created_at'),
      supabaseAdmin.auth.admin.listUsers()
    ]);

    if (profileResult.error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }

    const emailMap = {};
    if (authResult.data?.users) {
      for (const u of authResult.data.users) {
        emailMap[u.id] = u.email;
      }
    }

    const balances = getAllUsersWithBalance();
    const balanceMap = {};
    for (const b of balances) {
      balanceMap[b.user_id] = b;
    }

    const adminUserId = req.session.userId;
    const users = await Promise.all((profileResult.data || []).map(async (p) => {
      const { getRemainingBalance, getUsedAdjustment } = require('../services/recharges');
    const balance = await getRemainingBalance(p.id, supabaseAdmin);
    return {
      id: p.id,
      name: p.name,
      email: emailMap[p.id] || '',
      company: p.company_name,
      phone: p.phone,
      joined: p.created_at,
      is_admin: p.id === adminUserId,
      balance_minutes: balance.remaining_minutes,
      recharged_minutes: balance.recharged_minutes,
      used_minutes: balance.used_minutes,
      used_adjustment: getUsedAdjustment(p.id),
      total_recharged: balanceMap[p.id]?.total_amount || 0,
      recharge_count: balanceMap[p.id]?.recharge_count || 0,
      last_recharge: balanceMap[p.id]?.last_recharge || null
    };
    }));

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Get admin users error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/admin/recharges', requireAdmin, async (req, res) => {
  try {
    const userId = req.query.user_id || null;
    const data = userId ? getUserRecharges(userId) : getAllRecharges();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Get recharges error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/admin/recharges', requireAdmin, async (req, res) => {
  try {
    const { user_id, user_name, user_email, minutes, amount, notes } = req.body;

    if (!user_id || !minutes) {
      return res.status(400).json({ success: false, error: 'User ID and minutes are required' });
    }

    const entry = addRecharge({
      user_id,
      user_name: user_name || '',
      user_email: user_email || '',
      minutes: parseInt(minutes),
      amount: parseFloat(amount) || 0,
      notes: notes || '',
      created_by: req.session.userId || 'admin'
    });

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error('Add recharge error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/admin/users/adjustment', requireAdmin, async (req, res) => {
  try {
    const { user_id, minutes, user_name, notes } = req.body;
    if (!user_id || minutes === undefined || minutes === null) {
      return res.status(400).json({ success: false, error: 'User ID and minutes are required' });
    }
    const { setUsedAdjustment } = require('../services/recharges');
    setUsedAdjustment(user_id, parseFloat(minutes) || 0, { user_name: user_name || 'Unknown', notes, created_by: 'admin' });
    const { getRemainingBalance } = require('../services/recharges');
    const balance = await getRemainingBalance(user_id, supabaseAdmin);
    res.json({ success: true, data: { adjustment_minutes: parseFloat(minutes) || 0, ...balance } });
  } catch (err) {
    console.error('Set adjustment error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/admin/activities', requireAdmin, async (req, res) => {
  try {
    const userId = req.query.user_id || null;
    const { getUserActivities, getAllActivities } = require('../services/activity');
    const data = userId ? getUserActivities(userId) : getAllActivities();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ===== OTP Verification =====
const { sendOTP } = require('../services/whatsapp');
const otpStore = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const otp = generateOTP();
    const key = phone.replace(/[^0-9]/g, '');

    otpStore[key] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    const result = await sendOTP(phone, otp);

    if (!result.success) {
      console.error('[OTP Send] Failed:', result.error);
    }

    res.json({ success: true, simulated: !!result.simulated || !result.success, otp: result.otp || null });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: 'Phone and OTP are required' });
    }

    const key = phone.replace(/[^0-9]/g, '');
    const stored = otpStore[key];

    if (!stored) {
      return res.status(400).json({ success: false, error: 'No OTP sent to this number' });
    }

    if (Date.now() > stored.expires) {
      delete otpStore[key];
      return res.status(400).json({ success: false, error: 'OTP has expired' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    delete otpStore[key];
    res.json({ success: true });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
