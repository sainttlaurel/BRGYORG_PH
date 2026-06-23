// ============================================================
// SUPABASE CONFIGURATION
// Payatas Ledger — Barangay Civic Management Platform
// ============================================================

const SUPABASE_CONFIG = {
  url: 'https://xyaqigazszqhvvglqint.supabase.co',
  anonKey: 'sb_publishable_ftY2kTePsAkVcK-PrgTgiQ_jG636mXp'
};

// ============================================================
// BARANGAY CONFIG — single source of truth for branding/contact
// Admin settings in localStorage override these defaults at runtime.
// ============================================================

const BRGY_CONFIG = {
  name: 'Barangay Payatas',
  district: 'Quezon City, Metro Manila',
  address: 'Litex Road, Barangay Payatas, QC 1119',
  phone: '+63 2 8123 4567',
  email: 'payatas.ledger@qc.gov.ph',
  supportEmail: 'support@payatas.ph',
  version: '3.0.0',
  logo: 'img/logo-payatas.png',
  verifyUrl: 'index.html#verify',
};

function getBrgySettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('brgy_settings') || '{}');
    const merged = { ...BRGY_CONFIG, ...saved };
    if (saved.contact && !saved.phone) merged.phone = saved.contact;
    return merged;
  } catch (_) {
    return { ...BRGY_CONFIG };
  }
}

function applyBrgySettingsToDOM() {
  const cfg = getBrgySettings();
  const addr = document.getElementById('footer-address');
  const phone = document.getElementById('footer-phone');
  const email = document.getElementById('footer-email');
  if (addr) addr.textContent = cfg.address || cfg.name;
  if (phone) phone.textContent = cfg.phone;
  if (email) email.textContent = cfg.supportEmail || cfg.email;
}

// ============================================================
// INITIALIZE SUPABASE CLIENT
// ============================================================

let supabaseClient = null;

try {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('🚀 Supabase client initialized — Payatas Ledger');

    (async () => {
      try {
        const { data, error } = await supabaseClient.from('users').select('id').limit(1);
        if (error) console.warn('⚠️ Supabase connectivity test failed:', error.message);
        else console.log('✅ Supabase connected successfully!');
      } catch (err) {
        console.warn('⚠️ Supabase test error:', err.message);
      }
    })();
  } else {
    console.warn('⚠️ Supabase SDK not loaded — ensure CDN script is included before this file');
  }
} catch (err) {
  console.error('❌ Supabase initialization failed:', err.message);
  supabaseClient = null;
}

// ============================================================
// TABLE NAMES
// ============================================================

const DB_TABLES = {
  users:              'users',
  residents:          'residents',
  documents:          'documents',
  complaints:         'complaints',
  projects:           'projects',
  announcements:      'announcements',
  clearanceRequests:  'clearance_requests',
  documentCounters:   'document_counters',
  suggestions:        'suggestions',
  polls:              'polls',
  volunteerSignups:   'volunteer_signups',
  businessRegistry:   'business_registry',
  suggestionLimits:   'suggestion_limits',
};

// ============================================================
// CLIENT GUARD
// ============================================================

function checkClient() {
  if (!supabaseClient) {
    console.error('❌ Supabase not initialized — running in offline mode');
    throw new Error('offline');
  }
}

// ============================================================
// GENERIC CRUD HELPERS
// ============================================================

/**
 * Fetch all rows from a table, with optional key=value filters.
 * @param {string} table
 * @param {Object} filters  e.g. { status: 'Active' }
 */
async function dbFetch(table, filters = {}) {
  checkClient();
  let q = supabaseClient.from(table).select('*');
  Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
  const { data, error } = await q;
  if (error) { console.error(`FETCH ERROR (${table}):`, error.message); throw error; }

  // Normalize complaints: map description -> desc for the app layer
  if (table === 'complaints' && Array.isArray(data)) {
    return data.map(c => ({ ...c, desc: c.description || c.desc || '' }));
  }
  return data;
}

/**
 * Insert one or more rows into a table. Returns the inserted rows.
 * @param {string} table
 * @param {Object|Object[]} row
 */
async function dbInsert(table, row) {
  checkClient();
  let insertRow = Array.isArray(row) ? row.map(r => _normalizeForInsert(table, r)) : _normalizeForInsert(table, row);
  const { data, error } = await supabaseClient.from(table).insert(insertRow).select();
  if (error) { console.error(`INSERT ERROR (${table}):`, error.message); throw error; }

  if (table === 'complaints' && Array.isArray(data)) {
    return data.map(c => ({ ...c, desc: c.description || '' }));
  }
  return data;
}

