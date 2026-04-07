// ============================================================
// SUPABASE CONFIGURATION
// Payatas Ledger - Civic Management System
// ============================================================

const isLocalFile = window.location.protocol === 'file:';

const SUPABASE_CONFIG = isLocalFile ? {
  url: null,
  anonKey: null
} : {
  url: 'https://xyaqigazszqhvvglqint.supabase.co',
  anonKey: 'sb_publishable_ftY2kTePsAkVcK-PrgTgiQ_jG636mXp'
};

// ============================================================
// INITIALIZE SUPABASE CLIENT
// ============================================================

let supabaseClient = null;

try {
  if (isLocalFile) {
    console.warn('⚠️ Running in local file mode - using offline/localStorage');
  }
  else if (typeof supabase !== 'undefined' && supabase.createClient && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {

    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

    console.log('🚀 Supabase client initialized');

    // ✅ SAFE CONNECTION TEST (no breaking)
    (async () => {
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .limit(1);

        if (error) {
          console.warn('⚠️ Supabase connected but query failed:', error.message);
        } else {
          console.log('✅ Supabase connected successfully!', data);
        }
      } catch (err) {
        console.warn('⚠️ Supabase test error:', err.message);
      }
    })();

  } else {
    console.warn('⚠️ Supabase SDK not loaded or config missing');
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

  Object.entries(filters).forEach(([k, v]) => {
    q = q.eq(k, v);
  });

  const { data, error } = await q;

  if (error) {
    console.error(`❌ FETCH ERROR (${table}):`, error.message);
    throw error;
  }

  return data;
}

async function dbInsert(table, row) {
  checkClient();

  const { data, error } = await supabaseClient
    .from(table)
    .insert(row)
    .select();

  if (error) {
    console.error(`❌ INSERT ERROR (${table}):`, error.message);
    throw error;
  }

  return data;
}

async function dbUpdate(table, id, row) {
  checkClient();

  const { data, error } = await supabaseClient
    .from(table)
    .update(row)
    .eq('id', id)
    .select();

  if (error) {
    console.error(`❌ UPDATE ERROR (${table}):`, error.message);
    throw error;
  }

  return data;
}

async function dbDelete(table, id) {
  checkClient();

  const { error } = await supabaseClient
    .from(table)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`❌ DELETE ERROR (${table}):`, error.message);
    throw error;
  }

  return { success: true };
}

// ============================================================
// DEBUG TEST (run manually in console if needed)
// ============================================================

async function debugSupabase() {
  try {
    const data = await dbFetch(DB_TABLES.users);
    console.log('🔥 USERS:', data);
  } catch (err) {
    console.error('🔥 DEBUG ERROR:', err.message);
  }
}

async function sbAuthenticateUser(username, password) {
  checkClient();

  // Try matching by username first, then email
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .or(`username.eq.${username},email.eq.${username}`)
    .eq('password', password)
    .single();

  if (error || !data) {
    throw new Error('Invalid username or password.');
  }

  // Return in the same shape as Supabase Auth would
  return { user: data };
}

// expose globally (optional)
window.debugSupabase = debugSupabase;
window.sbAuthenticateUser = sbAuthenticateUser;

// ============================================================
// STATUS LOG
// ============================================================

console.log('✅ supabase-config.js loaded');