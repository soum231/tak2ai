const { supabase, supabaseAdmin } = require('../config/supabase');

async function verifyBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function requireAuth(req, res, next) {
  if (!req.session.userId) {
    const bearerUser = await verifyBearerToken(req);
    if (bearerUser) {
      req.session.userId = bearerUser.id;
      const ADMIN_EMAIL = 'rasoumindia@gmail.com';
      if (bearerUser.email === ADMIN_EMAIL) req.session.isAdmin = true;
    } else {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }
  
  const [profileResult, authResult] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').eq('id', req.session.userId).single(),
    supabaseAdmin.auth.admin.getUserById(req.session.userId)
  ]);
  
  if (!profileResult.data) {
    req.session = null;
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  req.user = { ...profileResult.data, email: authResult.data?.user?.email || '' };
  next();
}

async function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    const bearerUser = await verifyBearerToken(req);
    if (bearerUser) {
      req.session.userId = bearerUser.id;
      const ADMIN_EMAIL = 'rasoumindia@gmail.com';
      if (bearerUser.email === ADMIN_EMAIL) req.session.isAdmin = true;
    }
  }

  if (!req.session.isAdmin) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (!req.session.userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const [profileResult, authResult] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').eq('id', req.session.userId).single(),
    supabaseAdmin.auth.admin.getUserById(req.session.userId)
  ]);

  if (!profileResult.data) {
    req.session = null;
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  req.user = { ...profileResult.data, email: authResult.data?.user?.email || '' };
  next();
}

async function optionalAuth(req, res, next) {
  if (req.session.userId) {
    const [profileResult, authResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', req.session.userId).single(),
      supabaseAdmin.auth.admin.getUserById(req.session.userId)
    ]);
    if (profileResult.data) {
      req.user = { ...profileResult.data, email: authResult.data?.user?.email || '' };
    } else {
      req.user = null;
    }
  }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
