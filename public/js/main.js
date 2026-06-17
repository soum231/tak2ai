(function () {
  var supabaseClient = supabase.createClient(
    'https://nxxyxgsebtfuotrcothb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54eHl4Z3NlYnRmdW90cmNvdGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMTgyNDgsImV4cCI6MjA5Njg5NDI0OH0.qwI6FU2rXxoV19gZf7fvjoCwQ86UMTkUqspRveDyIUQ'
  );

  var themeToggle = document.getElementById('themeToggle');
  var themeToggleDrawer = document.getElementById('themeToggleDrawer');
  function toggleTheme() {
    var html = document.documentElement;
    var current = html.getAttribute('data-theme');
    var next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('tak2ai-theme', next);
    var icon = themeToggle ? themeToggle.querySelector('i') : null;
    var iconDrawer = themeToggleDrawer ? themeToggleDrawer.querySelector('i') : null;
    var iconName = next === 'dark' ? 'moon' : 'sun';
    if (icon) icon.setAttribute('data-lucide', iconName);
    if (iconDrawer) iconDrawer.setAttribute('data-lucide', iconName);
    if (window.lucide) lucide.createIcons();
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  if (themeToggleDrawer) {
    themeToggleDrawer.addEventListener('click', toggleTheme);
  }

  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navDrawer = document.getElementById('navDrawer');
  var navDrawerClose = document.getElementById('navDrawerClose');
  var navDrawerOverlay = document.getElementById('navDrawerOverlay');

  function openDrawer() {
    navDrawer.classList.add('open');
    navToggle.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    navDrawer.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (navToggle && navDrawer) {
    navToggle.addEventListener('click', function () {
      if (navDrawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
    if (navDrawerClose) navDrawerClose.addEventListener('click', closeDrawer);
    if (navDrawerOverlay) navDrawerOverlay.addEventListener('click', closeDrawer);
    navDrawer.querySelectorAll('a.nav-link').forEach(function (link) {
      link.addEventListener('click', closeDrawer);
    });
  }

  if (nav) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          nav.classList.toggle('scrolled', window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  document.querySelectorAll('.nav-dd-mobile').forEach(function (dd) {
    var trigger = dd.querySelector('.nav-dd-trigger');
    if (trigger) {
      trigger.addEventListener('click', function () {
        dd.classList.toggle('open');
      });
    }
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.animate-on-scroll').forEach(function (el) { observer.observe(el); });

  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var answer = item.querySelector('.faq-a');
      if (!answer) return;
      var icon = btn.querySelector('.faq-q-icon i');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (o) {
        if (o !== item) {
          o.classList.remove('open');
          var a = o.querySelector('.faq-a');
          var i = o.querySelector('.faq-q-icon i');
          if (a) a.style.maxHeight = null;
          if (i) i.setAttribute('data-lucide', 'plus');
        }
      });
      item.classList.toggle('open');
      if (!isOpen) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        if (icon) icon.setAttribute('data-lucide', 'minus');
      } else {
        answer.style.maxHeight = null;
        if (icon) icon.setAttribute('data-lucide', 'plus');
      }
      if (window.lucide) lucide.createIcons();
    });
  });

  var modal = document.getElementById('getStartedModal');
  var modalClose = document.getElementById('modalClose');
  var modalBtns = document.querySelectorAll('#openGsModalBtn, #openGsModalCta, #openGsModalFloat');
  modalBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (modal) modal.classList.add('open');
    });
  });
  if (modalClose) {
    modalClose.addEventListener('click', function () { modal.classList.remove('open'); });
  }
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

  var leadForm = document.getElementById('leadForm');
  if (leadForm) {
    var leadFormData = null;
    var leadSubmitBtn = leadForm.querySelector('.modal-submit');
    var leadTextEl = leadForm.querySelector('.modal-submit-text');
    var leadLoaderEl = leadForm.querySelector('.modal-submit-loader');
    var otpSection = document.getElementById('otpSection');
    var otpInput = document.getElementById('otpInput');
    var otpVerifyBtn = document.getElementById('otpVerifyBtn');
    var otpError = document.getElementById('otpError');
    var otpPhoneDisplay = document.getElementById('otpPhoneDisplay');
    var otpResend = document.getElementById('otpResend');

    function showOtpError(msg) {
      otpError.textContent = msg;
      otpError.classList.add('open');
    }
    function hideOtpError() {
      otpError.classList.remove('open');
    }
    function sendOtp(phone) {
      hideOtpError();
      otpPhoneDisplay.textContent = phone;
      fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone })
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (data.success) {
          otpSection.classList.add('open');
          otpInput.value = '';
          otpInput.focus();
          if (data.otp) {
            var m = document.createElement('p');
            m.style.cssText = 'font-size:.75rem;color:var(--text-tertiary);margin-top:4px';
            m.textContent = 'Dev mode — OTP: ' + data.otp;
            otpSection.querySelector('p').after(m);
          }
        } else {
          showOtpError(data.error || 'Failed to send OTP');
          if (leadSubmitBtn) { leadSubmitBtn.disabled = false; }
          if (leadTextEl) leadTextEl.style.display = 'inline';
          if (leadLoaderEl) leadLoaderEl.style.display = 'none';
        }
      }).catch(function () {
        showOtpError('Something went wrong');
        if (leadSubmitBtn) { leadSubmitBtn.disabled = false; }
        if (leadTextEl) leadTextEl.style.display = 'inline';
        if (leadLoaderEl) leadLoaderEl.style.display = 'none';
      });
    }
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideOtpError();
      var fd = new FormData(leadForm);
      leadFormData = {
        name: fd.get('name') || fd.get('Name'),
        email: fd.get('email') || fd.get('Email'),
        phone: fd.get('phone') || fd.get('Phone'),
        category: fd.get('category') || fd.get('Industry'),
        message: fd.get('message') || fd.get('Message')
      };
      if (leadSubmitBtn) leadSubmitBtn.disabled = true;
      if (leadTextEl) leadTextEl.style.display = 'none';
      if (leadLoaderEl) leadLoaderEl.style.display = 'inline-flex';
      sendOtp(leadFormData.phone);
    });
    if (otpVerifyBtn) {
      otpVerifyBtn.addEventListener('click', function () {
        var otp = otpInput.value.trim();
        if (!otp || otp.length < 4) { showOtpError('Please enter the OTP'); return; }
        hideOtpError();
        otpVerifyBtn.disabled = true;
        otpVerifyBtn.textContent = 'Verifying...';
        fetch('/api/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: leadFormData.phone, otp: otp })
        }).then(function (r) { return r.json(); }).then(function (data) {
          if (data.success) {
            otpVerifyBtn.textContent = 'Verified';
            otpSection.innerHTML = '<div class="otp-success">Phone verified! Submitting...</div>';
            fetch('/api/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(leadFormData)
            }).then(function (r) { return r.json(); }).then(function (res) {
              if (res.success) {
                leadForm.innerHTML = '<div style="text-align:center;padding:40px 20px;"><div style="font-size:48px;margin-bottom:16px;">🎉</div><h3 style="margin-bottom:8px;">Thank You!</h3><p style="color:var(--text-secondary);">We\'ll get back to you within 24 hours.</p></div>';
              } else {
                otpSection.innerHTML = '<div class="otp-error open">Submission failed. Please try again.</div>';
                if (leadSubmitBtn) { leadSubmitBtn.disabled = false; }
                if (leadTextEl) leadTextEl.style.display = 'inline';
                if (leadLoaderEl) leadLoaderEl.style.display = 'none';
              }
            }).catch(function () {
              otpSection.innerHTML = '<div class="otp-error open">Something went wrong.</div>';
              if (leadSubmitBtn) { leadSubmitBtn.disabled = false; }
              if (leadTextEl) leadTextEl.style.display = 'inline';
              if (leadLoaderEl) leadLoaderEl.style.display = 'none';
            });
          } else {
            showOtpError(data.error || 'Invalid OTP');
            otpVerifyBtn.disabled = false;
            otpVerifyBtn.textContent = 'Verify';
            otpInput.value = '';
            otpInput.focus();
          }
        }).catch(function () {
          showOtpError('Something went wrong');
          otpVerifyBtn.disabled = false;
          otpVerifyBtn.textContent = 'Verify';
        });
      });
    }
    if (otpResend) {
      otpResend.addEventListener('click', function (e) { e.preventDefault(); sendOtp(leadFormData.phone); });
    }
  }

  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var contactFormData = null;
    var contactBtn = document.getElementById('contactSubmitBtn');
    var contactOrigHtml = null;
    var contactOtpSection = document.getElementById('contactOtpSection');
    var contactOtpInput = document.getElementById('contactOtpInput');
    var contactOtpVerifyBtn = document.getElementById('contactOtpVerifyBtn');
    var contactOtpError = document.getElementById('contactOtpError');
    var contactOtpPhoneDisplay = document.getElementById('contactOtpPhoneDisplay');
    var contactOtpResend = document.getElementById('contactOtpResend');

    function showContactOtpError(msg) {
      contactOtpError.textContent = msg;
      contactOtpError.classList.add('open');
    }
    function hideContactOtpError() {
      contactOtpError.classList.remove('open');
    }
    function sendContactOtp(phone) {
      hideContactOtpError();
      contactOtpPhoneDisplay.textContent = phone;
      fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone })
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (data.success) {
          contactOtpSection.classList.add('open');
          contactOtpInput.value = '';
          contactOtpInput.focus();
          if (data.otp) {
            var m = document.createElement('p');
            m.style.cssText = 'font-size:.75rem;color:var(--text-tertiary);margin-top:4px';
            m.textContent = 'Dev mode — OTP: ' + data.otp;
            contactOtpSection.querySelector('p').after(m);
          }
        } else {
          showContactOtpError(data.error || 'Failed to send OTP');
          if (contactBtn) { contactBtn.disabled = false; contactBtn.innerHTML = contactOrigHtml; }
        }
      }).catch(function () {
        showContactOtpError('Something went wrong');
        if (contactBtn) { contactBtn.disabled = false; contactBtn.innerHTML = contactOrigHtml; }
      });
    }
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideContactOtpError();
      var fd = new FormData(contactForm);
      contactFormData = {
        name: fd.get('name') || fd.get('Name'),
        email: fd.get('email') || fd.get('Email'),
        phone: fd.get('phone') || fd.get('Phone'),
        category: fd.get('category') || fd.get('Industry'),
        message: fd.get('message') || fd.get('Message')
      };
      if (contactBtn) {
        contactOrigHtml = contactBtn.innerHTML;
        contactBtn.disabled = true;
        contactBtn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px;height:16px"></i> Sending OTP...';
        if (window.lucide) lucide.createIcons();
      }
      sendContactOtp(contactFormData.phone);
    });
    if (contactOtpVerifyBtn) {
      contactOtpVerifyBtn.addEventListener('click', function () {
        var otp = contactOtpInput.value.trim();
        if (!otp || otp.length < 4) { showContactOtpError('Please enter the OTP'); return; }
        hideContactOtpError();
        contactOtpVerifyBtn.disabled = true;
        contactOtpVerifyBtn.textContent = 'Verifying...';
        fetch('/api/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: contactFormData.phone, otp: otp })
        }).then(function (r) { return r.json(); }).then(function (data) {
          if (data.success) {
            contactOtpVerifyBtn.textContent = 'Verified';
            contactOtpSection.innerHTML = '<div class="otp-success">Phone verified! Submitting...</div>';
            fetch('/api/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(contactFormData)
            }).then(function (r) { return r.json(); }).then(function (res) {
              if (res.success) {
                contactForm.innerHTML = '<div style="text-align:center;padding:20px;"><h3 style="margin-bottom:8px;">Message Sent!</h3><p style="color:var(--text-secondary);">We\'ll reply within 24 hours.</p></div>';
              } else {
                contactOtpSection.innerHTML = '<div class="otp-error open">Submission failed.</div>';
                if (contactBtn) { contactBtn.disabled = false; contactBtn.innerHTML = contactOrigHtml; }
              }
            }).catch(function () {
              contactOtpSection.innerHTML = '<div class="otp-error open">Something went wrong.</div>';
              if (contactBtn) { contactBtn.disabled = false; contactBtn.innerHTML = contactOrigHtml; }
            });
          } else {
            showContactOtpError(data.error || 'Invalid OTP');
            contactOtpVerifyBtn.disabled = false;
            contactOtpVerifyBtn.textContent = 'Verify';
            contactOtpInput.value = '';
            contactOtpInput.focus();
          }
        }).catch(function () {
          showContactOtpError('Something went wrong');
          contactOtpVerifyBtn.disabled = false;
          contactOtpVerifyBtn.textContent = 'Verify';
        });
      });
    }
    if (contactOtpResend) {
      contactOtpResend.addEventListener('click', function (e) { e.preventDefault(); sendContactOtp(contactFormData.phone); });
    }
  }

  var chatDemos = [
    { container: document.getElementById('chat-demo'), input: document.getElementById('chat-demo-input'), send: document.getElementById('chat-demo-send'), messages: document.getElementById('chat-demo-messages') },
    { container: document.getElementById('chatbot-demo-container'), input: document.getElementById('chatbot-input'), send: document.getElementById('chatbot-send'), messages: document.getElementById('chatbot-messages') }
  ];
  var responses = [
    { keywords: ['voice', 'calling', 'call'], reply: 'Our AI Voice Calling system uses Indian virtual numbers to handle inbound and outbound calls 24/7. It understands natural speech in multiple languages, follows up on leads, and integrates with your CRM. Would you like a demo?' },
    { keywords: ['whatsapp'], reply: 'Our WhatsApp AI bot integrates with your WhatsApp Business API to automatically reply to messages, capture leads, qualify prospects, and even book appointments. It responds in under 2 seconds and works 24/7. It supports CRM integration and multi-language conversations. Would you like a demo?' },
    { keywords: ['video'], reply: 'Our AI Video Creation turns your scripts into professional marketing videos in minutes with AI voiceovers and auto captions. No camera or studio needed. Great for social media content, ads, and explainer videos. Interested?' },
    { keywords: ['pricing', 'cost', 'price', 'plan', 'expensive', 'free'], reply: 'We have three plans:\n• Free — 100 messages, 10 min voice\n• Growth — ₹2,999/mo: 5K messages, 3 bots, 500 min voice\n• Enterprise — Custom pricing with unlimited everything.\nAll paid plans come with a 14-day free trial!' },
    { keywords: ['service', 'offer', 'do you do'], reply: 'Tak2ai offers four powerful AI services:\n1. AI Voice Calling — Indian numbers, 24/7 calling\n2. WhatsApp AI — automated messaging and lead capture\n3. AI Video Creation — script to video in minutes\n4. AI Chatbots — ChatGPT-like bots for your website\nWhich one interests you the most?' },
    { keywords: ['demo', 'trial', 'try'], reply: 'Great question! You can start with our Free plan or get a 14-day free trial of the Growth plan. We also offer a free 15-minute AI consultation call to help you choose the right solution. Want me to help you get started?' },
    { keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening'], reply: 'Hi there! 👋 Welcome to Tak2ai. I\'m your AI assistant. Ask me about voice calling, AI chatbots, pricing, or anything else about our platform!' },
    { keywords: ['contact', 'support', 'help', 'human', 'agent'], reply: 'You can reach us at:\n📞 +91 90880 11999\n📧 connect@tak2ai.com\n💬 WhatsApp: wa.me/919088011999\nOur team is available Mon–Sat, 10 AM – 7 PM IST.' },
    { keywords: ['language', 'hindi', 'english', 'india', 'indian'], reply: 'Tak2ai supports Hindi, English, Bengali, Tamil, Telugu, Kannada, Marathi, Gujarati, and more. Our AI handles Hinglish naturally — perfect for Indian businesses!' },
    { keywords: ['setup', 'start', 'how', 'deploy', 'go live'], reply: 'Most businesses go live in 2–5 days! WhatsApp bots in 48 hours, Voice AI in 3–5 days. We handle all the setup — AI training, script configuration, and integration. You just provide your requirements!' },
    { keywords: ['thank', 'thanks', 'great', 'awesome', 'perfect'], reply: 'You\'re welcome! 😊 Is there anything else I can help you with? You can also book a free consultation call through our website.' }
  ];
  function getResponse(msg) {
    var lower = msg.toLowerCase();
    for (var i = 0; i < responses.length; i++) {
      for (var j = 0; j < responses[i].keywords.length; j++) {
        if (lower.indexOf(responses[i].keywords[j]) !== -1) return responses[i].reply;
      }
    }
    return 'Thanks for your question! I\'d recommend checking out our services page at /services or contact us directly at connect@tak2ai.com for a personalized answer.';
  }
  function setupChat(chat) {
    if (!chat.container) return;
    var suggestions = chat.container.querySelectorAll('.cd-suggestions button');
    suggestions.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var msg = btn.getAttribute('data-msg') || btn.textContent;
        addMessage(chat, msg, 'user');
        setTimeout(function () { botReply(chat, msg); }, 600);
      });
    });
    if (chat.input && chat.send) {
      chat.send.addEventListener('click', function () { sendChat(chat); });
      chat.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); sendChat(chat); }
      });
    }
  }
  function sendChat(chat) {
    var msg = chat.input.value.trim();
    if (!msg) return;
    chat.input.value = '';
    addMessage(chat, msg, 'user');
    setTimeout(function () { botReply(chat, msg); }, 600);
  }
  function addMessage(chat, text, role) {
    if (!chat.messages) return;
    var div = document.createElement('div');
    div.className = role === 'user' ? 'cd-msg user' : 'cd-msg ai';
    div.textContent = text;
    chat.messages.appendChild(div);
    chat.messages.scrollTop = chat.messages.scrollHeight;
  }
  function botReply(chat, userMsg) {
    if (!chat.messages) return;
    var typing = document.createElement('div');
    typing.className = 'cd-msg ai typing';
    typing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    chat.messages.appendChild(typing);
    chat.messages.scrollTop = chat.messages.scrollHeight;
    var delay = 800 + Math.random() * 1200;
    setTimeout(function () {
      if (typing.parentNode) typing.remove();
      var reply = getResponse(userMsg);
      addMessage(chat, reply, 'ai');
    }, delay);
  }
  chatDemos.forEach(setupChat);

  var heroHeading = document.querySelector('.hero-title .heading-gradient');
  if (heroHeading && heroHeading.textContent.trim().length > 0) {
    var text1 = 'AI That Talks.';
    var texts = ['Automates.', 'Creates.'];
    var cursorSpan = document.createElement('span');
    cursorSpan.className = 'typing-cursor';
    cursorSpan.textContent = '|';
    heroHeading.innerHTML = '';
    var span1 = document.createElement('span');
    heroHeading.appendChild(span1);
    var lineBreak = document.createElement('br');
    heroHeading.appendChild(lineBreak);
    var span2 = document.createElement('span');
    heroHeading.appendChild(span2);
    heroHeading.appendChild(cursorSpan);
    var charIndex = 0;
    function typeLine1() {
      if (charIndex < text1.length) {
        span1.textContent += text1[charIndex];
        charIndex++;
        setTimeout(typeLine1, 50);
      } else {
        charIndex = 0;
        typeCycle(0, true);
      }
    }
    function typeCycle(wordIdx, typing) {
      var word = texts[wordIdx];
      if (typing) {
        if (charIndex < word.length) {
          span2.textContent += word[charIndex];
          charIndex++;
          setTimeout(function () { typeCycle(wordIdx, true); }, 50);
        } else {
          setTimeout(function () { typeCycle(wordIdx, false); }, 2500);
        }
      } else {
        if (charIndex > 0) {
          span2.textContent = span2.textContent.slice(0, -1);
          charIndex--;
          setTimeout(function () { typeCycle(wordIdx, false); }, 30);
        } else {
          var nextIdx = (wordIdx + 1) % texts.length;
          typeCycle(nextIdx, true);
        }
      }
    }
    setTimeout(typeLine1, 500);
  }

  var pricingToggle = document.querySelector('.pricing-toggle');
  if (pricingToggle) {
    var labels = pricingToggle.querySelectorAll('.toggle-label');
    var toggleSwitch = pricingToggle.querySelector('.toggle-switch');
    var period = 'monthly';
    function setPeriod(p) {
      period = p;
      labels.forEach(function (l) {
        l.classList.toggle('active', l.getAttribute('data-period') === p);
      });
      document.querySelectorAll('.pricing-card').forEach(function (card) {
        var amount = card.querySelector('.price-amount');
        var periodEl = card.querySelector('.price-period');
        var monthlyPrice = card.getAttribute('data-monthly');
        if (!monthlyPrice) {
          monthlyPrice = amount ? amount.textContent.trim() : '';
          if (monthlyPrice && monthlyPrice !== 'Free' && monthlyPrice !== 'Custom') {
            card.setAttribute('data-monthly', monthlyPrice);
          }
        }
        if (p === 'annual' && monthlyPrice && monthlyPrice !== 'Free' && monthlyPrice !== 'Custom') {
          var num = parseInt(monthlyPrice.replace(/[^0-9]/g, ''));
          if (num) {
            var annualPrice = Math.round(num * 0.8);
            if (amount) amount.textContent = '₹' + annualPrice.toLocaleString('en-IN');
            if (periodEl) periodEl.textContent = '/month (billed annually)';
          }
        } else if (p === 'monthly') {
          if (monthlyPrice && monthlyPrice !== 'Free' && monthlyPrice !== 'Custom') {
            if (amount) amount.textContent = monthlyPrice;
          }
          if (periodEl) periodEl.textContent = '/month';
        }
      });
    }
    labels.forEach(function (l) {
      l.addEventListener('click', function () { setPeriod(l.getAttribute('data-period')); });
    });
  }

  var threeCanvas = document.getElementById('three-canvas');
  if (threeCanvas && typeof THREE !== 'undefined') {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    var particles = new THREE.BufferGeometry();
    var count = 2000;
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 30;
    particles.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.035, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    var particleSystem = new THREE.Points(particles, mat);
    scene.add(particleSystem);
    camera.position.z = 8;
    var mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', function (e) {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    function animate() {
      requestAnimationFrame(animate);
      particleSystem.rotation.y += 0.0003;
      particleSystem.rotation.x = Math.sin(Date.now() * 0.0001) * 0.05;
      particleSystem.rotation.y += mouseX * 0.0002;
      particleSystem.rotation.x += mouseY * 0.0002;
      renderer.render(scene, camera);
    }
    animate();
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  var testRotater = document.getElementById('testRotater');
  if (testRotater) {
    var cards = testRotater.querySelectorAll('.testi-card');
    var dotsContainer = testRotater.querySelector('.testi-dots');
    var currentIdx = 0;
    var interval;
    if (dotsContainer && cards.length) {
      cards.forEach(function (_, idx) {
        var dot = document.createElement('span');
        dot.className = 't-dot' + (idx === 0 ? ' active' : '');
        dot.addEventListener('click', function () { goTo(idx); });
        dotsContainer.appendChild(dot);
      });
    }
    function goTo(idx) {
      cards.forEach(function (c, i) {
        c.classList.toggle('active', i === idx);
      });
      var dots = dotsContainer ? dotsContainer.querySelectorAll('.t-dot') : [];
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
      currentIdx = idx;
      resetInterval();
    }
    function resetInterval() {
      if (interval) clearInterval(interval);
      interval = setInterval(function () {
        goTo((currentIdx + 1) % cards.length);
      }, 5000);
    }
    if (cards.length > 1) resetInterval();
  }

  var floatBtn = document.getElementById('openGsModalFloat');
  if (floatBtn && window.innerWidth <= 768) {
    function onScroll() {
      floatBtn.classList.toggle('visible', window.scrollY > 150);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (window.lucide) lucide.createIcons();
})();
