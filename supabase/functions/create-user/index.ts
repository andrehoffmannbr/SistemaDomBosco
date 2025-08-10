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

const supabaseAdmin = createClient(EDGE_SUPABASE_URL, EDGE_SERVICE_ROLE_KEY);

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

      // Criar cliente com token do usuário
      const token = authHeader.replace('Bearer ', '');
      const supabaseUser = createClient(EDGE_SUPABASE_URL, EDGE_ANON_KEY);
      
      // Verificar se o usuário atual é director ou admin
      const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
      if (userError || !user) {
        throw new Error('Invalid authentication token');
      }

      // Verificar role do usuário atual
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found');
      }

      userRole = profile.role;
      
      // Verificar RBAC - apenas roles permitidos
      if (!EDGE_ALLOWED_ROLES.includes(userRole)) {
        throw new Error(`Apenas usuários com roles [${EDGE_ALLOWED_ROLES.join(',')}] podem criar usuários`);
      }
    } else {
      // Dev bypass ativo - simular role admin para teste
      userRole = 'admin';
      console.log('DEV BYPASS: Auth disabled for smoke test');
    }    // Extrair dados do request
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
