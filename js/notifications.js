// js/notifications.js
import { supabase } from '../lib/supabaseClient.js';
import { getCurrentUser } from './auth.js';
import { hydrate } from './database.js';

export async function pushNotification({ user_id, type, title, message, related_id }) {
  const payload = {
    user_id, type: type || null, title, message,
    related_id: related_id ?? null,
    created_at: new Date().toISOString(),
    is_read: false
  };
  const { error } = await supabase.from('notifications').insert([payload]);
  if (error) throw error;
  await hydrate('notifications'); // se a UI listar em tempo real
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
  await hydrate('notifications');
}

export async function fetchMyNotifications() {
  const me = getCurrentUser();
  if (!me) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', me.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
