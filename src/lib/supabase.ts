// ============================================================
// SUPABASE CLIENT — Payatas Ledger Design
// ============================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase env vars missing — running in offline/mock mode.');
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ============================================================
// SESSION TOKEN MANAGEMENT
// ============================================================

let _sessionToken: string | null = null;

export function setSessionToken(token: string | null) {
  _sessionToken = token;
  if (token) {
    sessionStorage.setItem("pl_token", token);
  } else {
    sessionStorage.removeItem("pl_token");
  }
}

export function getSessionToken(): string | null {
  if (!_sessionToken) {
    _sessionToken = sessionStorage.getItem("pl_token");
  }
  return _sessionToken;
}

export function getSession(): string | null {
  return getSessionToken();
}

// ============================================================
// AUTH RPC
// ============================================================

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    name: string;
    username: string;
    role: string;
    email: string;
    status: string;
    last_active: string;
    initials: string;
  };
  error?: string;
}

/** Generate a stable anonymous hash for rate limiting (not a user identifier). */
function deviceHash(): string {
  const raw = `${navigator.userAgent}-${screen.width}x${screen.height}`;
  return Array.from(new TextEncoder().encode(raw))
    .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/** Authenticate via the server-side bcrypt RPC (rate-limited by device fingerprint). */
export async function authenticateUser(
  login: string,
  password: string,
): Promise<AuthResult> {
  if (!supabase) throw new Error('offline');

  const { data, error } = await supabase.rpc('authenticate_user', {
    p_login:    login,
    p_password: password,
    p_ip_hash:  deviceHash(),
  });

  if (error) throw new Error(error.message);
  return data as AuthResult;
}

/** Safe public resident search — returns only non-PII fields. */
export async function searchResidents(
  query: string,
  limit = 20,
  offset = 0,
): Promise<{ id: string; full_name: string; purok: string; status: string; registered: string }[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('search_residents', {
    p_query: query, p_limit: limit, p_offset: offset,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; full_name: string; purok: string; status: string; registered: string }[];
}

/** Admin paginated residents fetch (session-gated, full columns). */
export async function adminGetResidents(
  token: string,
  limit = 100,
  offset = 0,
): Promise<Record<string, unknown>[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('admin_get_residents', {
    p_token: token, p_limit: limit, p_offset: offset,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

export async function adminGetResidentsCount(token: string): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc('admin_get_residents_count', { p_token: token });
  if (error) throw new Error(error.message);
  return ((data as { count?: number })?.count ?? 0) as number;
}

/** Admin paginated documents fetch (session-gated). */
export async function adminGetDocuments(
  token: string,
  limit = 100,
  offset = 0,
): Promise<Record<string, unknown>[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('admin_get_documents', {
    p_token: token, p_limit: limit, p_offset: offset,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

export async function adminGetDocumentsCount(token: string): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc('admin_get_documents_count', { p_token: token });
  if (error) throw new Error(error.message);
  return ((data as { count?: number })?.count ?? 0) as number;
}

/** Admin paginated complaints fetch (session-gated). */
export async function adminGetComplaints(
  token: string,
  limit = 100,
  offset = 0,
): Promise<Record<string, unknown>[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('admin_get_complaints', {
    p_token: token, p_limit: limit, p_offset: offset,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

export async function adminGetComplaintsCount(token: string): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc('admin_get_complaints_count', { p_token: token });
  if (error) throw new Error(error.message);
  return ((data as { count?: number })?.count ?? 0) as number;
}

/** End the current session. */
export async function logoutSession(): Promise<void> {
  const token = getSessionToken();
  if (!supabase || !token) return;
  try { await supabase.rpc('end_session', { p_token: token }); } catch { /* ignore */ }
  setSessionToken(null);
}

// ============================================================
// USER MANAGEMENT
// ============================================================

/** Fetch all users (password-stripped) via the get_users RPC. */
export async function getUsers() {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_users');
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ============================================================
// GENERIC CRUD
// ============================================================

export async function dbFetch<T = unknown>(
  table: string,
  filters: Record<string, unknown> = {},
  maxRows?: number,
): Promise<T[]> {
  if (!supabase) return [];
  let q = supabase.from(table).select('*');
  Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v as string); });
  if (maxRows !== undefined) q = q.limit(maxRows);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function dbInsert<T = unknown>(
  table: string,
  row: Record<string, unknown> | Record<string, unknown>[],
): Promise<T[]> {
  if (!supabase) throw new Error('offline');
  const { data, error } = await supabase.from(table).insert(row).select();
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function dbUpdate<T = unknown>(
  table: string,
  id: string | number,
  row: Record<string, unknown>,
): Promise<T[]> {
  if (!supabase) throw new Error('offline');
  const { data, error } = await supabase.from(table).update(row).eq('id', id).select();
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function dbDelete(table: string, id: string | number): Promise<void> {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Create a new user via the create_user RPC (password hashed server-side). */
export async function createUser(data: {
  id: number; name: string; username: string; email: string;
  password: string; role: string; initials: string;
}) {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.rpc('create_user', {
    p_id: data.id, p_name: data.name, p_username: data.username,
    p_email: data.email, p_password: data.password,
    p_role: data.role, p_initials: data.initials,
  });
  if (error) throw new Error(error.message);
}

/** Update a user via the update_user RPC (no password change). */
export async function updateUser(data: {
  id: number; name: string; username: string; email: string;
  role: string; initials: string;
}) {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.rpc('update_user', {
    p_id: data.id, p_name: data.name, p_username: data.username,
    p_email: data.email, p_role: data.role, p_initials: data.initials,
  });
  if (error) throw new Error(error.message);
}

/** Set user status (active/suspended) via set_user_status RPC. */
export async function setUserStatus(id: number, status: string) {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.rpc('set_user_status', { p_id: id, p_status: status });
  if (error) throw new Error(error.message);
}

/** Delete a user via the delete_user RPC. */
export async function deleteUser(id: number) {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.rpc('delete_user', { p_id: id });
  if (error) throw new Error(error.message);
}

// ============================================================
// SUGGESTION RPC (rate-limited, server-side)
// ============================================================

export async function recordSuggestion(
  identifier: string,
  name: string,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) throw new Error('offline');
  const { data, error } = await supabase.rpc('record_suggestion', {
    p_identifier: identifier,
    p_name:       name,
    p_content:    content,
  });
  if (error) throw new Error(error.message);
  return data;
}
