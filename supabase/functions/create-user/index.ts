// supabase/functions/create-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ----- CORS (whitelist dinâmica + Vary: Origin)
const ALLOWED_ORIGINS = new Set<string>([
  'https://sistema-dom-bosco-ten.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]);

function buildCorsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : 'https://sistema-dom-bosco-ten.vercel.app';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('Origin'));

  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ===== Lógica de criação (mantenha sua implementação atual) =====
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const payload = await req.json();
    const { email, password, name, role, tab_access } = payload ?? {};
    if (!email || !password || !name) {
      return new Response(JSON.stringify({ ok:false, error:'missing_fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      });
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

    return new Response(JSON.stringify({ ok:true, user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
    });
  }
});
