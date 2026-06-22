const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, phone, company } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, company }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists' });
      }
      return res.status(400).json({ success: false, error: authError.message });
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').insert([{
      id: authUser.user.id,
      name,
      phone: phone || null,
      company_name: company || null,
      created_at: new Date().toISOString()
    }]);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({ success: false, error: 'Failed to create profile' });
    }

    req.session.userId = authUser.user.id;
    res.status(201).json({ success: true, redirect: '/dashboard' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    req.session.userId = data.user.id;
    req.session.accessToken = data.session?.access_token;

    const ADMIN_EMAIL = 'rasoumindia@gmail.com';
    if (data.user.email === ADMIN_EMAIL) {
      req.session.isAdmin = true;
    }

    if (remember) {
      req.sessionOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    const redirect = req.session.isAdmin ? '/admin' : '/dashboard';
    res.json({ success: true, redirect });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

router.all('/signout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

router.post('/magic-link', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/api/auth/callback` }
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Magic link sent to your email' });
  } catch (err) {
    console.error('Magic link error:', err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

router.get('/google', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

  const { data, error } = supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/api/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' }
    }
  });

  if (error) {
    return res.redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  res.redirect(data.url);
});

router.get('/callback', async (req, res) => {
  try {
    const { code, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`/login?error=${encodeURIComponent(oauthError)}`);
    }

    if (!code) {
      return res.redirect('/login?error=No authorization code provided');
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return res.redirect(`/login?error=${encodeURIComponent(error?.message || 'Authentication failed')}`);
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (!existingProfile) {
      const metadata = data.user.user_metadata || {};
      await supabaseAdmin.from('profiles').insert([{
        id: data.user.id,
        name: metadata.full_name || metadata.name || data.user.email?.split('@')[0] || 'User',
        avatar_url: metadata.avatar_url || data.user.avatar_url || null,
        created_at: new Date().toISOString()
      }]);
    }

    req.session.userId = data.user.id;
    req.session.accessToken = data.session?.access_token;
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/login?error=Authentication failed');
  }
});

module.exports = router;