/**
 * Update a row by id.
 * @param {string} table
 * @param {string|number} id
 * @param {Object} row  Fields to update
 */
async function dbUpdate(table, id, row) {
  checkClient();
  const updateRow = _normalizeForInsert(table, { ...row });
  const { data, error } = await supabaseClient.from(table).update(updateRow).eq('id', id).select();
  if (error) { console.error(`UPDATE ERROR (${table}):`, error.message); throw error; }
  return data;
}

/**
 * Delete a row by id.
 * @param {string} table
 * @param {string|number} id
 */
async function dbDelete(table, id) {
  checkClient();
  const { error } = await supabaseClient.from(table).delete().eq('id', id);
  if (error) { console.error(`DELETE ERROR (${table}):`, error.message); throw error; }
  return { success: true };
}

/**
 * Fetch a single row by id.
 * @param {string} table
 * @param {string|number} id
 */
async function dbFetchOne(table, id) {
  checkClient();
  const { data, error } = await supabaseClient.from(table).select('*').eq('id', id).single();
  if (error) { console.error(`FETCH_ONE ERROR (${table}):`, error.message); throw error; }
  return data;
}

// Internal: normalize field names before writes
function _normalizeForInsert(table, row) {
  const r = { ...row };
  if (table === 'complaints') {
    if (r.desc && !r.description) r.description = r.desc;
    delete r.desc;
  }
  return r;
}

// ============================================================
// AUTHENTICATION
// Returns { user } shape expected by app.js
// ============================================================

async function sbAuthenticateUser(username, password) {
  checkClient();

  // Prefer server-side auth RPC (supports bcrypt + legacy plaintext fallback)
  try {
    const { data, error } = await supabaseClient.rpc('authenticate_user', {
      p_login: username,
      p_password: password,
    });
    if (!error && data) {
      if (data.success === false) throw new Error(data.error || 'Invalid username or password.');
      if (data.user) {
        const { password: _pw, ...safeUser } = data.user;
        return { user: safeUser };
      }
    }
  } catch (rpcErr) {
    if (rpcErr.message && !rpcErr.message.includes('Invalid') && !rpcErr.message.includes('suspended')) {
      console.warn('authenticate_user RPC unavailable, using legacy auth:', rpcErr.message);
    } else {
      throw rpcErr;
    }
  }

  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .or(`username.eq.${username},email.eq.${username}`)
    .limit(20);

  if (error) throw new Error('Authentication service error. Please try again.');
  if (!data || data.length === 0) throw new Error('Invalid username or password.');

  const user = data.find(u => u.password === password);
  if (!user) throw new Error('Invalid username or password.');

  if (user.status === 'Suspended') {
    throw new Error('Your account has been suspended. Contact the administrator.');
  }

  try {
    await supabaseClient
      .from('users')
      .update({ last_active: new Date().toLocaleString('en-PH') })
      .eq('id', user.id);
  } catch (_) { /* non-critical */ }

  return { user: { ...user } };
}

async function sbHashPassword(plain) {
  checkClient();
  try {
    const { data, error } = await supabaseClient.rpc('hash_password', { p_plain: plain });
    if (!error && data) return data;
  } catch (_) { /* fallback below */ }
  return plain;
}

async function sbUpdatePassword(userId, currentPassword, newPassword) {
  checkClient();
  try {
    const { data, error } = await supabaseClient.rpc('update_user_password', {
      p_user_id: userId,
      p_current: currentPassword,
      p_new: newPassword,
    });
    if (!error && data) {
      if (data.success === false) throw new Error(data.error || 'Password update failed.');
      return true;
    }
  } catch (rpcErr) {
    if (!rpcErr.message?.includes('incorrect') && !rpcErr.message?.includes('not found')) {
      console.warn('update_user_password RPC unavailable:', rpcErr.message);
    } else {
      throw rpcErr;
    }
  }
  return false;
}

async function sbPingLatency() {
  checkClient();
  const start = performance.now();
  const { error } = await supabaseClient.from('users').select('id').limit(1);
  const ms = Math.round(performance.now() - start);
  if (error) throw error;
  return ms;
}

// ============================================================
// ID GENERATION
// ============================================================

/**
 * Generate a sequential prefixed ID based on table row count.
 * e.g. dbGenerateId('residents', 'PAY') → 'PAY-000042'
 */
