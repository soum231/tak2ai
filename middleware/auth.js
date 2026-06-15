const { supabaseAdmin } = require('../config/supabase');

async function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.session.userId)
    .single();
  
  if (!profile) {
    req.session.destroy();
    return res.redirect('/login');
  }
  
  req.user = profile;
  next();
}

async function requireAdmin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.session.userId)
    .single();
  
  if (!profile || profile.role !== 'admin') return res.redirect('/dashboard');
  req.user = profile;
  next();
}

async function optionalAuth(req, res, next) {
  if (req.session.userId) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.session.userId)
      .single();
    req.user = profile || null;
  }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
