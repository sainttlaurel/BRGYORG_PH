// ============================================================
// SUPABASE CONFIGURATION
// Payatas Ledger — Civic Management System
// ============================================================

const SUPABASE_CONFIG = {
  url: 'https://xyaqigazszqhvvglqint.supabase.co',
  anonKey: 'sb_publishable_ftY2kTePsAkVcK-PrgTgiQ_jG636mXp'
};

// ============================================================
// INITIALIZE SUPABASE CLIENT
// ============================================================

let supabaseClient = null;

try {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('🚀 Supabase client initialized');

    (async () => {
      try {
        const { data, error } = await supabaseClient.from('users').select('id').limit(1);
        if (error) console.warn('⚠️ Supabase query test failed:', error.message);
        else console.log('✅ Supabase connected!', data);
      } catch (err) {
        console.warn('⚠️ Supabase test error:', err.message);
      }
    })();
  } else {
    console.warn('⚠️ Supabase SDK not loaded');
  }
} catch (err) {
  console.error('❌ Supabase initialization failed:', err.message);
  supabaseClient = null;
}

// ============================================================
// TABLE NAMES
// ============================================================

const DB_TABLES = {
  users: 'users',
  residents: 'residents',
  documents: 'documents',
  complaints: 'complaints',
  projects: 'projects',
  announcements: 'announcements',
};

// ============================================================
// GENERIC CRUD HELPERS
// ============================================================

function checkClient() {
  if (!supabaseClient) {
    console.error('❌ Supabase not initialized');
    throw new Error('offline');
  }
}

async function dbFetch(table, filters = {}) {
  checkClient();
  let q = supabaseClient.from(table).select('*');
  Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
  const { data, error } = await q;
  if (error) { console.error('FETCH ERROR (' + table + '):', error.message); throw error; }
  // Map description -> desc for complaints
  if (table === 'complaints' && Array.isArray(data)) {
    return data.map(c => ({ ...c, desc: c.description || c.desc || '' }));
  }
  return data;
}

async function dbInsert(table, row) {
  checkClient();
  let insertRow = { ...row };
  if (table === 'complaints') {
    if (insertRow.desc && !insertRow.description) insertRow.description = insertRow.desc;
    delete insertRow.desc;
  }
  const { data, error } = await supabaseClient.from(table).insert(insertRow).select();
  if (error) { console.error('INSERT ERROR (' + table + '):', error.message); throw error; }
  if (table === 'complaints' && Array.isArray(data)) {
    return data.map(c => ({ ...c, desc: c.description || '' }));
  }
  return data;
}

async function dbUpdate(table, id, row) {
  checkClient();
  let updateRow = { ...row };
  if (table === 'complaints') {
    if (updateRow.desc && !updateRow.description) updateRow.description = updateRow.desc;
    delete updateRow.desc;
  }
  const { data, error } = await supabaseClient.from(table).update(updateRow).eq('id', id).select();
  if (error) { console.error('UPDATE ERROR (' + table + '):', error.message); throw error; }
  return data;
}

async function dbDelete(table, id) {
  checkClient();
  const { error } = await supabaseClient.from(table).delete().eq('id', id);
  if (error) { console.error('DELETE ERROR (' + table + '):', error.message); throw error; }
  return { success: true };
}

// ============================================================
// AUTH — returns { user, session } shape that app.js expects
// ============================================================

async function sbAuthenticateUser(username, password) {
  checkClient();
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .or('username.eq."' + username + '",email.eq."' + username + '"')
    .limit(20);

  if (error) throw new Error('Authentication service error. Please try again.');
  if (!data || data.length === 0) throw new Error('Invalid username or password.');

  const user = data.find(u => u.password === password);
  if (!user) throw new Error('Invalid username or password.');

  // Update last_active (non-critical)
  try {
    await supabaseClient.from('users').update({ last_active: new Date().toLocaleString('en-PH') }).eq('id', user.id);
  } catch (e) { /* ignore */ }

  // Return { user, session } — shape app.js expects
  return {
    user: { ...user },
    session: {
      access_token: btoa(JSON.stringify({ id: user.id, ts: Date.now() })),
      user_id: user.id
    }
  };
}

// ============================================================
// GENERATE UNIQUE IDs FROM DB
// ============================================================

async function dbGenerateId(table, prefix) {
  checkClient();
  try {
    const { count, error } = await supabaseClient
      .from(table).select('*', { count: 'exact', head: true });
    const next = (!error && count != null) ? count + 1 : Math.floor(Math.random() * 9000) + 1000;
    return prefix + '-' + String(next).padStart(3, '0');
  } catch (e) {
    return prefix + '-' + String(Date.now()).slice(-6);
  }
}

// ============================================================
// DEBUG
// ============================================================

async function debugSupabase() {
  try {
    const data = await dbFetch(DB_TABLES.users);
    console.log('USERS:', data);
  } catch (err) {
    console.error('DEBUG ERROR:', err.message);
  }
}

window.debugSupabase = debugSupabase;
window.sbAuthenticateUser = sbAuthenticateUser;
window.dbGenerateId = dbGenerateId;

console.log('✅ supabase-config.js loaded');