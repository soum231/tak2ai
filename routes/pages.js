const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');

const pages = [
  { path: '/', view: 'pages/index', page: 'home', title: 'AI That Talks, Automates & Creates', desc: 'Build AI-powered voice agents and intelligent chatbots. India\'s AI automation platform for modern businesses.' },
  { path: '/voice-ai', view: 'pages/voice-ai', page: 'voice-ai', title: 'AI Voice Calling with Indian Numbers', desc: 'Get Indian virtual numbers with natural AI conversations. Automate lead follow-ups, customer support, and outbound calling 24/7 with Tak2ai Voice AI.' },

  { path: '/chatbot', view: 'pages/chatbot', page: 'chatbot', title: 'Your AI Assistant Available 24/7', desc: 'Deploy a ChatGPT-like AI chatbot on your website. Train it on your data and never miss a customer inquiry again.' },
  { path: '/pricing', view: 'pages/pricing', page: 'pricing', title: 'Simple Transparent Pricing', desc: 'Choose the perfect plan for your business. AI voice and chatbot solutions at affordable India-friendly pricing.' },
  { path: '/about', view: 'pages/about', page: 'about', title: 'About Tak2ai', desc: 'Learn about Tak2ai — India\'s AI automation platform. Our mission, team, and story.' },
  { path: '/contact', view: 'pages/contact', page: 'contact', title: 'Contact Us', desc: 'Get in touch with the Tak2ai team. We\'re here to help you automate your business with AI.' },
  { path: '/login', view: 'pages/login', page: 'login', title: 'Sign In', desc: 'Sign in to your Tak2ai account to manage AI voice agents and chatbots.' },
  { path: '/register', view: 'pages/register', page: 'register', title: 'Create Account', desc: 'Create your Tak2ai account and start automating your business with AI voice and chatbots.' },
];

pages.forEach(p => {
  router.get(p.path, optionalAuth, (req, res) => {
    res.render(p.view, {
      title: p.title,
      description: p.desc,
      canonical: p.path,
      currentPage: p.page,
      user: req.user || null,
      breadcrumbs: [
        { name: 'Home', url: '/' },
        ...(p.page !== 'home' ? [{ name: p.title, url: p.path }] : [])
      ]
    });
  });
});

router.get('/dashboard', require('../middleware/auth').requireAuth, (req, res) => {
  res.render('pages/dashboard', {
    title: 'Dashboard',
    canonical: '/dashboard',
    currentPage: 'dashboard',
    user: req.user,
    breadcrumbs: []
  });
});

router.get('/dashboard/*', require('../middleware/auth').requireAuth, (req, res) => {
  res.render('pages/dashboard', {
    title: 'Dashboard',
    canonical: '/dashboard',
    currentPage: 'dashboard',
    user: req.user,
    breadcrumbs: []
  });
});

module.exports = router;
