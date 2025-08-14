import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 🔒 Base correta do projeto (não use .ns, .io, etc.)
const SUPABASE_URL = 'https://iyukvodgqagaedomwxcs.supabase.co';
const SUPABASE_ANON_KEY = window.__ENV?.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('window.__ENV.SUPABASE_ANON_KEY não configurado');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  // garante caminho certo das Edge Functions
  functions: { url: `${SUPABASE_URL}/functions/v1` },
  auth: { persistSession: true, autoRefreshToken: true },
});
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}
