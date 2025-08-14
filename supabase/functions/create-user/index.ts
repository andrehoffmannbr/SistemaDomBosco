// supabase/functions/create-user/index.ts
import { preflight, json } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Em Edge Functions, essas envs já existem:
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
})

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return preflight(req)

  try {
    // Parse robusto do body
    let payload: Record<string, unknown>
    try {
      payload = await req.json()
    } catch {
      return json({ ok:false, error:'invalid_json' }, { status:400, origin:req.headers.get('Origin') })
    }

    const { email, password, name, role, tab_access } = payload ?? {}
    if (!email || !password || !name) {
      return json({ ok:false, error:'missing_fields' }, { status:400, origin:req.headers.get('Origin') })
    }

    // Cria usuário no Auth
    const { data: u, error: uerr } = await admin.auth.admin.createUser({
      email: String(email), 
      password: String(password), 
      email_confirm: true
    })
    if (uerr) {
      const raw = String(uerr.message ?? String(uerr) ?? '').toLowerCase();
      // casos típicos: "AuthApiError: A user with this email address has already been registered"
      const isDup =
        raw.includes('already') && (raw.includes('registered') || raw.includes('exists') || raw.includes('exist'));
      if (isDup) {
        return json({ ok: false, error: 'user_already_exists' }, { status: 409, origin:req.headers.get('Origin') });
      }
      return json({ ok: false, error: `create_user_failed: ${String(uerr)}` }, { status: 400, origin:req.headers.get('Origin') });
    }

    // Insere profile
    const prof = {
      id: u!.user.id,
      name: String(name),
      role: role ? String(role) : null,
      tab_access: tab_access ?? {}
    }
    const { error: perr } = await admin.from('profiles').insert(prof)
    if (perr) {
      return json(
        { ok:false, error: `insert_profile_failed: ${perr.message}` },
        { status:400, origin:req.headers.get('Origin') }
      )
    }

    return json({ ok:true, user_id: u!.user.id }, { status:200, origin:req.headers.get('Origin') })
  } catch (e) {
    return json(
      { ok:false, error: `internal_error: ${e instanceof Error ? e.message : String(e)}` },
      { status:500, origin:req.headers.get('Origin') }
    )
  }
})
