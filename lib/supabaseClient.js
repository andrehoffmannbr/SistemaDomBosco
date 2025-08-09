import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.__ENV || {};
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('window.__ENV SUPABASE_* não configurado');
}
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}
