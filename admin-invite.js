import { createClient } from '@supabase/supabase-js';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body)
});

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return json(500, { error: 'Admin invite service is not configured on the server.' });
  }

  const auth = event.headers.authorization || event.headers.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return json(401, { error: 'Please sign in as a Super Admin.' });

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller?.user) return json(401, { error: 'Your admin session is invalid or expired.' });

  const { data: callerAdmin, error: callerAdminError } = await admin
    .from('cms_admins')
    .select('user_id,email,role')
    .eq('user_id', caller.user.id)
    .maybeSingle();
  if (callerAdminError) return json(500, { error: callerAdminError.message });
  if (!callerAdmin || callerAdmin.role !== 'super_admin') {
    return json(403, { error: 'Only Super Admins can add administrators.' });
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const role = body.role === 'superadmin' ? 'super_admin' : 'admin';
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return json(400, { error: 'Enter a valid email address.' });

  // Reuse an existing Auth account when one already exists; otherwise send an invitation.
  let target = null;
  let createdByInvite = false;
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) return json(500, { error: usersError.message });
  target = (usersData?.users || []).find(u => String(u.email || '').toLowerCase() === email) || null;

  if (!target) {
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${event.headers.origin || `https://${event.headers.host}`}/admin-login.html`,
      data: name ? { full_name: name } : undefined
    });
    if (inviteError) return json(400, { error: inviteError.message });
    target = invited?.user || null;
    createdByInvite = true;
  }

  if (!target?.id) return json(500, { error: 'The administrator account could not be created.' });

  const { data: existing, error: existingError } = await admin
    .from('cms_admins')
    .select('user_id,email,role')
    .eq('user_id', target.id)
    .maybeSingle();
  if (existingError) return json(500, { error: existingError.message });
  if (existing) {
    return json(409, { error: `${email} is already an administrator.` });
  }

  const { error: insertError } = await admin.from('cms_admins').insert({
    user_id: target.id,
    email: target.email || email,
    role
  });
  if (insertError) {
    if (createdByInvite) await admin.auth.admin.deleteUser(target.id);
    return json(400, { error: insertError.message });
  }

  return json(200, {
    ok: true,
    user: { id: target.id, email: target.email || email, role }
  });
}
