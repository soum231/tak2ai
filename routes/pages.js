const express = require('express');
const router = express.Router();
const { optionalAuth, requireAdmin } = require('../middleware/auth');

const pages = [
  { path: '/', view: 'pages/index', page: 'home', title: 'AI That Talks, Automates & Creates', desc: 'Build AI-powered voice agents and intelligent chatbots. India\'s AI automation platform for modern businesses.' },
  { path: '/voice-ai', view: 'pages/voice-ai', page: 'voice-ai', title: 'AI Voice Calling with Indian Numbers', desc: 'Get Indian virtual numbers with natural AI conversations. Automate lead follow-ups, customer support, and outbound calling 24/7 with Tak2ai Voice AI.' },

  { path: '/chatbot', view: 'pages/chatbot', page: 'chatbot', title: 'Your AI Assistant Available 24/7', desc: 'Deploy a ChatGPT-like AI chatbot on your website. Train it on your data and never miss a customer inquiry again.' },
  // { path: '/whatsapp-ai', view: 'pages/whatsapp-ai', page: 'whatsapp-ai', title: 'WhatsApp AI Bot with Automation', desc: 'WhatsApp AI bot for businesses. Automate lead capture, order booking, customer support & broadcasting with AI-powered WhatsApp automation.' },
  { path: '/video-ai', view: 'pages/video-ai', page: 'video-ai', title: 'AI Video Generation with Avatars', desc: 'AI video generation with realistic avatars. Create professional videos with AI presenters, voiceovers, and automated editing for Indian businesses.' },
  { path: '/automate-leads', view: 'pages/automate-leads', page: 'automate-leads', title: 'AI Lead Automation for Businesses', desc: 'Automate lead capture, qualification, and follow-ups with AI. Convert every lead automatically with smart routing and CRM integration.' },
  { path: '/works', view: 'pages/works', page: 'works', title: 'Our Works', desc: 'See how businesses use Tak2ai to automate, scale, and grow. Real results from real companies.' },
  { path: '/pricing', view: 'pages/pricing', page: 'pricing', title: 'Simple Transparent Pricing', desc: 'Choose the perfect plan for your business. AI voice and chatbot solutions at affordable India-friendly pricing.' },
  // { path: '/about', view: 'pages/about', page: 'about', title: 'About Tak2ai', desc: 'Learn about Tak2ai — India\'s AI automation platform. Our mission, team, and story.' },
  { path: '/contact', view: 'pages/contact', page: 'contact', title: 'Contact Us', desc: 'Get in touch with the Tak2ai team. We\'re here to help you automate your business with AI.' },
  { path: '/login', view: 'pages/login', page: 'login', title: 'Sign In', desc: 'Sign in to your Tak2ai account to manage AI voice agents and chatbots.', authRedirect: true },
  { path: '/register', view: 'pages/register', page: 'register', title: 'Create Account', desc: 'Create your Tak2ai account and start automating your business with AI voice and chatbots.', authRedirect: true },
  { path: '/forgot-password', view: 'pages/forgot-password', page: 'forgot-password', title: 'Reset Password', desc: 'Reset your Tak2ai account password.' },
  { path: '/reset-password', view: 'pages/reset-password', page: 'reset-password', title: 'Set New Password', desc: 'Set a new password for your Tak2ai account.' },
];

pages.forEach(p => {
  router.get(p.path, optionalAuth, (req, res) => {
    if (p.authRedirect && req.session.userId) {
      return res.redirect(req.session.isAdmin ? '/admin' : '/dashboard');
    }
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

router.get('/admin', requireAdmin, (req, res) => {
  res.render('pages/admin', {
    title: 'Admin Dashboard',
    canonical: '/admin',
    currentPage: 'admin',
    user: req.user,
    breadcrumbs: []
  });
});

module.exports = router;
