import { supabase, getSessionToken } from './supabase';

export function genId(prefix: string, len = 4): string {
  const n = Math.floor(Math.random() * 10 ** len).toString().padStart(len, '0');
  if (prefix === 'REQ') return `REQ-${new Date().getFullYear()}-${n}`;
  if (prefix === 'BLT') return `BLT-${new Date().getFullYear()}-${n.slice(-3)}`;
  if (prefix === 'RPT') return `RPT-${new Date().getFullYear()}-${n}`;
  if (prefix === 'PRJ') return `PRJ-${new Date().getFullYear()}-${n}`;
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
}, loggedInUser?: string) {
  if (!supabase) throw new Error('offline');
  if (loggedInUser) {
    const { error } = await supabase.rpc('admin_insert_document', {
      p_token: token(), p_id: data.id, p_resident: data.resident,
      p_type: data.type, p_purpose: data.purpose, p_date: data.date,
      p_contact: data.contact ?? '', p_status: data.status ?? 'Pending',
      p_id_upload: data.id_upload ?? '', p_logged_in_user: loggedInUser,
    });
    if (error) throw new Error(error.message);
    return;
  }
  const identifier = `${navigator.userAgent}-${screen.width}x${screen.height}`;
  const hash = Array.from(new TextEncoder().encode(identifier))
    .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  const { error } = await supabase.rpc('rate_limited_insert', {
    p_identifier: hash, p_form_type: 'document', p_table: 'documents',
    p_data: { ...data, status: data.status ?? 'Pending' },
  });
  if (error) throw new Error(error.message);
}

export async function insertResident(data: {
  fname: string; lname: string; purok: string; contact?: string;
  address?: string; gender?: string; dob?: string; household?: string;
  occupation?: string; civil_status?: string;
}, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_insert_resident', {
    p_token: token(), p_id: genId('RES', 6),
    p_fname: data.fname, p_lname: data.lname, p_purok: data.purok,
    p_contact: data.contact ?? 'N/A', p_address: data.address ?? 'Barangay Payatas',
    p_gender: data.gender ?? 'N/A', p_dob: data.dob ?? 'N/A',
    p_household: data.household ?? '', p_occupation: data.occupation ?? '',
    p_civil_status: data.civil_status ?? 'Single',
    p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function updateResident(id: string, data: Record<string, unknown>, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_resident', {
    p_token: token(), p_id: id, p_data: data, p_logged_in_user: loggedInUser,
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

export async function logAdminAction(action: string, module: string = "", details: string = "", loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_log_action', {
    p_token: token(), p_user_name: loggedInUser,
    p_action: action, p_module: module, p_details: details,
  });
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
  if (!trimmed) return null;

  const { data: exact, error: err1 } = await supabase.from('reports').select('*').eq('id', trimmed).maybeSingle();
  if (err1) throw new Error(err1.message);
  if (exact) return exact;

  const { data: partial, error: err2 } = await supabase
    .from('reports').select('*').ilike('id', `%${trimmed}%`).limit(1).maybeSingle();
  if (err2) throw new Error(err2.message);
  if (partial) return partial;

  const stripped = trimmed.replace(/[^A-Z0-9]/gi, '');
  if (stripped !== trimmed) {
    const { data: s, error: e } = await supabase.from('reports').select('*').ilike('id', `%${stripped}%`).limit(1).maybeSingle();
    if (e) throw new Error(e.message);
    if (s) return s;
  }

  const nums = trimmed.match(/\d+/g);
  if (nums) {
    for (const n of nums) {
      const { data: dn, error: en } = await supabase.from('reports').select('*').ilike('id', `%${n}%`).limit(1).maybeSingle();
      if (en) throw new Error(en.message);
      if (dn) return dn;

      const noPad = parseInt(n, 10).toString();
      if (noPad !== n) {
        const { data: dnp, error: enp } = await supabase.from('reports').select('*').ilike('id', `%${noPad}%`).limit(1).maybeSingle();
        if (enp) throw new Error(enp.message);
        if (dnp) return dnp;
      }

      const padded = n.padStart(5, '0');
      if (padded !== n) {
        const { data: dp, error: ep } = await supabase.from('reports').select('*').ilike('id', `%${padded}%`).limit(1).maybeSingle();
        if (ep) throw new Error(ep.message);
        if (dp) return dp;
      }
    }
  }

  const last4 = trimmed.slice(-4);
  if (/^\d{4}$/.test(last4)) {
    const { data: d4, error: e4 } = await supabase.from('reports').select('*').ilike('id', `%${last4}%`).limit(1).maybeSingle();
    if (e4) throw new Error(e4.message);
    if (d4) return d4;
  }

  return null;
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

export async function insertBusiness(data: {
  name: string; owner: string; category: string;
  contact?: string; address?: string; description?: string;
}, loggedInUser?: string) {
  if (!supabase) throw new Error('offline');
  if (loggedInUser) {
    const { error } = await supabase.rpc('admin_insert_business', {
      p_token: token(), p_name: data.name, p_owner: data.owner,
      p_category: data.category, p_contact: data.contact ?? '',
      p_address: data.address ?? '', p_description: data.description ?? '',
      p_logged_in_user: loggedInUser,
    });
    if (error) throw new Error(error.message);
    return;
  }
  const identifier = `${navigator.userAgent}-${screen.width}x${screen.height}`;
  const hash = Array.from(new TextEncoder().encode(identifier))
    .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  const { error } = await supabase.rpc('rate_limited_insert', {
    p_identifier: hash, p_form_type: 'business', p_table: 'business_registry',
    p_data: { ...data, status: 'pending' },
  });
  if (error) throw new Error(error.message);
}

export async function updateBusiness(id: string, data: Record<string, unknown>, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_business', {
    p_token: token(), p_id: id, p_data: data, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function deleteBusiness(id: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_delete_business', {
    p_token: token(), p_id: id, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function insertProject(data: {
  id: string; title: string; category: string;
  budget?: number; progress?: number; description?: string;
  target_date?: string; status?: string;
}, loggedInUser: string = "System") {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.rpc('admin_insert_project', {
    p_token: token(), p_id: data.id, p_title: data.title,
    p_category: data.category, p_budget: data.budget ?? 0,
    p_progress: data.progress ?? 0, p_description: data.description ?? '',
    p_target_date: data.target_date ?? '', p_status: data.status ?? 'Planned',
    p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function updateProject(id: string, data: Record<string, unknown>, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_project', {
    p_token: token(), p_id: id, p_data: data, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function deleteProject(id: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_delete_project', {
    p_token: token(), p_id: id, p_logged_in_user: loggedInUser,
  });
  if (error) throw new Error(error.message);
}

export async function insertClearanceRequest(data: {
  resident_id?: string; full_name: string; address: string;
  purpose: string; doc_type?: string; contact?: string;
  control_number: string; verification_code: string;
}) {
  if (!supabase) throw new Error('offline');
  const identifier = `${navigator.userAgent}-${screen.width}x${screen.height}`;
  const hash = Array.from(new TextEncoder().encode(identifier))
    .map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  const { error } = await supabase.rpc('rate_limited_insert', {
    p_identifier: hash, p_form_type: 'clearance', p_table: 'clearance_requests',
    p_data: data,
  });
  if (error) throw new Error(error.message);
}

export async function updateClearanceRequest(id: string, data: Record<string, unknown>, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_update_clearance_request', {
    p_token: token(), p_id: id, p_data: data, p_logged_in_user: loggedInUser,
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
