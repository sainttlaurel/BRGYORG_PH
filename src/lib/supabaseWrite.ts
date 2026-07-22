import { supabase } from './supabase';

function genId(prefix: string, len = 4): string {
  const n = Math.floor(Math.random() * 10 ** len).toString().padStart(len, '0');
  if (prefix === 'REQ') return `REQ-${new Date().getFullYear()}-${n}`;
  if (prefix === 'BLT') return `BLT-${new Date().getFullYear()}-${n.slice(-3)}`;
  return `${prefix}-${n}`;
}

export async function insertAnnouncement(data: { title: string; category: string; content: string; date: string }) {
  if (!supabase) return;
  const { error } = await supabase.from('announcements').insert({
    id: genId('ANN'),
    ...data,
  });
  if (error) throw new Error(error.message);
}

export async function updateAnnouncement(id: string, data: { title?: string; category?: string; content?: string; visible?: boolean }) {
  if (!supabase) return;
  const { error } = await supabase.from('announcements').update(data).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAnnouncement(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateDocumentStatus(id: string, status: string) {
  if (!supabase) return;
  const { error } = await supabase.from('documents').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function insertBlotterCase(data: {
  complainant: string; respondent: string; incident: string; date: string; time: string;
  location: string; summary: string; handler: string;
}) {
  if (!supabase) return;
  const { error } = await supabase.from('complaints').insert({
    id: genId('BLT'),
    complainant: data.complainant,
    category: data.incident,
    date: data.date,
    status: 'ongoing',
    description: data.summary,
  });
  if (error) throw new Error(error.message);
}

export async function updateBlotterStatus(id: string, status: string) {
  if (!supabase) return;
  const { error } = await supabase.from('complaints').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function insertPoll(data: { question: string; options: string[]; expires_at: string | null }) {
  if (!supabase) return;
  const { error } = await supabase.from('polls').insert({
    question: data.question,
    options: data.options,
    expires_at: data.expires_at,
    status: 'active',
  });
  if (error) throw new Error(error.message);
}

export async function deletePoll(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('polls').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updatePollStatus(id: string, status: string) {
  if (!supabase) return;
  const { error } = await supabase.from('polls').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updatePoll(id: string, data: { question?: string; options?: string[]; expires_at?: string | null }) {
  if (!supabase) return;
  const { error } = await supabase.from('polls').update(data).eq('id', id);
  if (error) throw new Error(error.message);
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
}) {
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

export async function updateResident(id: string, data: Record<string, unknown>) {
  if (!supabase) return;
  const { error } = await supabase.from('residents').update(data).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteResident(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('residents').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function insertOfficial(data: {
  name: string; position: string; committee?: string;
  contact?: string; email?: string; since?: string; bio?: string;
}) {
  if (!supabase) return;
  const { error } = await supabase.from('officials').insert(data);
  if (error) throw new Error(error.message);
}

export async function updateOfficial(id: number, data: Record<string, unknown>) {
  if (!supabase) return;
  const { error } = await supabase.from('officials').update(data).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteOfficial(id: number) {
  if (!supabase) return;
  const { error } = await supabase.from('officials').delete().eq('id', id);
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
