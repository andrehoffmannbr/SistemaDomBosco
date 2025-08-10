/// <reference lib="deno.unstable" />
// deno-lint-ignore-file
// @ts-nocheck
// Supabase Edge Function - create-user
// Permite criação de usuários apenas por director/admin
import { serve } from "@std/http/server";
import { createClient } from "@supabase/supabase-js";

// Carregar variáveis de ambiente
const EDGE_SUPABASE_URL = Deno.env.get("EDGE_SUPABASE_URL");
const EDGE_ANON_KEY = Deno.env.get("EDGE_ANON_KEY");
const EDGE_SERVICE_ROLE_KEY = Deno.env.get("EDGE_SERVICE_ROLE");
const EDGE_ALLOWED_ROLES = (Deno.env.get("EDGE_ALLOWED_ROLES") || "admin,director")
  .split(",").map(s => s.trim()).filter(Boolean);
const ALLOW_NOAUTH = Deno.env.get("ALLOW_NOAUTH");

// Validar que todas as variáveis necessárias estão definidas
if (!EDGE_SUPABASE_URL || !EDGE_ANON_KEY || !EDGE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables:");
  console.error("EDGE_SUPABASE_URL:", !!EDGE_SUPABASE_URL);
  console.error("EDGE_ANON_KEY:", !!EDGE_ANON_KEY);
  console.error("EDGE_SERVICE_ROLE:", !!EDGE_SERVICE_ROLE_KEY);
  throw new Error("Edge Function environment not configured properly");
}

const supaAdmin = createClient(
  Deno.env.get("EDGE_SUPABASE_URL")!,
  Deno.env.get("EDGE_SERVICE_ROLE")!  // SERVICE ROLE
);

// Função auxiliar para buscar role do usuário na base de dados
async function getUserRole(userId: string) {
  const { data, error } = await supaAdmin
    .from("profiles")
    .select("id,role,email,tab_access")
    .eq("id", userId)
    .single();
  return { profile: data ?? null, error };
}

// Verificar se role tem permissão de admin
const ALLOWED = (Deno.env.get("EDGE_ALLOWED_ROLES") ?? "admin,administrator,director")
  .split(",").map(s => s.trim().toLowerCase());

function hasAdminAccess(role?: string | null): boolean {
  return role ? ALLOWED.includes(role.toLowerCase()) : false;
}

// Logs de diagnóstico estruturados
function debugLog(stage: string, info: Record<string, unknown>) {
  console.log(JSON.stringify({ stage, ...info, ts: new Date().toISOString() }));
}

serve(async (req: Request) => {
  // --- DIAG: Ping para provar que o código da função está executando ---
  // Envie Authorization: Bearer qualquer-coisa se verify_jwt estiver ativo no gateway.
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("diag") === "ping") {
      return new Response(
        JSON.stringify({
          ok: true,
          from: "create-user",
          rev: crypto.randomUUID(),
          ts: Date.now()
        }),
        {
          status: 418,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store"
          }
        }
      );
    }
  } catch (_) {
    // se URL falhar, ignore e prossegue
  }

  // CORS headers para todas as respostas
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", 
    "Access-Control-Allow-Headers": "authorization,content-type,x-dev-smoke",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  // Roteamento do healthcheck
  const url = new URL(req.url);
  const path = url.pathname; // ex.: /create-user, /create-user/health
  if (req.method === 'GET' && (path.endsWith('/health') || url.searchParams.get('health') === '1')) {
    return new Response(JSON.stringify({ ok: true }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Verificar método HTTP para rota principal
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    // 1) Forward do Authorization para o client do Supabase
    const authHeader = req.headers.get("Authorization") || "";

    const supabase = createClient(EDGE_SUPABASE_URL, EDGE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // 2) Diagnóstico seguro (sem dados sensíveis)
    const jwtIsPresent = authHeader.startsWith("Bearer ");
    const nowMs = Date.now();

    // 3) Descobrir usuário autenticado
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({
        code: 401,
        message: "Invalid or missing JWT",
        diag: { jwtIsPresent, nowMs }
      }), { status: 401, headers: { "content-type": "application/json", "access-control-allow-origin": "*" }});
    }

    // 4) RBAC pelo profiles
    const userId = userData.user.id;
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .single();
    if (pErr || !profile) {
      return new Response(JSON.stringify({
        code: 403,
        message: "Profile not found",
        diag: { userId }
      }), { status: 403, headers: { "content-type": "application/json", "access-control-allow-origin": "*" }});
    }

    const allowed = new Set(["admin", "administrator", "director"]);
    const hasAdminAccess = allowed.has((profile.role || "").toLowerCase());
    if (!hasAdminAccess) {
      return new Response(JSON.stringify({
        code: 403,
        message: "Insufficient role",
        diag: { role: profile.role }
      }), { status: 403, headers: { "content-type": "application/json", "access-control-allow-origin": "*" }});
    }

    // Extrair dados do request
    const { email, password, name, role, tab_access } = await req.json();
    if (!email || !password || !name || !role) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid payload' }), {
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validações de entrada
    if (password.length < 6) {
      throw new Error('Password deve ter pelo menos 6 caracteres');
    }

    // :one: Criar usuário no Auth
    const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) {
      return new Response(JSON.stringify({ success: false, error: authError.message }), {
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // :two: Criar perfil no DB
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.user.id,
        name,
        role,
        email,
        tab_access: tab_access ?? {}
      });
    if (profileError) {
      // rollback opcional (desativar usuário recém-criado)
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.user.id, { banned_until: "2999-01-01T00:00:00Z" });
      } catch (_) {}
      return new Response(JSON.stringify({ success: false, error: profileError.message }), {
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error('Error in create-user function:', err);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message || 'Erro interno do servidor'
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