async function dbGenerateId(table, prefix) {
  checkClient();
  try {
    const { data, error } = await supabaseClient.rpc('get_next_entity_id', {
      p_table: table,
      p_prefix: prefix,
    });
    if (!error && data) return data;
  } catch (_) { /* fallback below */ }

  try {
    const { count, error } = await supabaseClient
      .from(table)
      .select('*', { count: 'exact', head: true });
    const next = (!error && count != null) ? count + 1 : Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${String(next).padStart(6, '0')}`;
  } catch (_) {
    return `${prefix}-${String(Date.now()).slice(-6)}`;
  }
}

// ============================================================
// CLEARANCE / DOCUMENT COUNTER RPC
// ============================================================

/**
 * Get next sequential clearance number for a given year via RPC.
 * Requires the get_next_clearance_number(p_year INT) function in Supabase.
 */
async function getNextClearanceNumber(year) {
  checkClient();
  const { data, error } = await supabaseClient.rpc('get_next_clearance_number', { p_year: year });
  if (error) throw error;
  return data;
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================

/**
 * Subscribe to live changes on a table.
 * @param {string} table
 * @param {Function} callback  Called with { eventType, new: row, old: row }
 * @returns {RealtimeChannel} Call .unsubscribe() to clean up.
 */
function dbSubscribe(table, callback) {
  if (!supabaseClient) return null;
  return supabaseClient
    .channel(`realtime:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}

// ============================================================
// COMMUNITY HUB HELPERS
// ============================================================

/** Fetch published suggestions with optional pagination */
async function fetchSuggestions(limit = 20, offset = 0) {
  checkClient();
  const { data, error } = await supabaseClient
    .from('suggestions')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data;
}

/** Fetch active polls */
async function fetchPolls() {
  checkClient();
  const { data, error } = await supabaseClient
    .from('polls')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Cast a vote on a poll option */
async function castVote(pollId, optionIndex) {
  checkClient();
  // Fetch current votes
  const { data: poll, error: fetchErr } = await supabaseClient
    .from('polls')
    .select('votes')
    .eq('id', pollId)
    .single();
  if (fetchErr) throw fetchErr;

  const votes = poll.votes || {};
  votes[String(optionIndex)] = (votes[String(optionIndex)] || 0) + 1;

  const { data, error } = await supabaseClient
    .from('polls')
    .update({ votes })
    .eq('id', pollId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Update reaction counts on announcements or projects */
async function updateReaction(table, id, reactionType) {
  checkClient();
  const { data: row, error: fetchErr } = await supabaseClient
    .from(table)
    .select('reactions')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;

  const reactions = row.reactions || { likes: 0, hearts: 0 };
  reactions[reactionType] = (reactions[reactionType] || 0) + 1;

  const { data, error } = await supabaseClient
    .from(table)
    .update({ reactions })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// DEBUG HELPERS (development only)
// ============================================================

async function debugSupabase() {
  if (!supabaseClient) { console.error('No Supabase client'); return; }
  try {
    const results = await Promise.allSettled([
      dbFetch('users'),
      dbFetch('residents'),
      dbFetch('documents'),
      dbFetch('complaints'),
      dbFetch('projects'),
      dbFetch('announcements'),
    ]);
    const labels = ['users', 'residents', 'documents', 'complaints', 'projects', 'announcements'];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') console.log(`✅ ${labels[i]}:`, r.value?.length ?? 0, 'rows');
      else console.warn(`❌ ${labels[i]}:`, r.reason?.message);
    });
  } catch (err) {
    console.error('DEBUG ERROR:', err.message);
  }
}

// ============================================================
// GLOBAL EXPORTS
// ============================================================

window.supabaseClient       = supabaseClient;
window.SUPABASE_CONFIG      = SUPABASE_CONFIG;
window.BRGY_CONFIG          = BRGY_CONFIG;
window.getBrgySettings      = getBrgySettings;
window.applyBrgySettingsToDOM = applyBrgySettingsToDOM;
window.DB_TABLES            = DB_TABLES;
window.dbFetch              = dbFetch;
window.dbFetchOne           = dbFetchOne;
window.dbInsert             = dbInsert;
window.dbUpdate             = dbUpdate;
window.dbDelete             = dbDelete;
window.dbGenerateId         = dbGenerateId;
window.dbSubscribe          = dbSubscribe;
window.sbAuthenticateUser   = sbAuthenticateUser;
window.sbHashPassword       = sbHashPassword;
window.sbUpdatePassword     = sbUpdatePassword;
window.sbPingLatency        = sbPingLatency;
window.getNextClearanceNumber = getNextClearanceNumber;
window.fetchSuggestions     = fetchSuggestions;
window.fetchPolls           = fetchPolls;
window.castVote             = castVote;
window.updateReaction       = updateReaction;
window.debugSupabase        = debugSupabase;

console.log('✅ supabase-config.js loaded — Payatas Ledger v3');
