// js/mural.js
import { supabase } from '../lib/supabaseClient.js';
import { getCurrentUser } from './auth.js';
import { hydrate } from './database.js';

// INSERT em general_documents
export async function addGeneralDocument(doc) {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuário não autenticado');
  const payload = {
    title: doc.title,
    type: doc.type,                         // 'documento'|'lembrete'|...
    document_type: doc.document_type,       // 'file'|'note'|'reuniao'
    description: doc.description || null,
    content: doc.content || null,
    file_name: doc.file_name || null,
    file_data: doc.file_data || null,       // base64
    meeting_date: doc.meeting_date || null, // 'YYYY-MM-DD'
    meeting_time: doc.meeting_time || null, // 'HH:MM'
    location: doc.location || null,
    attendees: doc.attendees || [],         // uuid[]
    created_at: new Date().toISOString(),
    user_id: user.id
  };
  const { error } = await supabase.from('general_documents').insert([payload]);
  if (error) throw error;
  await hydrate('generalDocuments');
}

// DELETE por id
export async function deleteGeneralDocument(id) {
  const { error } = await supabase.from('general_documents').delete().eq('id', id);
  if (error) throw error;
  await hydrate('generalDocuments');
}
