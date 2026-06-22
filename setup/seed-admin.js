const { supabaseAdmin } = require('../config/supabase');

const ADMIN_EMAIL = 'rasoumindia@gmail.com';
const ADMIN_PASSWORD = 'Soum8276';

async function seedAdmin() {
  try {
    let userId = null;

    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      return { success: false, error: 'Failed to list users: ' + listError.message };
    }

    const existingUser = userList?.users?.find(u => u.email === ADMIN_EMAIL);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { name: 'Admin' }
      });

      if (createError) {
        return { success: false, error: createError.message };
      }

      userId = newUser.user.id;
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      await supabaseAdmin.from('profiles').insert([{
        id: userId,
        name: 'Admin',
        created_at: new Date().toISOString()
      }]);
    }

    return { success: true };
  } catch (err) {
    console.error('[Seed] Admin seed error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { seedAdmin };
