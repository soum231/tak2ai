(function() {
  'use strict';

  var CONFIG = {
    SUPABASE_URL: 'https://nxxyxgsebtfuotrcothb.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54eHl4Z3NlYnRmdW90cmNvdGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMTgyNDgsImV4cCI6MjA5Njg5NDI0OH0.qwI6FU2rXxoV19gZf7fvjoCwQ86UMTkUqspRveDyIUQ',
    API_BASE: 'https://tak2ai.vercel.app'
  };

  var supabaseClient = null;

  function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      });
    }
  }

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }
  function hideError(el) { if (el) el.style.display = 'none'; }

  function setLoading(btn, loading) {
    if (!btn) return;
    var text = btn.querySelector('.btn-text');
    var loader = btn.querySelector('.btn-loader');
    if (loading) { if (text) text.style.display = 'none'; if (loader) loader.style.display = 'inline-flex'; btn.disabled = true; }
    else { if (text) text.style.display = 'inline'; if (loader) loader.style.display = 'none'; btn.disabled = false; }
  }

  // ===== AUTH =====
  var Auth = {
    currentUser: null,
    accessToken: null,

    init: function() {
      var self = this;
      return new Promise(function(resolve) {
        if (!supabaseClient) { resolve(false); return; }
        supabaseClient.auth.getSession().then(function(result) {
          if (result.data.session) {
            self.currentUser = result.data.session.user;
            self.accessToken = result.data.session.access_token;
            resolve(true);
          } else {
            resolve(false);
          }
        }).catch(function() { resolve(false); });
      });
    },

    signIn: function(email, password) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!supabaseClient) { reject(new Error('Supabase not initialized')); return; }
        supabaseClient.auth.signInWithPassword({ email: email, password: password })
          .then(function(result) {
            if (result.error) { reject(result.error); return; }
            self.currentUser = result.data.user;
            self.accessToken = result.data.session.access_token;
            resolve({ user: result.data.user, token: result.data.session.access_token });
          })
          .catch(reject);
      });
    },

    signUp: function(data) {
      return new Promise(function(resolve, reject) {
        fetch(CONFIG.API_BASE + '/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(function(r) { return r.json(); })
          .then(function(result) { if (result.success) resolve(result); else reject(new Error(result.error || 'Registration failed')); })
          .catch(reject);
      });
    },

    sendMagicLink: function(email) {
      return new Promise(function(resolve, reject) {
        if (!supabaseClient) { reject(new Error('Supabase not initialized')); return; }
        supabaseClient.auth.signInWithOtp({ email: email })
          .then(function(result) { if (result.error) reject(result.error); else resolve(result); })
          .catch(reject);
      });
    },

    signOut: function() {
      var self = this;
      if (supabaseClient) {
        supabaseClient.auth.signOut().then(function() {
          self.currentUser = null;
          self.accessToken = null;
          showScreen('login');
        });
      } else {
        self.currentUser = null;
        self.accessToken = null;
        showScreen('login');
      }
    },

    apiFetch: function(path, options) {
      var self = this;
      var opts = options || {};
      var headers = opts.headers || {};
      if (self.accessToken) {
        headers['Authorization'] = 'Bearer ' + self.accessToken;
      }
      if (!headers['Content-Type'] && opts.method && opts.method !== 'GET') {
        headers['Content-Type'] = 'application/json';
      }
      opts.headers = headers;
      return fetch(CONFIG.API_BASE + path, opts);
    }
  };

  // ===== SCREENS =====
  function showScreen(name) {
    var loadingScreen = $('#loadingScreen');
    var loginScreen = $('#loginScreen');
    var registerScreen = $('#registerScreen');
    var dashboardScreen = $('#dashboardScreen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'none';
    if (registerScreen) registerScreen.style.display = 'none';
    if (dashboardScreen) dashboardScreen.style.display = 'none';

    switch(name) {
      case 'login':
        if (loginScreen) loginScreen.style.display = 'flex';
        document.body.className = 'auth-page';
        break;
      case 'register':
        if (registerScreen) registerScreen.style.display = 'flex';
        document.body.className = 'auth-page';
        break;
      case 'dashboard':
        if (dashboardScreen) dashboardScreen.style.display = 'block';
        document.body.className = 'dash-page';
        break;
    }
  }

  // ===== LOGIN =====
  function setupLogin() {
    var form = $('#loginForm');
    var errorEl = $('#loginError');
    var btn = $('#loginBtn');
    var pwToggle = $('#pwToggle');
    var pwInput = $('#loginPassword');

    if (pwToggle && pwInput) {
      pwToggle.addEventListener('click', function() {
        pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
      });
    }

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError(errorEl);
        setLoading(btn, true);
        Auth.signIn($('#loginEmail').value.trim(), $('#loginPassword').value)
          .then(function() { showScreen('dashboard'); Dashboard.init(); })
          .catch(function(err) { showError(errorEl, err.message || 'Invalid email or password'); setLoading(btn, false); });
      });
    }

    var magicBtn = $('#magicLinkBtn');
    if (magicBtn) {
      magicBtn.addEventListener('click', function() {
        var email = $('#loginEmail').value.trim();
        if (!email) { showError(errorEl, 'Please enter your email first'); return; }
        magicBtn.disabled = true;
        magicBtn.textContent = 'Sending...';
        Auth.sendMagicLink(email)
          .then(function() { magicBtn.textContent = 'Magic link sent!'; })
          .catch(function(err) { magicBtn.textContent = 'Try Again'; showError(errorEl, err.message || 'Failed'); });
      });
    }

    var showRegLink = $('#showRegister');
    if (showRegLink) showRegLink.addEventListener('click', function(e) { e.preventDefault(); showScreen('register'); });
  }

  // ===== REGISTER =====
  function setupRegister() {
    var form = $('#registerForm');
    var errorEl = $('#registerError');
    var btn = $('#registerBtn');

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        hideError(errorEl);
        var name = $('#regName').value.trim();
        var email = $('#regEmail').value.trim();
        var phone = $('#regPhone').value.trim();
        var company = $('#regCompany').value.trim();
        var password = $('#regPassword').value;
        var confirm = $('#regConfirmPassword').value;

        if (password !== confirm) { showError(errorEl, 'Passwords do not match'); return; }
        if (password.length < 8) { showError(errorEl, 'Password must be at least 8 characters'); return; }

        setLoading(btn, true);
        Auth.signUp({ name: name, email: email, phone: phone, company: company, password: password })
          .then(function() { return Auth.signIn(email, password); })
          .then(function() { showScreen('dashboard'); Dashboard.init(); })
          .catch(function(err) { showError(errorEl, err.message || 'Registration failed'); setLoading(btn, false); });
      });
    }

    var showLoginLink = $('#showLogin');
    if (showLoginLink) showLoginLink.addEventListener('click', function(e) { e.preventDefault(); showScreen('login'); });
  }

  // ===== DASHBOARD =====
  var Dashboard = {
    currentRoute: 'dashboard',
    currentSessionId: null,

    init: function() {
      this._setupBottomNav();
      this._setupUserMenu();
      this._setupLogout();
      this._loadProfile();
      this.renderHome();
    },

    _setupBottomNav: function() {
      var self = this;
      $$('#dashBottomNav a').forEach(function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          var page = this.getAttribute('data-page');
          $$('#dashBottomNav a').forEach(function(l) { l.classList.remove('active'); });
          this.classList.add('active');
          self._routeTo(page);
        });
      });
    },

    _setupUserMenu: function() {
      var avatar = $('#dashAvatar');
      var dropdown = $('#dashUserDropdown');
      if (avatar && dropdown) {
        avatar.addEventListener('click', function(e) { e.stopPropagation(); dropdown.classList.toggle('open'); });
        document.addEventListener('click', function() { dropdown.classList.remove('open'); });
      }
      var settingsLink = $('#dashSettings');
      if (settingsLink) {
        var self = this;
        settingsLink.addEventListener('click', function(e) {
          e.preventDefault();
          $('#dashUserDropdown').classList.remove('open');
          self._routeTo('settings');
          $$('#dashBottomNav a').forEach(function(l) { l.classList.toggle('active', l.getAttribute('data-page') === 'settings'); });
        });
      }
    },

    _setupLogout: function() {
      var logoutBtn = $('#dashLogout');
      if (logoutBtn) logoutBtn.addEventListener('click', function(e) { e.preventDefault(); Auth.signOut(); });
    },

    _loadProfile: function() {
      Auth.apiFetch('/api/profile').then(function(r) { return r.json(); }).then(function(data) {
        if (!data.success || !data.data) return;
        var p = data.data;
        var nameEl = $('#dashUserName');
        var emailEl = $('#dashUserEmail');
        var avatarEl = $('#dashAvatar');
        if (nameEl) nameEl.textContent = p.name || 'User';
        if (emailEl) emailEl.textContent = p.email || Auth.currentUser?.email || '';
        if (avatarEl && p.avatar_url) {
          avatarEl.innerHTML = '<img src="' + p.avatar_url + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">';
        } else if (avatarEl) {
          avatarEl.textContent = (p.name || 'U').charAt(0).toUpperCase();
        }
      }).catch(function() {
        var avatarEl = $('#dashAvatar');
        if (avatarEl && Auth.currentUser) avatarEl.textContent = (Auth.currentUser.email || 'U').charAt(0).toUpperCase();
      });
    },

    _routeTo: function(page) {
      this.currentRoute = page;
      var titleEl = $('#dashPageTitle');
      var body = $('#dashBody');
      if (body) body.classList.remove('dash-body-chat');
      switch(page) {
        case 'dashboard': if (titleEl) titleEl.textContent = 'Dashboard'; this.renderHome(); break;
        case 'ai-chat': if (titleEl) titleEl.textContent = 'AI Playground'; this.renderChat(); break;
        case 'call-reports': if (titleEl) titleEl.textContent = 'Call Reports'; this.renderCallReports(); break;
        case 'settings': if (titleEl) titleEl.textContent = 'Settings'; this.renderSettings(); break;
      }
    },

    _showLoading: function() {
      var body = $('#dashBody');
      if (body) body.innerHTML = '<div class="dash-loading"><div class="spinner"></div><p>Loading...</p></div>';
    },

    _showError: function(msg) {
      var body = $('#dashBody');
      if (body) body.innerHTML = '<div class="dash-empty" style="padding:60px"><div class="dash-empty-title">Something went wrong</div><div class="dash-empty-desc">' + (msg || 'An error occurred.') + '</div><button class="btn btn-sm btn-secondary" style="margin-top:12px" onclick="Dashboard._routeTo(Dashboard.currentRoute)">Retry</button></div>';
    },

    _relativeTime: function(date) {
      var diff = Math.floor((Date.now() - date) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    },

    // === HOME ===
    renderHome: function() {
      var self = this;
      this._showLoading();
      var body = $('#dashBody');

      Promise.all([
        Auth.apiFetch('/api/dashboard/stats').then(function(r) { return r.json(); }),
        Auth.apiFetch('/api/dashboard/balance').then(function(r) { return r.json(); }).catch(function() { return { success: false }; })
      ]).then(function(results) {
        var data = results[0];
        var balData = results[1];
        if (!data.success) { self._showError(data.error); return; }

        var d = data.data;
        var balance = (balData.success && balData.data) ? Math.round(balData.data.remaining_minutes).toLocaleString() : '—';

        var sessionsHtml = '';
        if (d.recent_sessions && d.recent_sessions.length) {
          d.recent_sessions.forEach(function(s) {
            sessionsHtml += '<div class="dash-activity-item" onclick="Dashboard._routeTo(\'ai-chat\')"><span class="dash-activity-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span><div class="dash-activity-info"><strong>' + (s.title || 'Untitled') + '</strong><span>' + self._relativeTime(new Date(s.created_at)) + '</span></div></div>';
          });
        } else {
          sessionsHtml = '<div class="dash-empty"><div class="dash-empty-title">No recent activity</div><div class="dash-empty-desc">Start a conversation in AI Playground.</div></div>';
        }

        body.innerHTML =
          '<div class="dash-section"><div class="dash-grid-3">' +
            '<div class="dash-stat-card dash-stat-teal"><div class="dash-stat-icon" style="background:linear-gradient(135deg,rgba(0,229,255,.15),rgba(0,229,255,.05));color:#00E5FF"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg></div><div class="dash-stat-info"><span class="dash-stat-value">' + balance + '</span><span class="dash-stat-label">Balance (min)</span></div></div>' +
            '<div class="dash-stat-card dash-stat-green"><div class="dash-stat-icon" style="background:linear-gradient(135deg,rgba(37,211,102,.15),rgba(37,211,102,.05));color:#25D366"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div class="dash-stat-info"><span class="dash-stat-value">' + (d.chat_sessions || 0) + '</span><span class="dash-stat-label">Chat Sessions</span></div></div>' +
            '<div class="dash-stat-card dash-stat-purple"><div class="dash-stat-icon" style="background:linear-gradient(135deg,rgba(167,139,250,.15),rgba(167,139,250,.05));color:#A78BFA"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div><div class="dash-stat-info"><span class="dash-stat-value">' + (d.total_messages || 0) + '</span><span class="dash-stat-label">Total Messages</span></div></div>' +
          '</div></div>' +
          '<div class="dash-section"><h3 class="dash-section-title">Recent Activity</h3><div class="dash-activity-list">' + sessionsHtml + '</div></div>';
      }).catch(function(err) { self._showError('Failed to load dashboard. ' + (err.message || '')); });
    },

    // === AI CHAT ===
    renderChat: function() {
      var self = this;
      this._showLoading();
      var body = $('#dashBody');
      body.classList.add('dash-body-chat');

      Auth.apiFetch('/api/chat/sessions').then(function(r) { return r.json(); }).then(function(data) {
        if (!data.success) { self._showError(data.error); return; }
        var sessions = data.data || [];
        var sessionsHtml = '';
        sessions.forEach(function(s) {
          var first = s.title && s.title !== 'New Chat' ? s.title.charAt(0).toUpperCase() : '#';
          sessionsHtml += '<div class="chat-session-item" data-id="' + s.id + '"><div class="chat-session-icon"><span>' + first + '</span></div><div class="chat-session-info"><div class="chat-session-title">' + (s.title || 'New Chat') + '</div><div class="chat-session-date">' + self._relativeTime(new Date(s.updated_at)) + '</div></div></div>';
        });

        body.innerHTML =
          '<div class="chat-layout">' +
            '<div class="chat-sidebar" id="chatSidebar">' +
              '<div class="chat-sidebar-header"><h3>Chats</h3><button class="btn btn-sm btn-primary" id="newChatBtn">+ New</button></div>' +
              '<div class="chat-session-list" id="chatSessionList">' + (sessions.length ? sessionsHtml : '<div class="dash-empty" style="padding:32px 16px"><div class="dash-empty-title">No conversations yet</div><div class="dash-empty-desc">Tap "New" to start chatting with AI.</div></div>') + '</div>' +
            '</div>' +
            '<div class="chat-main">' +
              '<div class="chat-main-header"><h4 id="chatHeaderTitle">AI Playground</h4><span class="chat-model-badge">AI Assistant</span></div>' +
              '<div class="chat-msgs-wrap">' +
                '<div class="chat-welcome" id="chatWelcome"><div class="chat-welcome-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/></svg></div><h2>How can I help you today?</h2><p>Ask anything or choose a suggestion below.</p><div class="chat-suggestions"><button class="chat-suggestion" data-msg="What can you help me with?">What can you do?</button><button class="chat-suggestion" data-msg="Tell me about AI voice calling">AI Voice Calling</button><button class="chat-suggestion" data-msg="What are your pricing plans?">Pricing</button></div></div>' +
                '<div class="chat-messages" id="chatMessages" style="display:none"></div>' +
                '<div class="chat-typing" id="chatTyping"><div class="chat-typing-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>' +
              '</div>' +
              '<div class="chat-input-area"><div class="chat-input-wrap"><textarea id="chatMsgInput" class="chat-input" rows="1" placeholder="Type a message..." autocomplete="off"></textarea><button class="chat-send-btn" id="chatSendBtn" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg></button></div></div>' +
            '</div>' +
          '</div>';

        self._attachChatEvents();
      }).catch(function() { self._showError('Failed to load chat.'); });
    },

    _attachChatEvents: function() {
      var self = this;
      var list = $('#chatSessionList');
      var newBtn = $('#newChatBtn');
      var textarea = $('#chatMsgInput');
      var sendBtn = $('#chatSendBtn');

      if (list) {
        list.addEventListener('click', function(e) {
          var item = e.target.closest('.chat-session-item');
          if (item) {
            self._loadSession(item.getAttribute('data-id'));
            list.querySelectorAll('.chat-session-item').forEach(function(el) { el.classList.remove('active'); });
            item.classList.add('active');
          }
        });
      }

      if (newBtn) {
        newBtn.addEventListener('click', function() {
          Auth.apiFetch('/api/chat/sessions', { method: 'POST', body: JSON.stringify({ title: 'New Chat' }) })
            .then(function(r) { return r.json(); })
            .then(function(d) { if (d.success) { self.currentSessionId = d.data.id; self.renderChat(); } });
        });
      }

      if (textarea) {
        textarea.addEventListener('input', function() {
          this.style.height = 'auto';
          this.style.height = Math.min(this.scrollHeight, 120) + 'px';
          if (sendBtn) sendBtn.disabled = !this.value.trim();
        });
        textarea.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self._sendMessage(); } });
      }

      if (sendBtn) sendBtn.addEventListener('click', function() { self._sendMessage(); });

      document.querySelectorAll('.chat-suggestion').forEach(function(el) {
        el.addEventListener('click', function() {
          var msg = this.getAttribute('data-msg');
          var input = $('#chatMsgInput');
          if (input) { input.value = msg; input.dispatchEvent(new Event('input')); }
          if (!self.currentSessionId) {
            Auth.apiFetch('/api/chat/sessions', { method: 'POST', body: JSON.stringify({ title: msg.substring(0, 40) }) })
              .then(function(r) { return r.json(); })
              .then(function(d) { if (d.success) { self.currentSessionId = d.data.id; self._sendMessage(); } });
          } else { self._sendMessage(); }
        });
      });
    },

    _loadSession: function(sessionId) {
      this.currentSessionId = sessionId;
      var welcome = $('#chatWelcome');
      var msgContainer = $('#chatMessages');
      if (welcome) welcome.style.display = 'none';
      if (msgContainer) { msgContainer.style.display = 'flex'; msgContainer.innerHTML = '<div class="dash-loading" style="min-height:200px"><div class="spinner"></div></div>'; }
      var self = this;
      Auth.apiFetch('/api/chat/sessions/' + sessionId + '/messages').then(function(r) { return r.json(); }).then(function(data) {
        if (!data.success) { if (msgContainer) msgContainer.innerHTML = '<div class="dash-empty">Failed to load messages</div>'; return; }
        var msgs = data.data || [];
        if (!msgContainer) return;
        msgContainer.innerHTML = '';
        if (!msgs.length) { if (welcome) welcome.style.display = 'flex'; msgContainer.style.display = 'none'; return; }
        msgs.forEach(function(m) { msgContainer.appendChild(self._createMsgEl(m.role, m.content)); });
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }).catch(function() { if (msgContainer) msgContainer.innerHTML = '<div class="dash-empty">Failed to load messages</div>'; });
    },

    _createMsgEl: function(role, content) {
      var normalizedRole = (role === 'assistant') ? 'ai' : role;
      var row = document.createElement('div');
      row.className = 'chat-msg-row ' + normalizedRole;
      var avatar = document.createElement('div');
      avatar.className = 'chat-msg-avatar ' + normalizedRole;
      avatar.textContent = normalizedRole === 'user' ? (Auth.currentUser?.email?.charAt(0) || 'U').toUpperCase() : 'AI';
      var wrap = document.createElement('div');
      wrap.className = 'chat-msg-wrap';
      var bubble = document.createElement('div');
      bubble.className = 'chat-msg ' + normalizedRole;
      if (normalizedRole === 'ai') { bubble.innerHTML = this._renderMarkdown(content); } else { bubble.textContent = content; }
      var time = document.createElement('div');
      time.className = 'chat-msg-time';
      time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      wrap.appendChild(bubble);
      wrap.appendChild(time);
      row.appendChild(normalizedRole === 'user' ? wrap : avatar);
      row.appendChild(normalizedRole === 'user' ? avatar : wrap);
      return row;
    },

    _sendMessage: function() {
      var input = $('#chatMsgInput');
      var msgContainer = $('#chatMessages');
      var welcome = $('#chatWelcome');
      if (!input || !input.value.trim() || !msgContainer) return;
      var self = this;
      if (!this.currentSessionId) {
        Auth.apiFetch('/api/chat/sessions', { method: 'POST', body: JSON.stringify({ title: input.value.substring(0, 40) }) })
          .then(function(r) { return r.json(); })
          .then(function(d) { if (d.success) { self.currentSessionId = d.data.id; if (welcome) welcome.style.display = 'none'; msgContainer.style.display = 'flex'; self._doSendMessage(); } });
        return;
      }
      if (welcome) welcome.style.display = 'none';
      msgContainer.style.display = 'flex';
      this._doSendMessage();
    },

    _doSendMessage: function() {
      var input = $('#chatMsgInput');
      var sendBtn = $('#chatSendBtn');
      var msgContainer = $('#chatMessages');
      var typingEl = $('#chatTyping');
      if (!input || !msgContainer) return;
      var content = input.value.trim();
      if (!content) return;
      input.value = '';
      input.style.height = 'auto';
      if (sendBtn) sendBtn.disabled = true;
      var self = this;
      msgContainer.appendChild(self._createMsgEl('user', content));
      msgContainer.scrollTop = msgContainer.scrollHeight;
      if (typingEl) typingEl.classList.add('show');

      Auth.apiFetch('/api/chat/ai', { method: 'POST', body: JSON.stringify({ session_id: self.currentSessionId, message: content }) })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (typingEl) typingEl.classList.remove('show');
          if (sendBtn) sendBtn.disabled = false;
          if (data.success) { msgContainer.appendChild(self._createMsgEl('assistant', data.data.content)); }
          else { msgContainer.appendChild(self._createMsgEl('assistant', 'Error: ' + (data.error || 'Failed'))); }
          msgContainer.scrollTop = msgContainer.scrollHeight;
        }).catch(function() {
          if (typingEl) typingEl.classList.remove('show');
          if (sendBtn) sendBtn.disabled = false;
          msgContainer.appendChild(self._createMsgEl('assistant', 'Network error.'));
        });
    },

    _renderMarkdown: function(text) {
      if (!text) return '';
      var html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
      return '<p>' + html + '</p>';
    },

    // === CALL REPORTS ===
    renderCallReports: function() {
      var self = this;
      this._showLoading();
      var body = $('#dashBody');
      Auth.apiFetch('/api/call-reports?_t=' + Date.now()).then(function(r) { return r.json(); }).then(function(data) {
        if (!data.success) { self._showError(data.error || 'Could not fetch call reports.'); return; }
        var calls = data.data || [];
        var total = calls.length;
        var positive = 0;
        calls.forEach(function(c) { if (c.sentiment === 'Positive') positive++; });

        var cardsHtml = '';
        calls.forEach(function(c, i) {
          var name = c.customer_name || 'Unknown';
          var phone = c.customer_mobile || '-';
          var project = c.interested_project || '-';
          var sentiment = c.sentiment || '-';
          var badge = sentiment === 'Positive' ? 'badge-success' : sentiment === 'Negative' ? 'badge-danger' : 'badge-warning';
          cardsHtml += '<div class="cr-card" data-index="' + i + '"><div class="cr-card-header"><div class="cr-card-user"><div class="cr-avatar">' + (name !== 'Unknown' ? name.charAt(0).toUpperCase() : '?') + '</div><div><div class="cr-name">' + name + '</div><div class="cr-phone">' + phone + '</div></div></div><span class="badge ' + badge + '">' + sentiment + '</span></div><div class="cr-card-body"><div class="cr-grid"><div class="cr-field"><span class="cr-label">Project</span><span class="cr-value">' + project + '</span></div></div></div></div>';
        });

        body.innerHTML =
          '<div class="cr-page"><div class="cr-header"><div><h3 class="dash-section-title" style="margin:0">Call Reports</h3><p class="cr-subtitle">' + total + ' total calls</p></div></div>' +
          '<div class="cr-stats"><div class="cr-stat"><div class="cr-stat-icon" style="background:rgba(0,229,255,0.1);color:#00E5FF"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07"/></svg></div><div class="cr-stat-info"><span class="cr-stat-value">' + total + '</span><span class="cr-stat-label">Total Calls</span></div></div>' +
          '<div class="cr-stat"><div class="cr-stat-icon" style="background:rgba(37,211,102,0.1);color:#25D366"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/></svg></div><div class="cr-stat-info"><span class="cr-stat-value">' + positive + '</span><span class="cr-stat-label">Positive</span></div></div></div>' +
          '<div class="cr-list">' + (cardsHtml || '<div class="dash-empty" style="padding:40px">No call reports yet.</div>') + '</div></div>';

        document.querySelectorAll('.cr-card').forEach(function(el) {
          el.addEventListener('click', function() { self._showCallDetail(calls[parseInt(this.getAttribute('data-index'))]); });
        });
      }).catch(function() { self._showError('Failed to load call reports.'); });
    },

    _showCallDetail: function(c) {
      if (!c) return;
      var body = $('#dashBody');
      if (!body) return;
      var name = c.customer_name || 'Unknown';
      var phone = c.customer_mobile || '-';
      var project = c.interested_project || '-';
      var sentiment = c.sentiment || '-';
      var date = c.call_date ? new Date(c.call_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
      var summary = c.summary || '';
      body.innerHTML =
        '<div style="padding:0"><button class="btn btn-sm btn-secondary" onclick="Dashboard.renderCallReports()" style="margin-bottom:16px">&larr; Back</button>' +
        '<div class="cr-card" style="cursor:default"><div class="cr-card-header"><div class="cr-card-user"><div class="cr-avatar">' + (name !== 'Unknown' ? name.charAt(0).toUpperCase() : '?') + '</div><div><div class="cr-name">' + name + '</div><div class="cr-phone">' + phone + '</div></div></div></div>' +
        '<div class="cr-card-body"><div class="cr-grid"><div class="cr-field"><span class="cr-label">Project</span><span class="cr-value">' + project + '</span></div><div class="cr-field"><span class="cr-label">Sentiment</span><span class="cr-value">' + sentiment + '</span></div><div class="cr-field"><span class="cr-label">Date</span><span class="cr-value">' + date + '</span></div></div>' +
        (summary ? '<div class="cr-summary">' + summary + '</div>' : '') + '</div></div></div>';
    },

    // === SETTINGS ===
    renderSettings: function() {
      var self = this;
      var body = $('#dashBody');
      self._showLoading();
      Auth.apiFetch('/api/profile').then(function(r) { return r.json(); }).then(function(data) {
        var p = data.success ? data.data : {};
        body.innerHTML =
          '<div class="dash-section"><h3 class="dash-section-title">Profile Settings</h3>' +
          '<div class="dash-card"><form id="profileForm" class="dash-form">' +
            '<div class="form-group"><label>Full Name</label><input type="text" id="profileName" class="form-input" value="' + (p.name || '').replace(/"/g, '&quot;') + '" required></div>' +
            '<div class="form-group"><label>Email</label><input type="email" class="form-input" value="' + ((p.email || Auth.currentUser?.email || '').replace(/"/g, '&quot;')) + '" disabled style="opacity:0.6"></div>' +
            '<div class="form-group"><label>Phone</label><input type="tel" id="profilePhone" class="form-input" value="' + (p.phone || '').replace(/"/g, '&quot;') + '"></div>' +
            '<div class="form-group"><label>Company</label><input type="text" id="profileCompany" class="form-input" value="' + (p.company_name || '').replace(/"/g, '&quot;') + '"></div>' +
            '<button type="submit" class="btn btn-primary"><span class="btn-text">Save Changes</span><span class="btn-loader" style="display:none">Saving...</span></button>' +
            '<div id="profileMsg" style="margin-top:12px;display:none;"></div></form></div></div>';

        var form = document.getElementById('profileForm');
        if (form) {
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            var msg = document.getElementById('profileMsg');
            if (msg) msg.style.display = 'none';
            Auth.apiFetch('/api/profile', { method: 'POST', body: JSON.stringify({ name: document.getElementById('profileName').value, phone: document.getElementById('profilePhone').value, company: document.getElementById('profileCompany').value }) })
              .then(function(r) { return r.json(); }).then(function(d) {
                if (msg) { msg.style.display = 'block'; msg.style.color = d.success ? '#25D366' : '#ef4444'; msg.textContent = d.success ? 'Profile updated.' : (d.error || 'Failed.'); }
              }).catch(function() { if (msg) { msg.style.display = 'block'; msg.style.color = '#ef4444'; msg.textContent = 'Something went wrong.'; } });
          });
        }
      }).catch(function() { self._showError('Failed to load settings.'); });
    }
  };

  window.Dashboard = Dashboard;

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
    setupLogin();
    setupRegister();

    Auth.init().then(function(loggedIn) {
      if (loggedIn) {
        showScreen('dashboard');
        Dashboard.init();
      } else {
        showScreen('login');
      }
    });
  });

})();
