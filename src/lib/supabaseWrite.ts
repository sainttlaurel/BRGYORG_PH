import { supabase } from './supabase';

export function genId(prefix: string, len = 4): string {
  const n = Math.floor(Math.random() * 10 ** len).toString().padStart(len, '0');
  if (prefix === 'REQ') return `REQ-${new Date().getFullYear()}-${n}`;
  if (prefix === 'BLT') return `BLT-${new Date().getFullYear()}-${n.slice(-3)}`;
  if (prefix === 'RPT') return `RPT-${new Date().getFullYear()}-${n}`;
  return `${prefix}-${n}`;
}

export async function insertAnnouncement(data: { title: string; category: string; content: string; date: string; priority?: string }, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('announcements').insert({
    id: genId('ANN'),
    title: data.title,
    category: data.category,
    content: data.content,
    date: data.date,
    priority: data.priority ?? 'normal',
  });
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Created announcement: ${data.title}`, module: "Announcements", details: `Category: ${data.category}` }).catch(() => {});
}

export async function updateAnnouncement(id: string, data: { title?: string; category?: string; content?: string; visible?: boolean; priority?: string }, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('announcements').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Updated announcement: ${id}`, module: "Announcements" }).catch(() => {});
}

export async function deleteAnnouncement(id: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Deleted announcement: ${id}`, module: "Announcements" }).catch(() => {});
}

export async function updateDocumentStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('documents').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Updated document ${id} status to ${status}`, module: "Documents" }).catch(() => {});
}

export async function insertBlotterCase(data: {
  complainant: string; respondent: string; incident: string; date: string; time: string;
  location: string; summary: string; handler: string;
}, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('complaints').insert({
    id: genId('BLT'),
    complainant: data.complainant,
    category: data.incident,
    date: data.date,
    status: 'ongoing',
    description: data.summary,
    respondent: data.respondent,
    location: data.location,
    time: data.time,
    handler: data.handler,
  });
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Created blotter case`, module: "Blotter", details: `Complainant: ${data.complainant}, Incident: ${data.incident}` }).catch(() => {});
}

export async function updateBlotterStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('complaints').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Updated blotter case ${id} status to ${status}`, module: "Blotter" }).catch(() => {});
}

export async function insertPoll(data: { question: string; options: string[]; expires_at: string | null }, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('polls').insert({
    question: data.question,
    options: data.options,
    expires_at: data.expires_at,
    status: 'active',
  });
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Created poll: ${data.question}`, module: "Polls" }).catch(() => {});
}

export async function deletePoll(id: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('polls').delete().eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Deleted poll: ${id}`, module: "Polls" }).catch(() => {});
}

export async function updatePollStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('polls').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Updated poll ${id} status to ${status}`, module: "Polls" }).catch(() => {});
}

export async function updatePoll(id: string, data: { question?: string; options?: string[]; expires_at?: string | null }, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('polls').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Updated poll: ${id}`, module: "Polls" }).catch(() => {});
}

export async function insertDocument(data: {
  id: string; resident: string; type: string; purpose: string; date: string;
  contact?: string; status?: string; id_upload?: string;
}) {
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
}, loggedInUser: string = "System") {
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
  insertAuditLog({ user_name: loggedInUser, action: `Created resident: ${data.fname} ${data.lname}`, module: "Residents", details: `Purok: ${data.purok}` }).catch(() => {});
}

export async function updateResident(id: string, data: Record<string, unknown>, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('residents').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Updated resident: ${id}`, module: "Residents" }).catch(() => {});
}

export async function deleteResident(id: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('residents').delete().eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Deleted resident: ${id}`, module: "Residents" }).catch(() => {});
}

export async function insertOfficial(data: {
  name: string; position: string; committee?: string;
  contact?: string; email?: string; since?: string; bio?: string;
}, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('officials').insert(data);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Created official: ${data.name}`, module: "Officials", details: `Position: ${data.position}` }).catch(() => {});
}

export async function updateOfficial(id: number, data: Record<string, unknown>, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('officials').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Updated official: ${id}`, module: "Officials" }).catch(() => {});
}

export async function deleteOfficial(id: number, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('officials').delete().eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Deleted official: ${id}`, module: "Officials" }).catch(() => {});
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
  const { error } = await supabase.from('suggestions').insert(data);
  if (error) throw new Error(error.message);
}

export async function insertVolunteer(data: {
  full_name: string; email: string; contact: string; body_conditions: string;
}) {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.from('volunteer_signups').insert(data);
  if (error) throw new Error(error.message);
}

export async function insertReport(data: {
  id: string; category: string; description: string; location: string;
  urgency: string; reporter_name?: string; reporter_contact?: string;
}) {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.from('reports').insert({ ...data, status: 'pending' });
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
  const { error } = await supabase.from('reports').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Updated report ${id} status to ${status}`, module: "Reports" }).catch(() => {});
}

export async function updateSuggestionStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('suggestions').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Updated suggestion ${id} status to ${status}`, module: "Suggestions" }).catch(() => {});
}

export async function updateSuggestionReply(id: string, admin_reply: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('suggestions').update({ admin_reply, status: 'published' }).eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Replied to suggestion: ${id}`, module: "Suggestions" }).catch(() => {});
}

export async function updateVolunteerStatus(id: string, status: string, loggedInUser: string = "System") {
  if (!supabase) return;
  const { error } = await supabase.from('volunteer_signups').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  insertAuditLog({ user_name: loggedInUser, action: `Updated volunteer ${id} status to ${status}`, module: "Volunteers" }).catch(() => {});}

export async function insertContactMessage(data: { name: string; email: string; subject: string; message: string }) {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.from('contact_messages').insert(data);
  if (error) throw new Error(error.message);
}

export async function submitVote(pollId: string, optionIndex: string) {
  if (!supabase) throw new Error('offline');
  const { data: poll, error: fetchErr } = await supabase.from('polls').select('votes').eq('id', pollId).single();
  if (fetchErr) throw new Error(fetchErr.message);
  const votes = (poll?.votes as Record<string, number>) ?? {};
  votes[optionIndex] = (votes[optionIndex] ?? 0) + 1;
  const { error } = await supabase.from('polls').update({ votes }).eq('id', pollId);
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
