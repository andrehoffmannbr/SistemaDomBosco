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
    // Dev bypass para smoke test (apenas se ALLOW_NOAUTH=true e header x-dev-smoke=1)
    const bypass = Deno.env.get('ALLOW_NOAUTH') === 'true' && req.headers.get('x-dev-smoke') === '1';
    
    let userRole = null;
    
    if (!bypass) {
      // Verificar autorização do usuário atual (Bearer <access_token>)
      const authHeader = req.headers.get('Authorization') ?? "";
      if (!authHeader) {
        throw new Error('Authorization header missing');
      }

      // Extrair Authorization: Bearer <jwt>
      const token = authHeader.replace('Bearer ', '');
      const supabaseUser = createClient(EDGE_SUPABASE_URL, EDGE_ANON_KEY);
      
      // Validar JWT com createClient anon
      const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
      
      if (userError || !user) {
        return new Response(JSON.stringify({ code: 401, message: "Invalid JWT" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      debugLog("auth_ok", { userId: user.id });

      // Buscar profile no DB com SERVICE ROLE
      const { profile, error: profileError } = await getUserRole(user.id);
      
      debugLog("profile_fetch", { userId: user.id, hasProfile: !!profile, role: profile?.role });
      
      if (profileError || !profile) {
        return new Response(JSON.stringify({ code: 403, message: "Profile not found" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Verificar permissão de admin
      if (!hasAdminAccess(profile.role)) {
        debugLog("deny_role", { userId: user.id, role: profile?.role, allowed: ALLOWED });
        return new Response(JSON.stringify({ code: 403, message: "Forbidden by role" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      debugLog("access_granted", { userId: user.id, role: profile.role });
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
