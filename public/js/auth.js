var Tak2aiAuth = {
  init: function () {
    var path = window.location.pathname;
    if (path === '/login') this._setupLogin();
    if (path === '/register') this._setupRegister();
    var logoutLinks = document.querySelectorAll('#dashLogout, .nav-user-logout, [href="/api/auth/signout"]');
    logoutLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        Tak2aiAuth.signOut();
      });
    });
  },

  signIn: function (email, password) {
    return fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    }).then(function (r) { return r.json(); });
  },

  signUp: function (data) {
    return fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); });
  },

  signOut: function () {
    fetch('/api/auth/signout', { method: 'POST' }).then(function () {
      window.location.href = '/';
    }).catch(function () {
      window.location.href = '/';
    });
  },

  sendMagicLink: function (email) {
    return fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    }).then(function (r) { return r.json(); });
  },

  resetPassword: function (email) {
    return fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    }).then(function (r) { return r.json(); });
  },

  _setupLogin: function () {
    var form = document.getElementById('loginForm');
    var errorEl = document.getElementById('loginError');
    var btn = document.getElementById('loginBtn');
    var magicBtn = document.getElementById('magicLinkBtn');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorEl) errorEl.style.display = 'none';
      if (btn) {
        var text = btn.querySelector('.btn-text');
        var loader = btn.querySelector('.btn-loader');
        if (text) text.style.display = 'none';
        if (loader) loader.style.display = 'inline-flex';
        btn.disabled = true;
      }
      var fd = new FormData(form);
      Tak2aiAuth.signIn(fd.get('email'), fd.get('password')).then(function (data) {
        if (data.success) {
          window.location.href = data.redirect || '/dashboard';
        } else {
          if (errorEl) {
            errorEl.textContent = data.error || 'Invalid email or password';
            errorEl.style.display = 'block';
          }
          if (btn) {
            var t = btn.querySelector('.btn-text');
            var l = btn.querySelector('.btn-loader');
            if (t) t.style.display = 'inline';
            if (l) l.style.display = 'none';
            btn.disabled = false;
          }
        }
      }).catch(function () {
        if (errorEl) {
          errorEl.textContent = 'Something went wrong. Please try again.';
          errorEl.style.display = 'block';
        }
        if (btn) {
          var t = btn.querySelector('.btn-text');
          var l = btn.querySelector('.btn-loader');
          if (t) t.style.display = 'inline';
          if (l) l.style.display = 'none';
          btn.disabled = false;
        }
      });
    });
    if (magicBtn) {
      magicBtn.addEventListener('click', function () {
        var emailInput = document.getElementById('loginEmail');
        if (!emailInput || !emailInput.value.trim()) {
          if (errorEl) {
            errorEl.textContent = 'Please enter your email first';
            errorEl.style.display = 'block';
          }
          return;
        }
        magicBtn.disabled = true;
        magicBtn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:18px;height:18px"></i> Sending...';
        if (window.lucide) lucide.createIcons();
        Tak2aiAuth.sendMagicLink(emailInput.value.trim()).then(function (data) {
          if (data.success) {
            magicBtn.innerHTML = '<i data-lucide="check" style="width:18px;height:18px"></i> Magic link sent!';
          } else {
            magicBtn.innerHTML = '<i data-lucide="wand-2" style="width:18px;height:18px"></i> Try Again';
            if (errorEl) {
              errorEl.textContent = data.error || 'Failed to send magic link';
              errorEl.style.display = 'block';
            }
          }
          if (window.lucide) lucide.createIcons();
        }).catch(function () {
          magicBtn.innerHTML = '<i data-lucide="wand-2" style="width:18px;height:18px"></i> Try Again';
          if (window.lucide) lucide.createIcons();
        });
      });
    }
  },

  _setupRegister: function () {
    var form = document.getElementById('registerForm');
    var errorEl = document.getElementById('registerError');
    var btn = document.getElementById('registerBtn');
    var pwInput = document.getElementById('regPassword');
    var confirmInput = document.getElementById('regConfirmPassword');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorEl) errorEl.style.display = 'none';
      if (pwInput && confirmInput && pwInput.value !== confirmInput.value) {
        if (errorEl) {
          errorEl.textContent = 'Passwords do not match';
          errorEl.style.display = 'block';
        }
        return;
      }
      if (btn) {
        var text = btn.querySelector('.btn-text');
        var loader = btn.querySelector('.btn-loader');
        if (text) text.style.display = 'none';
        if (loader) loader.style.display = 'inline-flex';
        btn.disabled = true;
      }
      var fd = new FormData(form);
      Tak2aiAuth.signUp({
        name: fd.get('name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        company: fd.get('company'),
        password: fd.get('password')
      }).then(function (data) {
        if (data.success) {
          window.location.href = data.redirect || '/dashboard';
        } else {
          if (errorEl) {
            errorEl.textContent = data.error || 'Registration failed';
            errorEl.style.display = 'block';
          }
          if (btn) {
            var t = btn.querySelector('.btn-text');
            var l = btn.querySelector('.btn-loader');
            if (t) t.style.display = 'inline';
            if (l) l.style.display = 'none';
            btn.disabled = false;
          }
        }
      }).catch(function () {
        if (errorEl) {
          errorEl.textContent = 'Something went wrong. Please try again.';
          errorEl.style.display = 'block';
        }
        if (btn) {
          var t = btn.querySelector('.btn-text');
          var l = btn.querySelector('.btn-loader');
          if (t) t.style.display = 'inline';
          if (l) l.style.display = 'none';
          btn.disabled = false;
        }
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', function () { Tak2aiAuth.init(); });
