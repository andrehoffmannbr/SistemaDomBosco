import { supabase } from '../lib/supabaseClient.js';

export const db = {
  clients: [],
  schedules: [],
  dailyNotes: [],
  generalDocuments: [],
  notifications: [],
  roles: [],
  users: [],                  // compat a partir de profiles
  stockItems: [],
  stockMovements: [],
  anamnesisTypes: [],
  client_notes: [],
  client_documents: [],
  appointments: []           // NEW: added appointments support
};

export async function hydrateAll() {
  await Promise.all([
    hydrate('clients'),
    hydrate('schedules'),
    hydrate('dailyNotes'),
    hydrate('generalDocuments'),
    hydrate('notifications'),
    hydrate('roles'),
    hydrate('users'),
    hydrate('stockItems'),
    hydrate('stockMovements'),
    hydrate('anamnesisTypes'),
    hydrate('appointments')
  ]);
}

export async function hydrate(slice) {
  switch (slice) {
    case 'clients': {
      const { data, error } = await supabase
        .from('clients')
        .select('*, assigned_professional_uids')
        .order('id', { ascending: false });
      if (error) throw error;
      db.clients = data || [];
      break;
    }
    case 'schedules': {
      const { data, error } = await supabase.from('schedules').select('*').order('id', { ascending: false });
      if (error) throw error;
      db.schedules = data || [];
      break;
    }
    case 'dailyNotes': {
      const { data, error } = await supabase.from('daily_notes').select('*').order('id', { ascending: false });
      if (error) throw error;
      db.dailyNotes = data || [];
      break;
    }
    case 'generalDocuments': {
      const { data, error } = await supabase.from('general_documents').select('*').order('id', { ascending: false });
      if (error) throw error;
      db.generalDocuments = data || [];
      break;
    }
    case 'notifications': {
      const { data, error } = await supabase.from('notifications').select('*').order('id', { ascending: false });
      if (error) throw error;
      db.notifications = data || [];
      break;
    }
    case 'roles': {
      const { data, error } = await supabase.from('roles').select('*').order('id', { ascending: true });
      if (error) throw error;
      db.roles = data || [];
      break;
    }
    case 'users': { // compat: preenche via profiles
      const { data, error } = await supabase.from('profiles').select('id, name, role, phone, email, tab_access');
      if (error) throw error;
      db.users = (data || []).map(p => ({ id: p.id, name: p.name, role: p.role, phone: p.phone, email: p.email, tabAccess: p.tab_access || {} }));
      break;
    }
    case 'stockItems': {
      const { data, error } = await supabase.from('stock_items').select('*').order('id', { ascending: false });
      if (error) throw error;
      db.stockItems = data || [];
      break;
    }
    case 'stockMovements': {
      const { data, error } = await supabase.from('stock_movements').select('*').order('id', { ascending: false });
      if (error) throw error;
      db.stockMovements = data || [];
      break;
    }
    case 'anamnesisTypes': {
      const { data, error } = await supabase.from('anamnesis_types').select('*').order('id', { ascending: true });
      if (error) throw error;
      db.anamnesisTypes = data || [];
      break;
    }
    case 'appointments': {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      db.appointments = data || [];
      break;
    }
    default:
      await hydrateAll();
  }
}