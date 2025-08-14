// supabase/functions/create-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { preflight, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight(req);

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const payload = await req.json();
    const { email, password, name, role, tab_access } = payload ?? {};
    if (!email || !password || !name) {
      return json({ ok:false, error:'missing_fields' }, { status: 400, origin: req.headers.get('Origin') });
    }

    // 1) cria usuário
    const { data: created, error: e1 } = await admin.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (e1) throw e1;
    const userId = created.user.id;

    // 2) insere profile
    const { error: e2 } = await admin.from('profiles').insert({
      id: userId, name, role: role ?? null, tab_access: tab_access ?? {}
    });
    if (e2) throw e2;

    return json({ ok:true, user_id: userId }, { status: 200, origin: req.headers.get('Origin') });
  } catch (err) {
    return json({ ok:false, error: String(err) }, { status: 400, origin: req.headers.get('Origin') });
  }
});
