import { supabase, getSessionToken } from './supabase';

export function genId(prefix: string, len = 4): string {
  const n = Math.floor(Math.random() * 10 ** len).toString().padStart(len, '0');
  if (prefix === 'REQ') return `REQ-${new Date().getFullYear()}-${n}`;
  if (prefix === 'BLT') return `BLT-${new Date().getFullYear()}-${n.slice(-3)}`;
  if (prefix === 'RPT') return `RPT-${new Date().getFullYear()}-${n}`;
  return `${prefix}-${n}`;
}

function token(): string {
  const t = getSessionToken();
  if (!t) throw new Error('No active session');
  return t;
}

export async function updateDocumentStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_document_status', {
    p_token: token(), p_id: id, p_status: status, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function insertAnnouncement(data: { title: string; category: string; content: string; date: string; priority?: string }, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_insert_announcement', {
    p_token: token(), p_id: genId('ANN'),
    p_title: data.title, p_category: data.category,
    p_content: data.content, p_date: data.date,
    p_priority: data.priority ?? 'normal',
    p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function updateAnnouncement(id: string, data: { title?: string; category?: string; content?: string; visible?: boolean; priority?: string }, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_announcement', {
    p_token: token(), p_id: id,
    p_data: data,
    p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function deleteAnnouncement(id: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_delete_announcement', {
    p_token: token(), p_id: id, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function insertBlotterCase(data: {
  complainant: string; respondent: string; incident: string; date: string; time: string;
  location: string; summary: string; handler: string;
}, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_insert_blotter', {
    p_token: token(), p_id: genId('BLT'),
    p_complainant: data.complainant, p_respondent: data.respondent,
    p_incident: data.incident, p_date: data.date, p_time: data.time,
    p_location: data.location, p_summary: data.summary,
    p_handler: data.handler, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function updateBlotterStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_blotter_status', {
    p_token: token(), p_id: id, p_status: status, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function insertPoll(data: { question: string; options: string[]; expires_at: string | null }, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_insert_poll', {
    p_token: token(),
    p_question: data.question, p_options: data.options,
    p_expires_at: data.expires_at, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function deletePoll(id: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_delete_poll', {
    p_token: token(), p_id: id, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function updatePollStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_poll', {
    p_token: token(), p_id: id,
    p_data: { status }, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function updatePoll(id: string, data: { question?: string; options?: string[]; expires_at?: string | null }, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_poll', {
    p_token: token(), p_id: id, p_data: data, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function insertDocument(data: {
  id: string; resident: string; type: string; purpose: string; date: string;
  contact?: string; status?: string; id_upload?: string;
}, _loggedInUser?: string) {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.from('documents').insert({
    ...data,
    status: data.status ?? 'Pending',
  });
  if (error) throw new Error(error.message);
}

export async function insertResident(data: {
  fname: string; lname: string; purok: string; contact?: string;
  address?: string; gender?: string; dob?: string; household?: string;
  occupation?: string; civil_status?: string;
}, _loggedInUser?: string) {
  if (!supabase) return;
  const { error } = await supabase.from('residents').insert({
    id: genId('RES', 6),
    ...data,
    contact: data.contact ?? 'N/A',
    address: data.address ?? 'Barangay Payatas',
    gender: data.gender ?? 'N/A',
    dob: data.dob ?? 'N/A',
  });
  if (error) throw new Error(error.message);
}

export async function updateResident(id: string, data: Record<string, unknown>, _loggedInUser?: string) {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_resident', {
    p_token: token(), p_id: id, p_data: data,
  });
  if (error) throw new Error(error.message);
}

export async function deleteResident(id: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_delete_resident', {
    p_token: token(), p_id: id, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function insertOfficial(data: {
  name: string; position: string; committee?: string;
  contact?: string; email?: string; since?: string; bio?: string;
}, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_insert_official', {
    p_token: token(), p_data: data, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function updateOfficial(id: number, data: Record<string, unknown>, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_official', {
    p_token: token(), p_id: id, p_data: data, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function deleteOfficial(id: number, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_delete_official', {
    p_token: token(), p_id: id, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function insertAuditLog(data: {
  user_name: string; action: string; details?: string;
  module?: string; ip_address?: string;
}) {
  if (!supabase) return;
  const { error } = await supabase.from('audit_logs').insert(data);
  if (error) throw new Error(error.message);
}

export async function insertSuggestion(data: { name: string; content: string }) {
  if (!supabase) throw new Error('offline');
  const identifier = `${navigator.userAgent}-${screen.width}x${screen.height}`;
  const hash = Array.from(new TextEncoder().encode(identifier))
    .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  const { error } = await supabase.rpc('rate_limited_insert', {
    p_identifier: hash, p_form_type: 'suggestion', p_table: 'suggestions',
    p_data: { name: data.name || 'Anonymous', content: data.content, status: 'pending' },
  });
  if (error) throw new Error(error.message);
}

// Public form submissions (no session token needed — use anon INSERT policies)
export async function insertVolunteer(data: {
  full_name: string; email: string; contact: string; body_conditions: string;
}) {
  if (!supabase) throw new Error('offline');
  const identifier = `${navigator.userAgent}-${screen.width}x${screen.height}`;
  const hash = Array.from(new TextEncoder().encode(identifier))
    .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  const { error } = await supabase.rpc('rate_limited_insert', {
    p_identifier: hash, p_form_type: 'volunteer', p_table: 'volunteer_signups',
    p_data: data,
  });
  if (error) throw new Error(error.message);
}

export async function deleteContactMessage(id: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_delete_contact_message', {
    p_token: token(), p_id: id, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function updateContactMessageStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_contact_message_status', {
    p_token: token(), p_id: id, p_status: status, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function insertContactMessage(data: { name: string; email: string; subject: string; message: string }) {
  if (!supabase) throw new Error('offline');
  const identifier = `${navigator.userAgent}-${screen.width}x${screen.height}`;
  const hash = Array.from(new TextEncoder().encode(identifier))
    .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  const { error } = await supabase.rpc('rate_limited_insert', {
    p_identifier: hash, p_form_type: 'contact', p_table: 'contact_messages',
    p_data: data,
  });
  if (error) throw new Error(error.message);
}

export async function insertReport(data: {
  id: string; category: string; description: string; location: string;
  urgency: string; reporter_name?: string; reporter_contact?: string;
}) {
  if (!supabase) throw new Error('offline');
  const identifier = `${navigator.userAgent}-${screen.width}x${screen.height}`;
  const hash = Array.from(new TextEncoder().encode(identifier))
    .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  const { error } = await supabase.rpc('rate_limited_insert', {
    p_identifier: hash, p_form_type: 'report', p_table: 'reports',
    p_data: { ...data, status: 'pending' },
  });
  if (error) throw new Error(error.message);
}

export async function getReportByRef(ref: string): Promise<Record<string, unknown> | null> {
  if (!supabase) return null;
  const trimmed = ref.trim();
  const { data, error } = await supabase.from('reports').select('*').eq('id', trimmed).maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data;
  const { data: fuzzy, error: fuzzyErr } = await supabase
    .from('reports').select('*').ilike('id', `%${trimmed}%`).limit(1).maybeSingle();
  if (fuzzyErr) throw new Error(fuzzyErr.message);
  return fuzzy ?? null;
}

export async function updateReportStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_report_status', {
    p_token: token(), p_id: id, p_status: status, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function updateSuggestionStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_suggestion_status', {
    p_token: token(), p_id: id, p_status: status, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function updateSuggestionReply(id: string, admin_reply: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_reply_suggestion', {
    p_token: token(), p_id: id, p_admin_reply: admin_reply, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function updateVolunteerStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_volunteer_status', {
    p_token: token(), p_id: id, p_status: status, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function submitVote(pollId: string, optionIndex: string) {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.rpc('cast_vote', {
    p_poll_id: pollId, p_option_index: parseInt(optionIndex),
  });
  if (error) throw new Error(error.message);
}

export async function uploadLogo(file: File): Promise<string> {
  if (!supabase) throw new Error('offline');
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `logo-${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage.from('logos').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (uploadErr) throw new Error(uploadErr.message);
  const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
  return urlData.publicUrl;
}
