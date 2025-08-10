/// <reference lib="deno.unstable" />
// deno-lint-ignore-file
// @ts-nocheck
// Supabase Edge Function - create-user
// Permite criação de usuários apenas por director/admin
import { serve } from "@std/http/server";
import { createClient } from "@supabase/supabase-js";

// Carregar variáveis de ambiente
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Validar que todas as variáveis necessárias estão definidas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables:");
  console.error("SUPABASE_URL:", !!SUPABASE_URL);
  console.error("SUPABASE_ANON_KEY:", !!SUPABASE_ANON_KEY);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", !!SERVICE_ROLE_KEY);
  throw new Error("Edge Function environment not configured properly");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { 
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Headers": "authorization,content-type",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
      }
    });
  }

  // Verificar método HTTP
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  try {
    // Verificar autorização do usuário atual (Bearer <access_token>)
    const authHeader = req.headers.get('Authorization') ?? "";
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Criar cliente com token do usuário
    const token = authHeader.replace('Bearer ', '');
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
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

    if (!['director', 'admin'].includes(profile.role)) {
      throw new Error('Apenas director ou admin podem criar usuários');
    }

    // Extrair dados do request
    const { email, password, name, role, tab_access } = await req.json();
    if (!email || !password || !name || !role) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid payload' }), {
        status: 400, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
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
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
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
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response(JSON.stringify({ success: true, user }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });

  } catch (err) {
    console.error('Error in create-user function:', err);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message || 'Erro interno do servidor'
    }), {
      status: 400,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });
  }
});
