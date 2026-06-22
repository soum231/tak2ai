var Tak2aiDashboard = {
  currentSessionId: null,

  navTo: function (path) {
    var href = '/dashboard/' + path;
    window.history.pushState(null, '', href);
    this._route();
  },

  init: function () {
    this._setupSidebar();
    this._setupThemeToggle();
    this._setupUserMenu();
    this._route();
    this._setupRipple();
    window.addEventListener('popstate', this._route.bind(this));
  },

  _route: function () {
    var path = window.location.pathname.replace(/^\/dashboard/, '') || '/';
    var title = 'Dashboard';
    this._stopCallReportsPolling();
    if (path === '/' || path === '') {
      title = 'Dashboard';
      this.renderHome();
    } else if (path === '/ai-chat') {
      title = 'AI Playground';
      this.renderChat();
    } else if (path === '/settings') {
      title = 'Settings';
      this.renderSettings();
    } else if (path === '/call-reports') {
      title = 'Call Reports';
      this.renderCallReports();
    } else {
      this.renderHome();
    }
    var titleEl = document.getElementById('dashPageTitle');
    if (titleEl) titleEl.textContent = title;
    this._setActiveNav(path);
  },

  _setActiveNav: function (path) {
    document.querySelectorAll('.dash-nav-item').forEach(function (a) {
      var href = a.getAttribute('href');
      var isActive = href === '/dashboard' && (path === '/' || path === '');
      if (href === '/dashboard' + path) isActive = true;
      a.classList.toggle('active', isActive);
    });
    document.querySelectorAll('#dashBottomNav a').forEach(function (a) {
      var href = a.getAttribute('href');
      var isActive = href === '/dashboard' && (path === '/' || path === '');
      if (href === '/dashboard' + path) isActive = true;
      a.classList.toggle('active', isActive);
    });
  },

  _setupSidebar: function () {
    var sidebar = document.getElementById('dashSidebar');
    var closeBtn = document.getElementById('dashSidebarClose');
    if (closeBtn && sidebar) {
      closeBtn.addEventListener('click', function () { sidebar.classList.remove('open'); });
    }
    document.querySelectorAll('.dash-nav-item').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (href && href.indexOf('/dashboard') === 0) {
          e.preventDefault();
          var sub = href.replace('/dashboard', '') || '/';
          if (sidebar) sidebar.classList.remove('open');
          window.history.pushState(null, '', href);
          Tak2aiDashboard._route();
        }
      });
    });
    document.querySelectorAll('#dashBottomNav a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (href && href.indexOf('/dashboard') === 0) {
          e.preventDefault();
          window.history.pushState(null, '', href);
          Tak2aiDashboard._route();
        }
      });
    });
  },

  _setupThemeToggle: function () {
    var btn = document.getElementById('dashThemeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var html = document.documentElement;
      var current = html.getAttribute('data-theme');
      var next = current === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', next);
      localStorage.setItem('tak2ai-theme', next);
      var icon = btn.querySelector('i');
      if (icon) icon.setAttribute('data-lucide', next === 'dark' ? 'moon' : 'sun');
      if (window.lucide) lucide.createIcons();
    });
  },

  _setupUserMenu: function () {
    var avatar = document.getElementById('dashAvatar');
    var dropdown = document.getElementById('dashUserDropdown');
    if (avatar && dropdown) {
      avatar.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', function () { dropdown.classList.remove('open'); });
    }
  },

  _showLoading: function (type) {
    var body = document.getElementById('dashBody');
    if (!body) return;
    if (type === 'home') {
      body.innerHTML =
        '<div class="dash-skeleton">' +
          '<div class="dash-skeleton-row">' +
            '<div class="dash-skeleton-card"><div class="dash-skeleton-pulse"></div><div class="dash-skeleton-lines"><div class="dash-skeleton-line"></div><div class="dash-skeleton-line"></div></div></div>' +
            '<div class="dash-skeleton-card"><div class="dash-skeleton-pulse"></div><div class="dash-skeleton-lines"><div class="dash-skeleton-line"></div><div class="dash-skeleton-line"></div></div></div>' +
            '<div class="dash-skeleton-card"><div class="dash-skeleton-pulse"></div><div class="dash-skeleton-lines"><div class="dash-skeleton-line"></div><div class="dash-skeleton-line"></div></div></div>' +
          '</div>' +
          '<div class="dash-skeleton-block"></div>' +
          '<div class="dash-skeleton-block"></div>' +
        '</div>';
    } else {
      body.innerHTML = '<div class="dash-loading"><div class="spinner"></div><p>Loading...</p></div>';
    }
  },

  _showError: function (msg) {
    var body = document.getElementById('dashBody');
    if (body) body.innerHTML = '<div class="dash-empty" style="padding:60px"><div class="dash-empty-icon" style="background:rgba(239,68,68,0.1);color:var(--danger)"><i data-lucide="alert-triangle"></i></div><div class="dash-empty-title">Something went wrong</div><div class="dash-empty-desc">' + (msg || 'An error occurred.') + '</div><button class="btn btn-sm btn-secondary" style="margin-top:12px" onclick="Tak2aiDashboard._route()">Retry</button></div>';
    if (window.lucide) lucide.createIcons();
  },

  renderHome: function () {
    this._showLoading('home');
    var self = this;
    var body = document.getElementById('dashBody');
    if (body) body.classList.remove('dash-body-chat');
    fetch('/api/dashboard/stats').then(function (r) { return r.json(); }).then(function (data) {
      if (!data.success) { self._showError(data.error); return; }
      var d = data.data;
      var body = document.getElementById('dashBody');
      if (!body) return;
      var sessionsHtml = '';
      if (d.recent_sessions && d.recent_sessions.length) {
        d.recent_sessions.forEach(function (s) {
          var date = self._relativeTime(new Date(s.created_at));
          var icon = s.title && s.title.toLowerCase().indexOf('call') !== -1 ? 'phone' : 'message-square';
          sessionsHtml += '<div class="dash-activity-item" onclick="Tak2aiDashboard.navTo(\'ai-chat\')"><span class="dash-activity-icon" style="background:rgba(0,229,255,.08);color:var(--primary)"><i data-lucide="' + icon + '" style="width:15px;height:15px"></i></span><div class="dash-activity-info"><strong>' + (s.title || 'Untitled') + '</strong><span>' + date + '</span></div></div>';
        });
      } else {
        sessionsHtml = '<div class="dash-empty"><div class="dash-empty-icon"><i data-lucide="message-circle"></i></div><div class="dash-empty-title">No recent activity</div><div class="dash-empty-desc">Start a conversation in AI Playground to see your activity here.</div></div>';
      }
      body.innerHTML =
        '<div class="dash-section"><div class="dash-grid-3">' +
          '<div class="dash-stat-card dash-stat-teal"><div class="dash-stat-icon" style="background:linear-gradient(135deg,rgba(0,229,255,.15),rgba(0,229,255,.05));color:#00E5FF"><i data-lucide="wallet" style="width:22px;height:22px"></i></div><div class="dash-stat-info"><span class="dash-stat-value" id="dashBalance">—</span><span class="dash-stat-label">Balance (min)</span></div></div>' +
          '<div class="dash-stat-card dash-stat-green"><div class="dash-stat-icon" style="background:linear-gradient(135deg,rgba(37,211,102,.15),rgba(37,211,102,.05));color:#25D366"><i data-lucide="message-square" style="width:22px;height:22px"></i></div><div class="dash-stat-info"><span class="dash-stat-value"><span class="dash-countup" data-target="' + (d.chat_sessions || 0) + '">0</span></span><span class="dash-stat-label">Chat Sessions</span></div></div>' +
          '<div class="dash-stat-card dash-stat-purple"><div class="dash-stat-icon" style="background:linear-gradient(135deg,rgba(167,139,250,.15),rgba(167,139,250,.05));color:#A78BFA"><i data-lucide="message-circle" style="width:22px;height:22px"></i></div><div class="dash-stat-info"><span class="dash-stat-value"><span class="dash-countup" data-target="' + (d.total_messages || 0) + '">0</span></span><span class="dash-stat-label">Total Messages</span></div></div>' +
        '</div></div>' +
        '<div class="dash-section"><h3 class="dash-section-title">Recent Activity</h3><div class="dash-activity-list">' + sessionsHtml + '</div></div>' +
        '<div class="dash-section" id="dashCallReportsWidget"><h3 class="dash-section-title">Call Reports</h3><div class="dash-loading" style="min-height:80px"><div class="spinner"></div></div></div>';
      if (window.lucide) lucide.createIcons();
      self._animateCountUp();
      fetch('/api/dashboard/balance').then(function (r) { return r.json(); }).then(function (b) {
        if (b.success && b.data) {
          var balEl = document.getElementById('dashBalance');
          if (balEl) balEl.textContent = Math.round(b.data.remaining_minutes).toLocaleString();
        }
      }).catch(function () {});
      fetch('/api/call-reports?_t=' + Date.now()).then(function (r) { return r.json(); }).then(function (cr) {
        var w = document.getElementById('dashCallReportsWidget');
        if (!w) return;
        if (!cr.success || !cr.data || !cr.data.length) {
          w.innerHTML = '<div class="dash-section"><h3 class="dash-section-title">Call Reports</h3><div class="dash-empty"><div class="dash-empty-icon"><i data-lucide="phone-call"></i></div><div class="dash-empty-title">No call data yet</div><div class="dash-empty-desc">Incoming calls will appear here once call tracking is active.</div></div></div>';
          return;
        }
        var calls = cr.data;
        var total = calls.length;
        var positive = 0, siteVisits = 0;
        calls.forEach(function (c) {
          if (c.sentiment === 'Positive') positive++;
          if (c.site_visit_interest && c.site_visit_interest.toLowerCase() === 'yes') siteVisits++;
        });
        var recent = calls.slice(0, 3);
        var recentHtml = '';
        recent.forEach(function (c) {
          var name = c.customer_name || 'Unknown';
          var phone = c.customer_mobile || '—';
          var project = c.interested_project || '—';
          var sentiment = c.sentiment || '—';
          var badge = sentiment === 'Positive' ? 'badge-success' : sentiment === 'Negative' ? 'badge-danger' : 'badge-warning';
          recentHtml += '<div class="cr-card" style="cursor:pointer" onclick="Tak2aiDashboard.navTo(\'call-reports\')"><div class="cr-card-header"><div class="cr-card-user"><div class="cr-avatar">' + (name !== 'Unknown' ? name.charAt(0).toUpperCase() : '?') + '</div><div><div class="cr-name">' + name + '</div><div class="cr-phone">' + phone + '</div></div></div><span class="badge ' + badge + '">' + sentiment + '</span></div><div class="cr-card-body"><div class="cr-grid"><div class="cr-field"><span class="cr-label">Project</span><span class="cr-value">' + project + '</span></div></div></div></div>';
        });
        w.innerHTML =
          '<div class="dash-section" style="margin-bottom:0"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px"><h3 class="dash-section-title" style="margin:0">Call Reports</h3><a href="/dashboard/call-reports" class="btn btn-sm btn-primary" onclick="event.preventDefault();Tak2aiDashboard.navTo(\'call-reports\')"><i data-lucide="phone-call" style="width:14px;height:14px"></i> View All</a></div>' +
          '<div class="dash-home-stats">' +
            '<div class="cr-stat"><div class="cr-stat-icon" style="background:rgba(0,229,255,0.1);color:#00E5FF"><i data-lucide="phone" style="width:20px;height:20px"></i></div><div class="cr-stat-info"><span class="cr-stat-value">' + total + '</span><span class="cr-stat-label">Total Calls</span></div></div>' +
            '<div class="cr-stat"><div class="cr-stat-icon" style="background:rgba(37,211,102,0.1);color:#25D366"><i data-lucide="thumbs-up" style="width:20px;height:20px"></i></div><div class="cr-stat-info"><span class="cr-stat-value">' + positive + '</span><span class="cr-stat-label">Positive</span></div></div>' +
            '<div class="cr-stat"><div class="cr-stat-icon" style="background:rgba(167,139,250,0.1);color:#A78BFA"><i data-lucide="calendar-check" style="width:20px;height:20px"></i></div><div class="cr-stat-info"><span class="cr-stat-value">' + siteVisits + '</span><span class="cr-stat-label">Site Visits</span></div></div>' +
          '</div>' +
          '<div class="dash-home-recent">' + recentHtml + '</div></div>';
        if (window.lucide) lucide.createIcons();
      }).catch(function () {});
    }).catch(function () { self._showError('Failed to load dashboard stats.'); });
  },

  renderChat: function () {
    this._showLoading();
    var self = this;
    var body = document.getElementById('dashBody');
    if (body) body.classList.add('dash-body-chat');
    fetch('/api/chat/sessions').then(function (r) { return r.json(); }).then(function (data) {
      if (!data.success) { self._showError(data.error); return; }
      var body = document.getElementById('dashBody');
      if (!body) return;
      var sessions = data.data || [];
      var sessionsHtml = '';
      sessions.forEach(function (s) {
        var first = s.title && s.title !== 'New Chat' ? s.title.charAt(0).toUpperCase() : '#';
        sessionsHtml += '<div class="chat-session-item" data-id="' + s.id + '">' +
          '<div class="chat-session-icon"><span>' + first + '</span></div>' +
          '<div class="chat-session-info">' +
            '<div class="chat-session-title">' + (s.title || 'New Chat') + '</div>' +
            '<div class="chat-session-date">' + self._relativeTime(new Date(s.updated_at)) + '</div>' +
          '</div>' +
          '<button class="chat-session-del" data-id="' + s.id + '" title="Delete"><i data-lucide="trash-2" style="width:13px;height:13px"></i></button>' +
        '</div>';
      });
      body.innerHTML =
        '<div class="chat-layout">' +
          '<div class="chat-sidebar-overlay" id="chatSidebarOverlay"></div>' +
          '<div class="chat-sidebar" id="chatSidebar">' +
            '<div class="chat-sidebar-header">' +
              '<h3><i data-lucide="message-square"></i>Chats</h3>' +
              '<button class="btn btn-sm btn-primary" id="newChatBtn"><i data-lucide="plus" style="width:14px;height:14px"></i> New</button>' +
            '</div>' +
            '<div class="chat-sidebar-search">' +
              '<i data-lucide="search" class="search-icon"></i>' +
              '<input type="text" id="chatSearch" placeholder="Search conversations...">' +
            '</div>' +
            '<div class="chat-session-list" id="chatSessionList">' +
              (sessions.length ? sessionsHtml :
                '<div class="dash-empty" style="padding:32px 16px">' +
                  '<div class="dash-empty-icon"><i data-lucide="message-circle"></i></div>' +
                  '<div class="dash-empty-title">No conversations yet</div>' +
                  '<div class="dash-empty-desc">Click "New" to start chatting with AI.</div>' +
                '</div>') +
            '</div>' +
          '</div>' +
          '<div class="chat-main">' +
            '<div class="chat-main-header">' +
              '<button class="chat-sidebar-toggle" id="chatSidebarToggle"><i data-lucide="menu" style="width:18px;height:18px"></i></button>' +
              '<h4 id="chatHeaderTitle">AI Playground</h4>' +
              '<span class="chat-model-badge"><i data-lucide="sparkles"></i> Nemotron AI</span>' +
            '</div>' +
            '<div class="chat-msgs-wrap">' +
              '<div class="chat-welcome" id="chatWelcome">' +
                '<div class="chat-welcome-icon"><i data-lucide="bot"></i></div>' +
                '<h2>How can I help you today?</h2>' +
                '<p>Ask anything or choose a suggestion below to get started.</p>' +
                '<div class="chat-suggestions">' +
                  '<button class="chat-suggestion" data-msg="What can you help me with?"><i data-lucide="sparkles"></i> What can you do?</button>' +
                  '<button class="chat-suggestion" data-msg="Tell me about AI voice calling"><i data-lucide="phone"></i> AI Voice Calling</button>' +
                  '<button class="chat-suggestion" data-msg="What are your pricing plans?"><i data-lucide="credit-card"></i> Pricing</button>' +
                  '<button class="chat-suggestion" data-msg="How do I get started?"><i data-lucide="rocket"></i> Getting Started</button>' +
                '</div>' +
              '</div>' +
              '<div class="chat-messages" id="chatMessages" style="display:none"></div>' +
              '<div class="chat-typing-fixed" id="chatTyping">' +
                '<div class="chat-typing-avatar">AI</div>' +
                '<div class="chat-typing-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>' +
              '</div>' +
            '</div>' +
            '<div class="chat-input-area" id="chatInputArea">' +
              '<div class="chat-input-wrap">' +
                '<textarea id="chatMsgInput" class="chat-input" rows="1" placeholder="Type a message..." autocomplete="off"></textarea>' +
                '<button class="chat-send-btn" id="chatSendBtn" disabled><i data-lucide="arrow-up"></i></button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="chat-delete-confirm" id="chatDeleteConfirm">' +
          '<h4>Delete Conversation?</h4>' +
          '<p>This will permanently delete this chat and all its messages.</p>' +
          '<div class="chat-delete-confirm-actions">' +
            '<button class="chat-delete-cancel" id="chatDeleteCancel">Cancel</button>' +
            '<button class="chat-delete-ok" id="chatDeleteOk">Delete</button>' +
          '</div>' +
        '</div>';
      if (window.lucide) lucide.createIcons();
      self._attachChatEvents(sessions);
      if (self.currentSessionId) {
        var el = document.querySelector('.chat-session-item[data-id="' + self.currentSessionId + '"]');
        if (el) {
          el.classList.add('active');
          self._loadSession(self.currentSessionId);
        }
      }
    }).catch(function () { self._showError('Failed to load chat.'); });
  },

  _attachChatEvents: function () {
    var self = this;
    var list = document.getElementById('chatSessionList');
    var newBtn = document.getElementById('newChatBtn');
    var textarea = document.getElementById('chatMsgInput');
    var sendBtn = document.getElementById('chatSendBtn');
    var searchInput = document.getElementById('chatSearch');
    var sidebarToggle = document.getElementById('chatSidebarToggle');
    var sidebarOverlay = document.getElementById('chatSidebarOverlay');
    var chatSidebar = document.getElementById('chatSidebar');
    var deleteConfirm = document.getElementById('chatDeleteConfirm');
    var deleteCancel = document.getElementById('chatDeleteCancel');
    var deleteOk = document.getElementById('chatDeleteOk');
    self._pendingDeleteId = null;

    // Mobile sidebar toggle
    function openMobileSidebar() {
      if (chatSidebar) chatSidebar.classList.add('open');
      if (sidebarOverlay) sidebarOverlay.classList.add('show');
    }
    function closeMobileSidebar() {
      if (chatSidebar) chatSidebar.classList.remove('open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('show');
    }
    if (sidebarToggle) sidebarToggle.addEventListener('click', openMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // Session list clicks
    if (list) {
      list.addEventListener('click', function (e) {
        var delBtn = e.target.closest('.chat-session-del');
        if (delBtn) {
          e.stopPropagation();
          self._pendingDeleteId = delBtn.getAttribute('data-id');
          if (deleteConfirm) deleteConfirm.classList.add('show');
          return;
        }
        var item = e.target.closest('.chat-session-item');
        if (item) {
          var id = item.getAttribute('data-id');
          self._loadSession(id);
          list.querySelectorAll('.chat-session-item').forEach(function (el) { el.classList.remove('active'); });
          item.classList.add('active');
          closeMobileSidebar();
        }
      });
    }

    // Delete confirm
    if (deleteCancel) deleteCancel.addEventListener('click', function () {
      if (deleteConfirm) deleteConfirm.classList.remove('show');
      self._pendingDeleteId = null;
    });
    if (deleteOk) deleteOk.addEventListener('click', function () {
      if (!self._pendingDeleteId) return;
      var id = self._pendingDeleteId;
      if (deleteConfirm) deleteConfirm.classList.remove('show');
      fetch('/api/chat/sessions/' + id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.success) {
            if (self.currentSessionId === id) self.currentSessionId = null;
            self.renderChat();
          }
        });
      self._pendingDeleteId = null;
    });

    // Search
    if (searchInput) {
      var searchTimer;
      searchInput.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          var q = searchInput.value.toLowerCase().trim();
          list.querySelectorAll('.chat-session-item').forEach(function (el) {
            var title = el.querySelector('.chat-session-title');
            var match = title && title.textContent.toLowerCase().includes(q);
            el.style.display = match ? 'flex' : 'none';
          });
        }, 150);
      });
    }

    // New chat
    if (newBtn) {
      newBtn.addEventListener('click', function () {
        fetch('/api/chat/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Chat' }) })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.success) {
              self.currentSessionId = d.data.id;
              self.renderChat();
            }
          });
      });
    }

    // Textarea auto-resize + send
    if (textarea) {
      textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        if (sendBtn) sendBtn.disabled = !this.value.trim();
      });
      textarea.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          self._sendMessage();
        }
      });
    }

    // Send button
    if (sendBtn) {
      sendBtn.addEventListener('click', function () { self._sendMessage(); });
    }

    // Suggestion chips
    document.querySelectorAll('.chat-suggestion').forEach(function (el) {
      el.addEventListener('click', function () {
        var msg = this.getAttribute('data-msg');
        var input = document.getElementById('chatMsgInput');
        if (input) { input.value = msg; input.dispatchEvent(new Event('input')); }
        if (!self.currentSessionId) {
          fetch('/api/chat/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: msg.substring(0, 40) }) })
            .then(function (r) { return r.json(); })
            .then(function (d) {
              if (d.success) {
                self.currentSessionId = d.data.id;
                self._sendMessage();
              }
            });
        } else {
          self._sendMessage();
        }
      });
    });
  },

  _loadSession: function (sessionId) {
    this.currentSessionId = sessionId;
    var welcome = document.getElementById('chatWelcome');
    var msgContainer = document.getElementById('chatMessages');
    var headerTitle = document.getElementById('chatHeaderTitle');
    if (welcome) welcome.style.display = 'none';
    if (msgContainer) { msgContainer.style.display = 'flex'; msgContainer.innerHTML = '<div class="dash-loading" style="min-height:200px"><div class="spinner"></div></div>'; }
    var self = this;
    fetch('/api/chat/sessions/' + sessionId + '/messages').then(function (r) { return r.json(); }).then(function (data) {
      if (!data.success) { if (msgContainer) msgContainer.innerHTML = '<div class="dash-empty">Failed to load messages</div>'; return; }
      var msgs = data.data || [];
      if (!msgContainer) return;
      msgContainer.innerHTML = '';
      if (!msgs.length) {
        if (welcome) welcome.style.display = 'flex';
        msgContainer.style.display = 'none';
        return;
      }
      msgs.forEach(function (m) {
        msgContainer.appendChild(self._createMsgEl(m.role, m.content));
      });
      msgContainer.scrollTop = msgContainer.scrollHeight;
      if (headerTitle) headerTitle.textContent = 'Chat';
    }).catch(function () {
      if (msgContainer) msgContainer.innerHTML = '<div class="dash-empty">Failed to load messages</div>';
    });
  },

  _createMsgEl: function (role, content) {
    var normalizedRole = (role === 'assistant') ? 'ai' : role;
    var row = document.createElement('div');
    row.className = 'chat-msg-row ' + normalizedRole;

    var avatar = document.createElement('div');
    avatar.className = 'chat-msg-avatar ' + normalizedRole;
    if (normalizedRole === 'user') {
      var userImg = document.getElementById('dashAvatar');
      if (userImg && userImg.src && userImg.src.indexOf('default-avatar') === -1) {
        avatar.innerHTML = '<img src="' + userImg.src + '" alt="">';
      } else {
        var name = (document.getElementById('dashUserName') || {}).textContent || 'U';
        avatar.textContent = name.charAt(0).toUpperCase();
      }
    } else {
      avatar.textContent = 'AI';
    }

    var wrap = document.createElement('div');
    wrap.className = 'chat-msg-wrap';

    var bubble = document.createElement('div');
    bubble.className = 'chat-msg ' + normalizedRole;
    if (normalizedRole === 'ai') {
      bubble.innerHTML = this._renderMarkdown(content);
    } else {
      bubble.textContent = content;
    }

    var actions = document.createElement('div');
    actions.className = 'chat-msg-actions';

    var time = document.createElement('div');
    time.className = 'chat-msg-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (normalizedRole === 'ai') {
      var copyBtn = document.createElement('button');
      copyBtn.className = 'chat-msg-action';
      copyBtn.title = 'Copy';
      copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(content).then(function () {
          copyBtn.classList.add('copied');
          copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
          setTimeout(function () {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
          }, 2000);
        });
      });
      actions.appendChild(copyBtn);
    }

    wrap.appendChild(bubble);
    wrap.appendChild(actions);
    wrap.appendChild(time);
    row.appendChild(normalizedRole === 'user' ? wrap : avatar);
    row.appendChild(normalizedRole === 'user' ? avatar : wrap);
    return row;
  },

  _sendMessage: function () {
    var input = document.getElementById('chatMsgInput');
    var msgContainer = document.getElementById('chatMessages');
    var welcome = document.getElementById('chatWelcome');
    if (!input || !input.value.trim()) return;
    if (!msgContainer) return;
    if (!this.currentSessionId) {
      var self = this;
      fetch('/api/chat/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: input.value.substring(0, 40) }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.success) {
            self.currentSessionId = d.data.id;
            if (welcome) welcome.style.display = 'none';
            msgContainer.style.display = 'flex';
            self._doSendMessage();
          }
        });
      return;
    }
    if (welcome) welcome.style.display = 'none';
    msgContainer.style.display = 'flex';
    this._doSendMessage();
  },

  _doSendMessage: function () {
    var input = document.getElementById('chatMsgInput');
    var sendBtn = document.getElementById('chatSendBtn');
    var msgContainer = document.getElementById('chatMessages');
    var typingEl = document.getElementById('chatTyping');
    if (!input || !msgContainer) return;
    var content = input.value.trim();
    if (!content) return;
    input.value = '';
    input.style.height = 'auto';
    if (sendBtn) { sendBtn.disabled = true; sendBtn.classList.add('sending'); setTimeout(function () { sendBtn.classList.remove('sending'); }, 600); }
    var self = this;
    msgContainer.appendChild(self._createMsgEl('user', content));
    msgContainer.scrollTop = msgContainer.scrollHeight;
    if (typingEl) typingEl.classList.add('show');
    var reqSessionId = self.currentSessionId;
    fetch('/api/chat/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: reqSessionId, message: content })
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (self.currentSessionId !== reqSessionId) return;
      if (typingEl) typingEl.classList.remove('show');
      if (sendBtn) sendBtn.disabled = false;
      if (data.success) {
        msgContainer.appendChild(self._createMsgEl('assistant', data.data.content));
        msgContainer.scrollTop = msgContainer.scrollHeight;
        if (self.currentSessionId) self._updateSidebarTitle(self.currentSessionId);
      } else {
        self._showErrorMsg(msgContainer, data.error || 'Failed to get AI response.');
      }
    }).catch(function () {
      if (self.currentSessionId !== reqSessionId) return;
      if (typingEl) typingEl.classList.remove('show');
      if (sendBtn) sendBtn.disabled = false;
      self._showErrorMsg(msgContainer, 'Network error. Please try again.');
    });
  },

  _showErrorMsg: function (container, text) {
    var errRow = document.createElement('div');
    errRow.className = 'chat-msg-row ai';
    var errAvatar = document.createElement('div');
    errAvatar.className = 'chat-msg-avatar ai';
    errAvatar.textContent = 'AI';
    var errWrap = document.createElement('div');
    errWrap.className = 'chat-msg-wrap';
    var errBubble = document.createElement('div');
    errBubble.className = 'chat-msg ai error';
    errBubble.textContent = text;
    var errBtns = document.createElement('div');
    errBtns.className = 'chat-msg-actions';
    var retryBtn = document.createElement('button');
    retryBtn.className = 'chat-msg-action';
    retryBtn.title = 'Retry';
    retryBtn.innerHTML = '<i data-lucide="refresh-cw" style="width:13px;height:13px"></i>';
    retryBtn.addEventListener('click', function () { errRow.remove(); Tak2aiDashboard._doSendMessage(); });
    errBtns.appendChild(retryBtn);
    errWrap.appendChild(errBubble);
    errWrap.appendChild(errBtns);
    errRow.appendChild(errAvatar);
    errRow.appendChild(errWrap);
    container.appendChild(errRow);
    container.scrollTop = container.scrollHeight;
    if (window.lucide) lucide.createIcons();
  },

  _updateSidebarTitle: function (id) {
    var titleEl = document.querySelector('.chat-msg-row.user:last-child .chat-msg');
    if (!titleEl) return;
    var newTitle = titleEl.textContent.substring(0, 40);
    var sessionTitle = document.querySelector('.chat-session-item[data-id="' + id + '"] .chat-session-title');
    if (sessionTitle) sessionTitle.textContent = newTitle;
    var sessionIcon = document.querySelector('.chat-session-item[data-id="' + id + '"] .chat-session-icon span');
    if (sessionIcon) sessionIcon.textContent = newTitle.charAt(0).toUpperCase();
  },

  _renderMarkdown: function (text) {
    if (!text) return '';
    var html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, function (match) {
        if (match.indexOf('<ul>') !== -1) return match;
        return '<ul>' + match + '</ul>';
      })
      .replace(/<\/ul>\s*<ul>/g, '')
      .replace(/^(\d+)\. (.+)$/gm, '<oli>$2</oli>')
      .replace(/(<oli>[\s\S]*?<\/oli>)/g, function (match) {
        return '<ol>' + match.replace(/<\/?oli>/g, function (tag) {
          return tag === '<oli>' ? '<li>' : '</li>';
        }) + '</ol>';
      })
      .replace(/<\/ol>\s*<ol>/g, '')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
  },

  _animateCountUp: function () {
    document.querySelectorAll('.dash-countup').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-target')) || 0;
      if (target === 0) { el.textContent = '0'; return; }
      var current = 0;
      var step = Math.max(1, Math.floor(target / 40));
      var timer = setInterval(function () {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current.toLocaleString();
      }, 20);
    });
  },

  _relativeTime: function (date) {
    var now = new Date();
    var diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  },

  _setupRipple: function () {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn, .dash-nav-item, .chat-suggestion');
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      var diameter = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = diameter + 'px';
      ripple.style.left = (e.clientX - rect.left - diameter / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - diameter / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 600);
    });
  },

  renderVoice: function () {
    this._showLoading();
    var body = document.getElementById('dashBody');
    if (!body) return;
    var self = this;
    this._voicePage = 0;
    this._voiceLimit = 20;
    this._voiceStatus = '';
    this._voiceSearch = '';
    this._voiceFrom = '';
    this._voiceTo = '';
    this._voicePublicUrl = localStorage.getItem('tak2ai_public_url') || '';

    fetch('/api/voice/webhook-token').then(function (r) { return r.json(); }).then(function (tok) {
      var token = tok.success ? tok.data.token : '';
      self._voiceToken = token;
      self._voiceLoadPage();
    }).catch(function () {
      self._voiceLoadPage();
    });
  },

  _voiceLoadPage: function () {
    var body = document.getElementById('dashBody');
    if (!body) return;
    var self = this;
    var params = '?limit=' + this._voiceLimit + '&offset=' + (this._voicePage * this._voiceLimit);
    if (this._voiceStatus) params += '&status=' + encodeURIComponent(this._voiceStatus);
    if (this._voiceSearch) params += '&search=' + encodeURIComponent(this._voiceSearch);
    if (this._voiceFrom) params += '&from=' + encodeURIComponent(this._voiceFrom);
    if (this._voiceTo) params += '&to=' + encodeURIComponent(this._voiceTo);

    var statsParams = '?' + params.substring(1);
    Promise.all([
      fetch('/api/voice/reports' + params).then(function (r) { return r.json(); }),
      fetch('/api/voice/reports/stats' + statsParams).then(function (r) { return r.json(); })
    ]).then(function (results) {
      var data = results[0];
      var stats = results[1];
      var reports = data.success ? data.data : [];
      var pagination = data.pagination || {};
      var met = stats.success ? stats.data : {};
      var total = met.total || 0;
      var completed = met.completed || 0;
      var noAnswer = met.no_answer || 0;
      var failed = met.failed || 0;
      var avgDur = met.avg_duration_seconds || 0;
      var totalMin = Math.round((met.total_duration_seconds || 0) / 60);
      var sent = met.sentiments || {};

      var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      var whUrl = (self._voicePublicUrl || window.location.origin) + '/api/webhooks/omnidim?token=' + (self._voiceToken || '');

      var statusOptions = ['', 'completed', 'answered', 'no-answer', 'no_answer', 'failed', 'busy', 'unknown'];
      var statusLabels = ['All Status', 'Completed', 'Answered', 'No Answer', 'No Answer', 'Failed', 'Busy', 'Unknown'];
      var statusHtml = '';
      for (var si = 0; si < statusOptions.length; si++) {
        var sel = statusOptions[si] === self._voiceStatus ? ' selected' : '';
        statusHtml += '<option value="' + statusOptions[si] + '"' + sel + '>' + statusLabels[si] + '</option>';
      }

      var localWarning = isLocal ? '<div class="wh-warning"><i data-lucide="alert-triangle" style="width:16px;height:16px;flex-shrink:0"></i> Localhost detected — paste your ngrok URL in the box below:</div>' : '';

      var rowsHtml = '';
      if (reports.length) {
        for (var ri = 0; ri < reports.length; ri++) {
          var r = reports[ri];
          var idx = (self._voicePage * self._voiceLimit) + ri + 1;
          var date = new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          var statusClass = (r.status === 'completed' || r.status === 'answered') ? 'badge-success' : (r.status === 'failed' ? 'badge-danger' : (r.status === 'busy' ? 'badge-warning' : 'badge-default'));
          var dur = r.duration_seconds ? (r.duration_seconds >= 60 ? Math.floor(r.duration_seconds / 60) + 'm ' + (r.duration_seconds % 60) + 's' : r.duration_seconds + 's') : '--';
          var caller = r.caller_number || r.callee_number || '--';
          var callerName = (r.raw_payload && (r.raw_payload.name || r.raw_payload.Name || r.raw_payload.caller_name || r.raw_payload.CallerName)) || '--';
          var sentiment = (r.raw_payload && (r.raw_payload.sentiment || r.raw_payload.Sentiment)) || '';
          var sentIcon = sentiment ? (sentiment.toLowerCase().indexOf('positive') >= 0 ? '&#128522;' : sentiment.toLowerCase().indexOf('negative') >= 0 ? '&#128542;' : '&#128528;') : '';
          var project = (r.raw_payload && (r.raw_payload.project || r.raw_payload.Project)) || '--';
          var bhk = (r.raw_payload && (r.raw_payload.bhk || r.raw_payload.BHK)) || '--';
          var siteVisit = (r.raw_payload && (r.raw_payload.site_visit || r.raw_payload.SiteVisit)) || '--';

          rowsHtml += '<tr class="vr-row" onclick="Tak2aiDashboard._voiceOpenReport(\'' + r.id + '\')">' +
            '<td class="vr-idx">' + idx + '</td>' +
            '<td class="vr-date">' + date + '</td>' +
            '<td class="vr-name">' + callerName + '</td>' +
            '<td class="vr-mobile">' + caller + '</td>' +
            '<td class="vr-project">' + project + '</td>' +
            '<td class="vr-bhk">' + bhk + '</td>' +
            '<td class="vr-status"><span class="badge ' + statusClass + '">' + (r.status || 'unknown') + '</span></td>' +
            '<td class="vr-sentiment">' + sentIcon + '</td>' +
            '<td class="vr-visit">' + siteVisit + '</td>' +
            '</tr>';
        }
      } else {
        rowsHtml = '<tr><td colspan="9" class="dash-empty" style="padding:40px;text-align:center">No reports yet. Make a call from your Omnidim agent.</td></tr>';
      }

      var totalPages = Math.ceil((pagination.total || 0) / self._voiceLimit);
      var pageHtml = '';
      if (totalPages > 1) {
        pageHtml += '<button class="vr-page-btn" onclick="Tak2aiDashboard._voiceGoPage(' + (self._voicePage - 1) + ')"' + (self._voicePage <= 0 ? ' disabled' : '') + '>&#9664;</button>';
        var startP = Math.max(0, self._voicePage - 2);
        var endP = Math.min(totalPages - 1, self._voicePage + 2);
        for (var pi = startP; pi <= endP; pi++) {
          pageHtml += '<button class="vr-page-btn' + (pi === self._voicePage ? ' active' : '') + '" onclick="Tak2aiDashboard._voiceGoPage(' + pi + ')">' + (pi + 1) + '</button>';
        }
        pageHtml += '<button class="vr-page-btn" onclick="Tak2aiDashboard._voiceGoPage(' + (self._voicePage + 1) + ')"' + (self._voicePage >= totalPages - 1 ? ' disabled' : '') + '>&#9654;</button>';
      }

      function fmtDur(s) {
        return s >= 60 ? Math.floor(s / 60) + 'm ' + (s % 60) + 's' : s + 's';
      }

      body.innerHTML =
        '<div class="dash-section"><div class="dash-card wh-setup" style="margin-bottom:24px">' + localWarning +
        '<div class="wh-setup-header"><i data-lucide="webhook" style="width:20px;height:20px;color:var(--primary)"></i> <span>Omnidim Webhook</span></div>' +
        '<div class="wh-url-wrap"><input type="text" class="wh-url-input" id="whUrl" value="' + whUrl + '"' + (isLocal ? '' : ' readonly') + '><button class="btn btn-sm btn-primary" id="whCopyBtn" onclick="var i=document.getElementById(\'whUrl\');i.select();navigator.clipboard.writeText(i.value);this.textContent=\'Copied!\';setTimeout(function(){document.getElementById(\'whCopyBtn\').textContent=\'Copy\'},2000)">Copy</button></div></div></div>' +

        '<div class="vr-filters"><div class="vr-filter-group"><label>From</label><input type="date" class="vr-filter-input" id="vrFrom" value="' + self._voiceFrom + '"></div>' +
        '<div class="vr-filter-group"><label>To</label><input type="date" class="vr-filter-input" id="vrTo" value="' + self._voiceTo + '"></div>' +
        '<div class="vr-filter-group"><label>Status</label><select class="vr-filter-input" id="vrStatus">' + statusHtml + '</select></div>' +
        '<div class="vr-filter-group vr-filter-search"><label>Search</label><input type="text" class="vr-filter-input" id="vrSearch" placeholder="Name or number..." value="' + self._voiceSearch.replace(/"/g, '&quot;') + '"></div>' +
        '<div class="vr-filter-actions"><button class="btn btn-sm btn-primary" onclick="Tak2aiDashboard._voiceApplyFilters()"><i data-lucide="filter" style="width:14px;height:14px"></i> Apply</button>' +
        '<button class="btn btn-sm btn-secondary" onclick="Tak2aiDashboard._voiceResetFilters()">Reset</button>' +
        '<button class="btn btn-sm btn-secondary" onclick="Tak2aiDashboard._voiceExportCSV()"><i data-lucide="download" style="width:14px;height:14px"></i> Export CSV</button></div></div>' +

        '<div class="vr-metrics"><div class="vr-metric"><span class="vr-metric-value">' + total + '</span><span class="vr-metric-label">Total Calls</span></div>' +
        '<div class="vr-metric vr-metric-green"><span class="vr-metric-value">' + completed + '</span><span class="vr-metric-label">Completed</span></div>' +
        '<div class="vr-metric vr-metric-orange"><span class="vr-metric-value">' + noAnswer + '</span><span class="vr-metric-label">No Answer</span></div>' +
        '<div class="vr-metric vr-metric-red"><span class="vr-metric-value">' + failed + '</span><span class="vr-metric-label">Failed</span></div>' +
        '<div class="vr-metric vr-metric-purple"><span class="vr-metric-value">' + fmtDur(avgDur) + '</span><span class="vr-metric-label">Avg Duration</span></div>' +
        '<div class="vr-metric vr-metric-cyan"><span class="vr-metric-value">' + totalMin + '</span><span class="vr-metric-label">Total Minutes</span></div></div>' +

        '<div class="dash-section"><div class="dash-section-title" style="display:flex;align-items:center;gap:12px"><span>Call Log</span>' +
        '<span style="font-size:.8rem;font-weight:400;color:var(--text-tertiary)">' + (pagination.total || 0) + ' records</span></div>' +
        '<div class="vr-table-wrap"><table class="vr-table"><thead><tr>' +
        '<th>#</th><th>Date</th><th>Name</th><th>Mobile</th><th>Project</th><th>BHK</th><th>Status</th><th>Sentiment</th><th>Site Visit</th>' +
        '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div>' +
        '<div class="vr-pagination"><div class="vr-rows-per-page">Rows per page: ' +
        '<select onchange="Tak2aiDashboard._voiceChangeLimit(this.value)">' +
        '<option value="10"' + (self._voiceLimit === 10 ? ' selected' : '') + '>10</option>' +
        '<option value="20"' + (self._voiceLimit === 20 ? ' selected' : '') + '>20</option>' +
        '<option value="50"' + (self._voiceLimit === 50 ? ' selected' : '') + '>50</option>' +
        '<option value="100"' + (self._voiceLimit === 100 ? ' selected' : '') + '>100</option>' +
        '</select></div><div class="vr-page-nav">' + pageHtml + '</div></div></div>' +

        '<div id="vrDetailModal" class="vr-modal" style="display:none"><div class="vr-modal-bg" onclick="Tak2aiDashboard._voiceCloseReport()"></div><div class="vr-modal-content" id="vrDetailContent"></div></div>';

      if (window.lucide) lucide.createIcons();
      var whInput = document.getElementById('whUrl');
      if (whInput) {
        whInput.addEventListener('input', function () {
          var url = whInput.value.split('?token=')[0];
          localStorage.setItem('tak2ai_public_url', url);
          self._voicePublicUrl = url;
        });
      }
    }).catch(function () {
      body.innerHTML = '<div class="dash-loading"><p style="color:var(--danger)">Failed to load reports.</p></div>';
    });
  },

  _voiceApplyFilters: function () {
    this._voiceFrom = document.getElementById('vrFrom') ? document.getElementById('vrFrom').value : '';
    this._voiceTo = document.getElementById('vrTo') ? document.getElementById('vrTo').value : '';
    this._voiceStatus = document.getElementById('vrStatus') ? document.getElementById('vrStatus').value : '';
    this._voiceSearch = document.getElementById('vrSearch') ? document.getElementById('vrSearch').value : '';
    this._voicePage = 0;
    this._voiceLoadPage();
  },

  _voiceResetFilters: function () {
    this._voiceFrom = '';
    this._voiceTo = '';
    this._voiceStatus = '';
    this._voiceSearch = '';
    this._voicePage = 0;
    this._voiceLoadPage();
  },

  _voiceChangeLimit: function (val) {
    this._voiceLimit = parseInt(val);
    this._voicePage = 0;
    this._voiceLoadPage();
  },

  _voiceGoPage: function (page) {
    if (page < 0) return;
    this._voicePage = page;
    this._voiceLoadPage();
  },

  _voiceOpenReport: function (id) {
    var self = this;
    fetch('/api/voice/reports?limit=1&offset=0&search=' + id).then(function (r) { return r.json(); }).then(function (data) {
      if (!data.success || !data.data.length) return;
      var r = data.data[0];
      var dur = r.duration_seconds ? (r.duration_seconds >= 60 ? Math.floor(r.duration_seconds / 60) + 'm ' + (r.duration_seconds % 60) + 's' : r.duration_seconds + 's') : '--';
      var date = new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      var statusClass = (r.status === 'completed' || r.status === 'answered') ? 'badge-success' : (r.status === 'failed' ? 'badge-danger' : 'badge-default');
      var transcript = r.transcript || (r.raw_payload && r.raw_payload.transcript) || 'No transcript available';
      var recording = r.recording_url || (r.raw_payload && r.raw_payload.recording_url) || '';
      var summary = r.summary || (r.raw_payload && r.raw_payload.summary) || '';
      var rawJson = JSON.stringify(r.raw_payload || {}, null, 2);

      var content = '<button class="vr-modal-close" onclick="Tak2aiDashboard._voiceCloseReport()">&times;</button>' +
        '<h3 style="margin-top:0;font-size:1.2rem">Call Details</h3>' +
        '<div class="vr-detail-grid"><div><strong>Date</strong><span>' + date + '</span></div>' +
        '<div><strong>Caller</strong><span>' + (r.caller_number || '--') + '</span></div>' +
        '<div><strong>Agent</strong><span>' + (r.agent_name || '--') + '</span></div>' +
        '<div><strong>Duration</strong><span>' + dur + '</span></div>' +
        '<div><strong>Status</strong><span><span class="badge ' + statusClass + '">' + (r.status || 'unknown') + '</span></span></div>' +
        (recording ? '<div><strong>Recording</strong><span><a href="' + recording + '" target="_blank" rel="noopener">Listen</a></span></div>' : '') +
        '</div>' +
        (summary ? '<div class="vr-detail-section"><h4>Summary</h4><p>' + summary + '</p></div>' : '') +
        '<div class="vr-detail-section"><h4>Transcript</h4><div class="vr-transcript">' + transcript.replace(/\n/g, '<br>') + '</div></div>' +
        '<div class="vr-detail-section"><h4>Raw Data</h4><pre class="vr-raw">' + rawJson + '</pre></div>';

      document.getElementById('vrDetailContent').innerHTML = content;
      document.getElementById('vrDetailModal').style.display = 'flex';
    });
  },

  _voiceCloseReport: function () {
    var m = document.getElementById('vrDetailModal');
    if (m) m.style.display = 'none';
  },

  _voiceExportCSV: function () {
    var self = this;
    fetch('/api/voice/reports?limit=10000&offset=0').then(function (r) { return r.json(); }).then(function (data) {
      if (!data.success) return;
      var reports = data.data;
      var csv = '#,Date,Name,Mobile,Project,BHK,Status,Sentiment,Site Visit,Duration (s),Agent\n';
      reports.forEach(function (r, i) {
        var name = (r.raw_payload && (r.raw_payload.name || r.raw_payload.Name || r.raw_payload.caller_name)) || '';
        var project = (r.raw_payload && (r.raw_payload.project || r.raw_payload.Project)) || '';
        var bhk = (r.raw_payload && (r.raw_payload.bhk || r.raw_payload.BHK)) || '';
        var sentiment = (r.raw_payload && (r.raw_payload.sentiment || r.raw_payload.Sentiment)) || '';
        var visit = (r.raw_payload && (r.raw_payload.site_visit || r.raw_payload.SiteVisit)) || '';
        var date = new Date(r.created_at).toISOString();
        csv += (i + 1) + ',"' + date + '","' + name + '","' + (r.caller_number || '') + '","' + project + '","' + bhk + '","' + (r.status || '') + '","' + sentiment + '","' + visit + '","' + (r.duration_seconds || '') + '","' + (r.agent_name || '') + '"\n';
      });
      var blob = new Blob([csv], { type: 'text/csv' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'omnidim-reports-' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
    });
  },

  renderSettings: function () {
    var body = document.getElementById('dashBody');
    if (!body) return;
    body.classList.remove('dash-body-chat');
    var self = this;
    var userNameEl = document.getElementById('dashUserName');
    var userEmailEl = document.getElementById('dashUserEmail');
    var userName = userNameEl ? userNameEl.textContent : '';
    var userEmail = userEmailEl ? userEmailEl.textContent : '';
    body.innerHTML =
      '<div class="settings-grid">' +
        '<div class="settings-col">' +
          '<div class="dash-section"><h3 class="dash-section-title">Profile Settings</h3>' +
          '<div class="dash-card"><form id="profileForm" class="dash-form">' +
            '<div class="form-group"><label for="profileName">Full Name</label><input type="text" id="profileName" class="form-input" value="' + userName.replace(/"/g, '&quot;') + '" required></div>' +
            '<div class="form-group"><label for="profileEmail">Email</label><input type="email" id="profileEmail" class="form-input" value="' + userEmail.replace(/"/g, '&quot;') + '" disabled style="opacity:0.6"></div>' +
            '<div class="form-group"><label for="profilePhone">Phone</label><input type="tel" id="profilePhone" class="form-input" placeholder="+91 98765 43210"></div>' +
            '<div class="form-group"><label for="profileCompany">Company</label><input type="text" id="profileCompany" class="form-input" placeholder="Your Business Name"></div>' +
            '<button type="submit" class="btn btn-primary" id="profileSaveBtn"><span class="btn-text">Save Changes</span><span class="btn-loader" style="display:none"><i data-lucide="loader-2" class="spin" style="width:16px;height:16px"></i></span></button>' +
            '<div id="profileMsg" style="margin-top:12px;display:none;"></div>' +
          '</form></div></div>' +
          '<div class="dash-section"><h3 class="dash-section-title">Logo / Avatar</h3>' +
          '<div class="dash-card"><div class="dash-logo-upload">' +
            '<div class="dash-logo-preview" id="logoPreview"><img src="/assets/default-avatar.png" alt="Logo" id="logoImg"></div>' +
            '<div class="dash-logo-upload-form"><p>Upload your company logo or profile picture (max 5MB)</p>' +
            '<input type="file" id="logoInput" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none">' +
            '<div style="display:flex;gap:8px;margin-top:8px">' +
            '<button class="btn btn-secondary" id="logoChooseBtn"><i data-lucide="image" style="width:16px;height:16px"></i> Choose Image</button>' +
            '<button class="btn btn-primary" id="logoUploadBtn" disabled><span class="btn-text"><i data-lucide="upload" style="width:16px;height:16px"></i> Upload</span><span class="btn-loader" style="display:none"><i data-lucide="loader-2" class="spin" style="width:16px;height:16px"></i></span></button>' +
            '</div></div></div></div></div>' +
        '</div>' +
        '<div class="settings-col">' +
          '<div class="dash-section"><h3 class="dash-section-title">Recharge</h3>' +
          '<div class="dash-card" id="rechargeCard">' +
            '<div class="recharge-balance">' +
              '<div class="recharge-balance-label">Current Balance</div>' +
              '<div class="recharge-balance-amount" id="rechargeBalance">₹0.00</div>' +
            '</div>' +
            '<div class="recharge-form">' +
              '<label class="form-label">Select Amount</label>' +
              '<div class="recharge-plans">' +
                '<button class="recharge-plan" data-amount="3499">₹3,499</button>' +
                '<button class="recharge-plan active" data-amount="6499">₹6,499</button>' +
                '<button class="recharge-plan" data-amount="11499">₹11,499</button>' +
                '<button class="recharge-plan" data-amount="25499">₹25,499</button>' +
              '</div>' +
              '<button class="btn btn-primary" id="rechargeBtn" style="width:100%"><i data-lucide="wallet" style="width:16px;height:16px"></i> Proceed to Pay</button>' +
              '<div id="rechargeMsg" style="margin-top:10px;display:none;"></div>' +
            '</div>' +
            '<div class="recharge-info">' +
              '<p><i data-lucide="info" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"></i> Add funds to your account. Razorpay integration coming soon.</p>' +
            '</div>' +
          '</div></div>' +
        '</div>' +
      '</div>';
    if (window.lucide) lucide.createIcons();
    fetch('/api/profile').then(function (r) { return r.json(); }).then(function (data) {
      if (!data.success) return;
      var p = data.data;
      var nameInput = document.getElementById('profileName');
      var phoneInput = document.getElementById('profilePhone');
      var companyInput = document.getElementById('profileCompany');
      if (nameInput && p.name) nameInput.value = p.name;
      if (phoneInput && p.phone) phoneInput.value = p.phone;
      if (companyInput && p.company_name) companyInput.value = p.company_name;
    });
    var form = document.getElementById('profileForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = document.getElementById('profileSaveBtn');
        var msg = document.getElementById('profileMsg');
        if (!btn || !msg) return;
        var textEl = btn.querySelector('.btn-text');
        var loaderEl = btn.querySelector('.btn-loader');
        if (textEl) textEl.style.display = 'none';
        if (loaderEl) loaderEl.style.display = 'inline-flex';
        btn.disabled = true;
        msg.style.display = 'none';
        var name = document.getElementById('profileName') ? document.getElementById('profileName').value : '';
        var phone = document.getElementById('profilePhone') ? document.getElementById('profilePhone').value : '';
        var company = document.getElementById('profileCompany') ? document.getElementById('profileCompany').value : '';
        fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, phone: phone, company: company })
        }).then(function (r) { return r.json(); }).then(function (d) {
          if (d.success) {
            msg.style.display = 'block';
            msg.style.color = 'var(--success, #25D366)';
            msg.textContent = 'Profile updated successfully.';
            var ue = document.getElementById('dashUserName');
            if (ue) ue.textContent = name;
          } else {
            msg.style.display = 'block';
            msg.style.color = '#ef4444';
            msg.textContent = d.error || 'Failed to update profile.';
          }
        }).catch(function () {
          msg.style.display = 'block';
          msg.style.color = '#ef4444';
          msg.textContent = 'Something went wrong.';
        }).finally(function () {
          if (textEl) textEl.style.display = 'inline';
          if (loaderEl) loaderEl.style.display = 'none';
          btn.disabled = false;
        });
      });
    }
    fetch('/api/profile').then(function (r) { return r.json(); }).then(function (data) {
      if (!data.success) return;
      var p = data.data;
      var logoImg = document.getElementById('logoImg');
      if (logoImg && p.avatar_url) logoImg.src = p.avatar_url;
      var preview = document.getElementById('logoPreview');
      if (preview) preview.style.display = 'flex';
    });
    var chooseBtn = document.getElementById('logoChooseBtn');
    var fileInput = document.getElementById('logoInput');
    var uploadBtn = document.getElementById('logoUploadBtn');
    if (chooseBtn && fileInput) {
      chooseBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          var reader = new FileReader();
          reader.onload = function (e) { var img = document.getElementById('logoImg'); if (img) img.src = e.target.result; };
          reader.readAsDataURL(this.files[0]);
          if (uploadBtn) uploadBtn.disabled = false;
        }
      });
    }
    if (uploadBtn) {
      uploadBtn.addEventListener('click', function () {
        var file = fileInput && fileInput.files ? fileInput.files[0] : null;
        if (!file) return;
        var textEl = uploadBtn.querySelector('.btn-text');
        var loaderEl = uploadBtn.querySelector('.btn-loader');
        if (textEl) textEl.style.display = 'none';
        if (loaderEl) loaderEl.style.display = 'inline-flex';
        uploadBtn.disabled = true;
        var fd = new FormData();
        fd.append('logo', file);
        fetch('/api/profile/upload-avatar', {
          method: 'POST',
          body: fd
        }).then(function (r) { return r.json(); }).then(function (d) {
          if (d.success && d.data && d.data.url) {
            var dashAvatar = document.getElementById('dashAvatar');
            if (dashAvatar) dashAvatar.src = d.data.url;
            var msg = document.getElementById('profileMsg');
            if (msg) { msg.style.display = 'block'; msg.style.color = 'var(--success, #25D366)'; msg.textContent = 'Logo uploaded successfully.'; }
          } else {
            var msg = document.getElementById('profileMsg');
            if (msg) { msg.style.display = 'block'; msg.style.color = '#ef4444'; msg.textContent = d.error || 'Upload failed.'; }
          }
        }).catch(function () {
          var msg = document.getElementById('profileMsg');
          if (msg) { msg.style.display = 'block'; msg.style.color = '#ef4444'; msg.textContent = 'Upload failed.'; }
        }).finally(function () {
          if (textEl) textEl.style.display = 'inline-flex';
          if (loaderEl) loaderEl.style.display = 'none';
          uploadBtn.disabled = false;
        });
      });
    }
    document.querySelectorAll('.recharge-plan').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.recharge-plan').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
      });
    });
  },

  renderCallReports: function () {
    var body = document.getElementById('dashBody');
    if (!body) return;
    body.classList.remove('dash-body-chat');
    var self = this;
    body.innerHTML = '<div class="dash-loading" style="min-height:40vh"><div class="spinner"></div><p>Loading call reports...</p></div>';
    fetch('/api/call-reports?_t=' + Date.now()).then(function (r) { return r.json(); }).then(function (data) {
      if (!data.success) { body.innerHTML = '<div class="dash-empty" style="padding:60px"><div class="dash-empty-icon"><i data-lucide="phone-call"></i></div><div class="dash-empty-title">Failed to load</div><div class="dash-empty-desc">' + (data.error || 'Could not fetch call reports.') + '</div></div>'; if (window.lucide) lucide.createIcons(); return; }
      self._calls = data.data || [];
      var calls = self._calls;
      var total = calls.length;
      var positive = 0, siteVisits = 0, totalSec = 0;
      calls.forEach(function (c) {
        if (c.sentiment === 'Positive') positive++;
        if (c.site_visit_interest && c.site_visit_interest.toLowerCase() === 'yes') siteVisits++;
        var mins = parseInt(parseFloat(c.call_duration_in_minutes)) || 0;
        var sField = c.call_duration_in_seconds;
        var secs;
        if (sField && parseFloat(sField) !== 0) {
          secs = parseInt(parseFloat(sField)) || 0;
        } else {
          secs = Math.round((parseFloat(c.call_duration_in_minutes) - mins) * 60) || 0;
        }
        if (secs > 30) { mins++; secs = 0; }
        totalSec += mins * 60 + secs;
      });
      var durDisplay = '';
      if (totalSec >= 3600) {
        var h = Math.floor(totalSec / 3600);
        var m = Math.floor((totalSec % 3600) / 60);
        durDisplay = h + 'h ' + m + 'm';
      } else if (totalSec >= 60) {
        durDisplay = Math.floor(totalSec / 60) + 'm ' + (totalSec % 60) + 's';
      } else {
        durDisplay = totalSec + 's';
      }
      var cardsHtml = '';
      calls.forEach(function (c, i) {
        var name = c.customer_name || 'Unknown';
        var phone = c.customer_mobile || '—';
        var loc = c.customer_location || '—';
        var project = c.interested_project || '—';
        var bhk = c.bhk_type || '—';
        var budget = c.budget || '—';
        var sentiment = c.sentiment || '—';
        var status = c.call_status || '—';
        var minsVal = c.call_duration_in_minutes;
        var secsVal = c.call_duration_in_seconds;
        var hasMin = minsVal !== undefined && minsVal !== null && minsVal !== '';
        var hasSec = secsVal !== undefined && secsVal !== null && secsVal !== '';
        var duration = hasMin || hasSec ? (function(m, s){ var mins=parseInt(parseFloat(m))||0; var secs; if (s && parseFloat(s)!==0) { secs=parseInt(parseFloat(s))||0; } else { secs=Math.round((parseFloat(m)-Math.floor(parseFloat(m)))*60)||0; } if (secs>30){mins++;secs=0;} return mins+'m '+secs+'s'; })(minsVal, secsVal) : '—';
        var date = c.call_date ? new Date(c.call_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
        var summary = c.summary || '';
        var sentimentBadge = sentiment === 'Positive' ? 'badge-success' : sentiment === 'Negative' ? 'badge-danger' : 'badge-warning';
        cardsHtml +=
          '<div class="cr-card" data-index="' + i + '" data-name="' + (name.toLowerCase()) + '" data-phone="' + phone + '" data-project="' + (project.toLowerCase()) + '">' +
            '<div class="cr-card-header">' +
              '<div class="cr-card-user"><div class="cr-avatar">' + (name !== 'Unknown' ? name.charAt(0).toUpperCase() : '?') + '</div><div><div class="cr-name">' + name + '</div><div class="cr-phone">' + phone + '</div></div></div>' +
              '<span class="badge ' + sentimentBadge + '">' + sentiment + '</span>' +
            '</div>' +
            '<div class="cr-card-body">' +
              '<div class="cr-grid"><div class="cr-field"><span class="cr-label">Location</span><span class="cr-value">' + loc + '</span></div>' +
              '<div class="cr-field"><span class="cr-label">Project</span><span class="cr-value">' + project + '</span></div>' +
              '<div class="cr-field"><span class="cr-label">BHK</span><span class="cr-value">' + bhk + '</span></div>' +
              '<div class="cr-field"><span class="cr-label">Budget</span><span class="cr-value">' + budget + '</span></div>' +
              '<div class="cr-field"><span class="cr-label">Duration</span><span class="cr-value">' + duration + '</span></div>' +
              '<div class="cr-field"><span class="cr-label">Date</span><span class="cr-value">' + date + '</span></div>' +
              (c.site_visit_interest ? '<div class="cr-field"><span class="cr-label">Site Visit</span><span class="cr-value">' + c.site_visit_interest + (c.site_visit_date ? ' (' + c.site_visit_date + ')' : '') + '</span></div>' : '') +
              (c.whatsapp_number ? '<div class="cr-field"><span class="cr-label">WhatsApp</span><span class="cr-value">' + c.whatsapp_number + '</span></div>' : '') +
              '</div>' +
              (summary ? '<div class="cr-summary">' + summary + '</div>' : '') +
            '</div>' +
          '</div>';
      });
      body.innerHTML =
        '<div class="cr-page">' +
          '<div class="cr-header"><div><h3 class="dash-section-title" style="margin:0">Call Reports</h3><p class="cr-subtitle">' + total + ' total calls</p></div><div style="display:flex;gap:8px;align-items:center"><span class="cr-live-dot" id="crLiveDot"></span><span style="font-size:.75rem;color:var(--text-tertiary)" id="crLiveLabel">Live</span><button class="btn btn-sm btn-ghost" onclick="Tak2aiDashboard.refreshCallReports()" style="padding:6px 12px;font-size:.8rem" title="Refresh"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i> Refresh</button></div></div>' +
          '<div class="cr-stats">' +
            '<div class="cr-stat"><div class="cr-stat-icon" style="background:rgba(0,229,255,0.1);color:#00E5FF"><i data-lucide="phone" style="width:22px;height:22px"></i></div><div class="cr-stat-info"><span class="cr-stat-value">' + total + '</span><span class="cr-stat-label">Total Calls</span></div></div>' +
            '<div class="cr-stat"><div class="cr-stat-icon" style="background:rgba(37,211,102,0.1);color:#25D366"><i data-lucide="thumbs-up" style="width:22px;height:22px"></i></div><div class="cr-stat-info"><span class="cr-stat-value">' + positive + '</span><span class="cr-stat-label">Positive</span></div></div>' +
            '<div class="cr-stat"><div class="cr-stat-icon" style="background:rgba(167,139,250,0.1);color:#A78BFA"><i data-lucide="calendar-check" style="width:22px;height:22px"></i></div><div class="cr-stat-info"><span class="cr-stat-value">' + siteVisits + '</span><span class="cr-stat-label">Site Visits</span></div></div>' +
            '<div class="cr-stat"><div class="cr-stat-icon" style="background:rgba(234,179,8,0.1);color:#eab308"><i data-lucide="clock" style="width:22px;height:22px"></i></div><div class="cr-stat-info"><span class="cr-stat-value">' + durDisplay + '</span><span class="cr-stat-label">Total Talk Time</span></div></div>' +
          '</div>' +
          '<div class="cr-toolbar"><input type="text" class="cr-search" id="crSearch" placeholder="Search by name, phone, or project..."><span class="cr-count">' + total + ' calls</span></div>' +
          '<div class="cr-list" id="crList">' + cardsHtml + '</div>' +
        '</div>' +
        '<div class="cr-modal" id="crModal"><div class="cr-modal-bg"></div><div class="cr-modal-content"><div class="cr-modal-close">&times;</div><div id="crModalBody"></div></div></div>';
      if (window.lucide) lucide.createIcons();
      document.querySelectorAll('.cr-card').forEach(function (el) {
        el.addEventListener('click', function () {
          var idx = parseInt(this.getAttribute('data-index'));
          self.showCallDetail(idx);
        });
      });
      var searchInput = document.getElementById('crSearch');
      if (searchInput) {
        searchInput.addEventListener('input', function () {
          var q = this.value.toLowerCase().trim();
          document.querySelectorAll('.cr-card').forEach(function (el) {
            var match = el.getAttribute('data-name').includes(q) || el.getAttribute('data-phone').includes(q) || el.getAttribute('data-project').includes(q);
            el.style.display = match ? 'block' : 'none';
          });
          var visible = document.querySelectorAll('.cr-card[style*="display: block"], .cr-card:not([style*="display"])').length;
          var countEl = document.querySelector('.cr-count');
          if (countEl) countEl.textContent = visible + ' calls';
        });
      }
      document.getElementById('crModal').addEventListener('click', function (e) {
        if (e.target === this || e.target.classList.contains('cr-modal-close') || e.target.closest('.cr-modal-close')) {
          self.closeCallDetail();
        }
      });
      document.addEventListener('keydown', function cls(e) {
        if (e.key === 'Escape') { self.closeCallDetail(); document.removeEventListener('keydown', cls); }
      });
      self._startCallReportsPolling();
    }).catch(function () {
      body.innerHTML = '<div class="dash-empty" style="padding:60px">Failed to load call reports.</div>';
    });
  },

  refreshCallReports: function () {
    this._stopCallReportsPolling();
    this.renderCallReports();
  },

  _startCallReportsPolling: function () {
    this._stopCallReportsPolling();
    var self = this;
    var dot = document.getElementById('crLiveDot');
    var label = document.getElementById('crLiveLabel');
    this._crPollCount = 0;
    this._crInterval = setInterval(function () {
      self._crPollCount++;
      if (dot) dot.style.animation = 'none'; void dot.offsetWidth; dot.style.animation = '';
      if (label) label.textContent = 'Updating\u2026';
      fetch('/api/call-reports?_t=' + Date.now()).then(function (r) { return r.json(); }).then(function (data) {
        if (!data.success) return;
        self._calls = data.data || [];
        var total = self._calls.length;
        var statEls = document.querySelectorAll('.cr-stat-value');
        if (statEls[0]) statEls[0].textContent = total;
        var countEl = document.querySelector('.cr-count');
        if (countEl) countEl.textContent = total + ' calls';
        var subtitle = document.querySelector('.cr-subtitle');
        if (subtitle) subtitle.textContent = total + ' total calls';
        if (label) label.textContent = 'Live';
        self._rebuildCallCards();
      }).catch(function () {
        if (label) label.textContent = 'Live';
      });
    }, 30000);
  },

  _stopCallReportsPolling: function () {
    if (this._crInterval) {
      clearInterval(this._crInterval);
      this._crInterval = null;
    }
  },

  _rebuildCallCards: function () {
    var list = document.getElementById('crList');
    if (!list) return;
    var calls = this._calls || [];
    var cardsHtml = '';
    calls.forEach(function (c, i) {
      var name = c.customer_name || 'Unknown';
      var phone = c.customer_mobile || '\u2014';
      var project = c.interested_project || '\u2014';
      var sentiment = c.sentiment || '\u2014';
      var sentimentBadge = sentiment === 'Positive' ? 'badge-success' : sentiment === 'Negative' ? 'badge-danger' : 'badge-warning';
      cardsHtml +=
        '<div class="cr-card" data-index="' + i + '" data-name="' + (name.toLowerCase()) + '" data-phone="' + phone + '" data-project="' + (project.toLowerCase()) + '">' +
          '<div class="cr-card-header">' +
            '<div class="cr-card-user"><div class="cr-avatar">' + (name !== 'Unknown' ? name.charAt(0).toUpperCase() : '?') + '</div><div><div class="cr-name">' + name + '</div><div class="cr-phone">' + phone + '</div></div></div>' +
            '<span class="badge ' + sentimentBadge + '">' + sentiment + '</span>' +
          '</div>' +
          '<div class="cr-card-body">' +
            '<div class="cr-grid"><div class="cr-field"><span class="cr-label">Project</span><span class="cr-value">' + project + '</span></div></div>' +
          '</div>' +
        '</div>';
    });
    list.innerHTML = cardsHtml || '<div class="dash-empty" style="padding:40px">No calls found.</div>';
    document.querySelectorAll('.cr-card').forEach(function (el) {
      el.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-index'));
        Tak2aiDashboard.showCallDetail(idx);
      });
    });
    var q = document.getElementById('crSearch');
    if (q && q.value) {
      var evt = document.createEvent('Event');
      evt.initEvent('input', true, true);
      q.dispatchEvent(evt);
    }
  },

  showCallDetail: function (index) {
    var c = this._calls[index];
    if (!c) return;
    var modal = document.getElementById('crModal');
    var body = document.getElementById('crModalBody');
    if (!modal || !body) return;
    var name = c.customer_name || 'Unknown';
    var phone = c.customer_mobile || '—';
    var loc = c.customer_location || '—';
    var project = c.interested_project || '—';
    var bhk = c.bhk_type || '—';
    var budget = c.budget || '—';
    var sentiment = c.sentiment || '—';
    var status = c.call_status || '—';
    var minsVal = c.call_duration_in_minutes;
    var secsVal = c.call_duration_in_seconds;
    var hasMin = minsVal !== undefined && minsVal !== null && minsVal !== '';
    var hasSec = secsVal !== undefined && secsVal !== null && secsVal !== '';
    var duration = hasMin || hasSec ? (function(m, s){ var mins=parseInt(parseFloat(m))||0; var secs; if (s && parseFloat(s)!==0) { secs=parseInt(parseFloat(s))||0; } else { secs=Math.round((parseFloat(m)-Math.floor(parseFloat(m)))*60)||0; } if (secs>30){mins++;secs=0;} return mins+'m '+secs+'s'; })(minsVal, secsVal) : '—';
    var date = c.call_date ? new Date(c.call_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    var sentimentBadge = sentiment === 'Positive' ? 'badge-success' : sentiment === 'Negative' ? 'badge-danger' : 'badge-warning';
    var conversation = c.full_conversation || '';
    var summary = c.summary || '';
    var recording = c.recording_url || '';
    var notes = c.notes || '';
    var callId = c.call_id || '—';
    var botName = c.bot_name || '—';
    var direction = c.call_direction || '—';
    var leadScore = c.lead_score || '—';
    var familySize = c.family_size || '—';
    var email = c.email_address || '—';
    var propertyType = c.property_type || '—';
    var subBhk = c.sub_bhk || '—';
    var requirementType = c.requirement_type || '—';
    var additionalReqs = c.additional_requirements || '—';
    var projectType = c.interested_in_project_type || '—';
    var preferredTime = c.preferred_contact_time || '—';
    var purchasePurpose = c.purchase_purpose || '—';
    var purchaseTimeline = c.purchase_timeline || '—';
    var transferStatus = c.call_transfered_status || '—';

    body.innerHTML =
      '<div class="cr-detail-header">' +
        '<div class="cr-detail-user"><div class="cr-detail-avatar">' + (name !== 'Unknown' ? name.charAt(0).toUpperCase() : '?') + '</div><div><div class="cr-detail-name">' + name + '</div><div class="cr-detail-phone">' + phone + '</div></div></div>' +
        '<span class="badge ' + sentimentBadge + '">' + sentiment + '</span>' +
      '</div>' +
      (recording ? '<div class="cr-player"><audio id="crAudio" controls preload="metadata" style="width:100%"><source src="' + recording + '" type="audio/mpeg">Your browser does not support audio.</audio><div class="cr-player-actions"><button class="btn btn-sm btn-secondary" id="crPlayBtn"><i data-lucide="play" style="width:14px;height:14px"></i> Play</button><button class="btn btn-sm btn-secondary" id="crPauseBtn"><i data-lucide="pause" style="width:14px;height:14px"></i> Pause</button><a href="' + recording + '" download class="btn btn-sm btn-primary"><i data-lucide="download" style="width:14px;height:14px"></i> Download</a></div></div>' : '') +
      '<div class="cr-detail-grid">' +
        '<div class="cr-detail-section"><h4>Call Info</h4><div class="cr-detail-fields">' +
          '<div><strong>Call ID</strong><span>' + callId + '</span></div>' +
          '<div><strong>Date</strong><span>' + date + '</span></div>' +
          '<div><strong>Duration</strong><span>' + duration + '</span></div>' +
          '<div><strong>Status</strong><span>' + status + '</span></div>' +
          '<div><strong>Direction</strong><span>' + direction + '</span></div>' +
          '<div><strong>Bot</strong><span>' + botName + '</span></div>' +
          '<div><strong>Transferred</strong><span>' + transferStatus + '</span></div>' +
        '</div></div>' +
        '<div class="cr-detail-section"><h4>Customer</h4><div class="cr-detail-fields">' +
          '<div><strong>Name</strong><span>' + name + '</span></div>' +
          '<div><strong>Phone</strong><span>' + phone + '</span></div>' +
          '<div><strong>Location</strong><span>' + loc + '</span></div>' +
          (email !== '—' ? '<div><strong>Email</strong><span>' + email + '</span></div>' : '') +
          '<div><strong>Family Size</strong><span>' + familySize + '</span></div>' +
        '</div></div>' +
        '<div class="cr-detail-section"><h4>Property Interest</h4><div class="cr-detail-fields">' +
          '<div><strong>Project</strong><span>' + project + '</span></div>' +
          '<div><strong>BHK</strong><span>' + bhk + '</span></div>' +
          '<div><strong>Sub BHK</strong><span>' + subBhk + '</span></div>' +
          '<div><strong>Budget</strong><span>' + budget + '</span></div>' +
          '<div><strong>Property Type</strong><span>' + propertyType + '</span></div>' +
          '<div><strong>Project Type</strong><span>' + projectType + '</span></div>' +
          '<div><strong>Requirement</strong><span>' + requirementType + '</span></div>' +
          '<div><strong>Additional</strong><span>' + additionalReqs + '</span></div>' +
        '</div></div>' +
        '<div class="cr-detail-section"><h4>Lead Info</h4><div class="cr-detail-fields">' +
          '<div><strong>Lead Score</strong><span>' + leadScore + '</span></div>' +
          '<div><strong>Purchase Purpose</strong><span>' + purchasePurpose + '</span></div>' +
          '<div><strong>Purchase Timeline</strong><span>' + purchaseTimeline + '</span></div>' +
          '<div><strong>Preferred Time</strong><span>' + preferredTime + '</span></div>' +
          (c.site_visit_interest ? '<div><strong>Site Visit</strong><span>' + c.site_visit_interest + (c.site_visit_date ? ' (' + c.site_visit_date + ')' : '') + '</span></div>' : '') +
          (c.whatsapp_number ? '<div><strong>WhatsApp</strong><span>' + c.whatsapp_number + '</span></div>' : '') +
        '</div></div>' +
      '</div>' +
      (summary ? '<div class="cr-detail-section"><h4>Summary</h4><p class="cr-detail-text">' + summary + '</p></div>' : '') +
      (notes ? '<div class="cr-detail-section"><h4>Notes</h4><p class="cr-detail-text">' + notes + '</p></div>' : '') +
      (conversation ? '<div class="cr-detail-section"><h4>Full Conversation</h4><div class="cr-conversation">' + conversation.split('|').map(function (line) { return '<div class="cr-msg' + (line.trim().startsWith('Bot:') ? ' cr-msg-bot' : ' cr-msg-user') + '">' + line.trim() + '</div>'; }).join('') + '</div></div>' : '');

    modal.style.display = 'flex';
    if (window.lucide) {
      lucide.createIcons();
    }

    var audio = document.getElementById('crAudio');
    if (audio) {
      var playBtn = document.getElementById('crPlayBtn');
      var pauseBtn = document.getElementById('crPauseBtn');
      if (playBtn) playBtn.addEventListener('click', function () { audio.play(); });
      if (pauseBtn) pauseBtn.addEventListener('click', function () { audio.pause(); });
    }
  },

  closeCallDetail: function () {
    var modal = document.getElementById('crModal');
    if (modal) modal.style.display = 'none';
    var audio = document.getElementById('crAudio');
    if (audio) { audio.pause(); audio.currentTime = 0; }
  }
};

document.addEventListener('DOMContentLoaded', function () { Tak2aiDashboard.init(); });
