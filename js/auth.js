// Authentication module
import { supabase, getUser } from '../lib/supabaseClient.js';
import { hydrateAll } from './database.js';

export let currentUser = null;

// New: Role-based access control helper constants
// These constants define the roles allowed for different features/tabs.
// 'financeiro' is intentionally excluded from all non-financial access groups.

// Roles with access to only Director-specific features (e.g., full stock control)
export const DIRECTOR_ONLY = ['director'];
// Roles with access to only Finance-specific features (e.g., daily financial notes)
export const FINANCE_ONLY = ['financeiro'];
// Roles with combined Director or Finance access (e.g., viewing main financial report)
export const DIRECTOR_OR_FINANCE = ['director', 'financeiro'];
// NEW: Roles with access to stock management features (Director and Finance)
export const STOCK_MANAGERS = ['director', 'financeiro'];
// Roles with Coordinator access and higher (Director included)
export const COORDINATOR_AND_HIGHER = ['director', 'coordinator_madre', 'coordinator_floresta'];
// Roles with access to non-finance operational features (e.g., Client Registration, General Agenda)
// This group explicitly excludes 'financeiro'.
export const NON_FINANCE_ACCESS = ['director', 'coordinator_madre', 'coordinator_floresta', 'staff', 'intern', 'musictherapist', 'receptionist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'];
// All professional roles that can be assigned to clients/schedules, or perform services
export const PROFESSIONAL_ROLES = ['staff', 'intern', 'musictherapist', 'receptionist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'];
// Roles for Director and all professional roles (e.g., 'Meus Pacientes' tab)
export const DIRECTOR_AND_PROFESSIONALS = ['director', ...PROFESSIONAL_ROLES];
// Roles that can view all clients and employees (Director, Coordinators, and Receptionists)
export const ALL_ADMIN_VIEW_CLIENTS_AND_EMPLOYEES = ['director', 'coordinator_madre', 'coordinator_floresta', 'receptionist'];
// New: Roles that can view AND manage ALL schedules (confirm/cancel any schedule)
export const ALL_SCHEDULE_VIEW_EDIT_MANAGERS = ['director', 'coordinator_madre', 'coordinator_floresta', 'receptionist'];
// NEW: Roles that can add/edit/delete general documents and meetings on the 'Mural do Coordenador' tab
export const DIRECTOR_AND_COORDINATORS_ONLY_DOCUMENTS = ['director', 'coordinator_madre', 'coordinator_floresta'];
// NEW: All users, for tab visibility (e.g. general view for "Mural do Coordenador")
export const ALL_USERS = ['director', 'coordinator_madre', 'coordinator_floresta', 'staff', 'intern', 'musictherapist', 'financeiro', 'receptionist', 'psychologist', 'psychopedagogue', 'speech_therapist', 'nutritionist', 'physiotherapist'];

export async function login(username, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: username, password });
  if (error) return { ok: false, error };
  const user = await getUser();
  if (!user) return { ok: false, error: new Error('Sessão inválida') };
  
  // Carrega perfil
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (pErr) return { ok: false, error: pErr };

  // Fallback de tab_access:
  // - Se profile.tab_access está vazio/{} → buscar do papel em roles.tab_access
  // - Admin sempre tem tudo liberado
  let effectiveTabAccess = profile.tab_access || {};
  const isEmpty =
    !effectiveTabAccess ||
    (typeof effectiveTabAccess === 'object' && Object.keys(effectiveTabAccess).length === 0);

  if (isEmpty) {
    const { data: roleRow } = await supabase
      .from('roles')
      .select('tab_access')
      .eq('id', profile.role)
      .single();
    effectiveTabAccess = roleRow?.tab_access || {};
    // Persiste para não perder mais após novo login
    await supabase.from('profiles').update({ tab_access: effectiveTabAccess }).eq('id', user.id);
  }

  const currentUser = {
    id: profile.id, name: profile.name, role: profile.role,
    email: profile.email, phone: profile.phone, tabAccess: effectiveTabAccess
  };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  await hydrateAll();
  return { ok: true, user: currentUser };
}

export async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem('currentUser');
}

export function checkLogin() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        return true;
    }
    return false;
}

export function getCurrentUser() {
  try { const raw = localStorage.getItem('currentUser'); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

// NOVO helper: checa se o usuário atual tem uma role específica ou está em uma lista de roles
export function isUserRoleIn(allowedRoles) {
  const user = getCurrentUser();
  if (!user) return false;
  return Array.isArray(allowedRoles)
    ? allowedRoles.includes(user.role)
    : user.role === allowedRoles;
}

// ADMIN ROLES – bypass total de UI
export const SUPER_ROLES = new Set(['admin','administrator','director']);

export function isSuperUser(user) {
  const role = (user?.role || '').toLowerCase();
  return SUPER_ROLES.has(role);
}

// Admin sempre pode tudo; caso contrário, checa tabAccess. Ação padrão: "view".
export function checkTabAccess(section, action = 'view') {
  const u = getCurrentUser();
  if (!u) return false;
  // Bypass: superuser sempre pode
  if (isSuperUser(u)) return true;
  const ta = u.tabAccess || {};
  const sec = ta[section];
  if (!sec) return false;
  return !!(action in sec ? sec[action] : sec.view);
}

// Mantém a assinatura pública esperada pela UI (NÃO REMOVER)
export function isRoleAllowed(section, action = 'view') {
  return checkTabAccess(section, action);
}

export function hasEditAccess(tabId) {
    // This function is a simple wrapper to check for 'edit' permissions.
    return checkTabAccess(tabId, 'edit');
}

// NEW FUNCTION: Update User Password (via Supabase)
export async function updateUserPassword(userId, newPassword) {
    // Only users with 'edit' access to 'funcionarios' tab can update passwords
    if (!hasEditAccess('funcionarios')) return false;
    
    try {
        // Use Supabase auth admin API to update password
        const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
        if (error) {
            console.error('Password update failed:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Password update error:', err);
        return false;
    }
}