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
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5YXFpZ2F6c3pxaHF2Z2xxaW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyOTI5NDcsImV4cCI6MjA1ODg2ODk0N30.1sM3YnH3_qE8vZ8gLkXvJvX0yL0tE0nO5tL0d4N8Yc'
};

// ============================================================
// INITIALIZE SUPABASE CLIENT
// ============================================================

let supabaseClient = null;

try {
  if (isLocalFile) {
    console.warn('Running in local file mode - using offline/localStorage storage');
  } else if (typeof supabase !== 'undefined' && supabase.createClient && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

    // Test connection
    supabaseClient.from('users').select('count').limit(1)
      .then(({ error }) => {
        if (error) {
          console.warn('Supabase: Connection failed, switching to offline mode:', error.message);
          supabaseClient = null;
        } else {
          console.log('✅ Supabase connected successfully!');
        }
      })
      .catch((err) => {
        console.warn('Supabase: Running in offline mode:', err.message);
        supabaseClient = null;
      });
  } else {
    console.warn('Supabase SDK not loaded or config missing - Running in offline mode.');
  }
} catch (err) {
  console.warn('Supabase initialization failed:', err.message, '- Running in offline mode.');
  supabaseClient = null;
}

// ============================================================
// TABLE NAMES — match your app.js data exactly
// ============================================================

const DB_TABLES = {
  users:         'users',
  residents:     'residents',
  documents:     'documents',
  complaints:    'complaints',
  projects:      'projects',
  announcements: 'announcements',
};

// ============================================================
// GENERIC CRUD HELPERS
// ============================================================

async function dbFetch(table, filters = {}) {
  if (!supabaseClient) throw new Error('offline');
  let q = supabaseClient.from(table).select('*');
  Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function dbInsert(table, row) {
  if (!supabaseClient) throw new Error('offline');
  const { data, error } = await supabaseClient.from(table).insert(row).select();
  if (error) throw error;
  return data;
}

async function dbUpdate(table, id, row) {
  if (!supabaseClient) throw new Error('offline');
  const { data, error } = await supabaseClient.from(table).update(row).eq('id', id).select();
  if (error) throw error;
  return data;
}

async function dbDelete(table, id) {
  if (!supabaseClient) throw new Error('offline');
  const { error } = await supabaseClient.from(table).delete().eq('id', id);
  if (error) throw error;
  return { success: true };
}

// ============================================================
// USERS
// Fields: id, name, username, password, role, email, status,
//         last_active, initials
// ============================================================

async function sbGetUsers() {
  return await dbFetch(DB_TABLES.users);
}

async function sbCreateUser(data) {
  return await dbInsert(DB_TABLES.users, {
    name:        data.name,
    username:    data.username,
    password:    data.password,
    role:        data.role        || 'Staff',
    email:       data.email       || '',
    status:      data.status      || 'Active',
    last_active: data.lastActive  || 'Just now',
    initials:    data.initials    || '',
  });
}

async function sbUpdateUser(id, data) {
  return await dbUpdate(DB_TABLES.users, id, {
    name:        data.name,
    username:    data.username,
    password:    data.password,
    role:        data.role,
    email:       data.email,
    status:      data.status,
    last_active: data.lastActive,
    initials:    data.initials,
  });
}

async function sbDeleteUser(id) {
  return await dbDelete(DB_TABLES.users, id);
}

async function sbAuthenticateUser(username, password) {
  if (!supabaseClient) throw new Error('offline');
  const { data, error } = await supabaseClient
    .from(DB_TABLES.users)
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// RESIDENTS
// Fields: id, fname, lname, purok, contact, status,
//         registered, address, gender, dob, notes
// ============================================================

async function sbGetResidents() {
  return await dbFetch(DB_TABLES.residents);
}

async function sbCreateResident(data) {
  return await dbInsert(DB_TABLES.residents, {
    id:         data.id,
    fname:      data.fname,
    lname:      data.lname,
    purok:      data.purok,
    contact:    data.contact    || 'N/A',
    status:     data.status     || 'Active',
    registered: data.registered || new Date().getFullYear().toString(),
    address:    data.address    || 'Barangay Payatas',
    gender:     data.gender     || 'N/A',
    dob:        data.dob        || 'N/A',
    notes:      data.notes      || '',
  });
}

async function sbUpdateResident(id, data) {
  return await dbUpdate(DB_TABLES.residents, id, {
    fname:   data.fname,
    lname:   data.lname,
    purok:   data.purok,
    contact: data.contact,
    status:  data.status,
    address: data.address,
    gender:  data.gender,
    dob:     data.dob,
    notes:   data.notes,
  });
}

async function sbDeleteResident(id) {
  return await dbDelete(DB_TABLES.residents, id);
}

// ============================================================
// DOCUMENTS
// Fields: id, resident, type, date, status, ref,
//         purpose, contact
// ============================================================

async function sbGetDocuments() {
  return await dbFetch(DB_TABLES.documents);
}

async function sbCreateDocument(data) {
  return await dbInsert(DB_TABLES.documents, {
    id:       data.id,
    resident: data.resident,
    type:     data.type,
    date:     data.date,
    status:   data.status   || 'Pending',
    ref:      data.ref,
    purpose:  data.purpose  || '',
    contact:  data.contact  || '',
  });
}

async function sbUpdateDocument(id, data) {
  return await dbUpdate(DB_TABLES.documents, id, {
    resident: data.resident,
    type:     data.type,
    date:     data.date,
    status:   data.status,
    ref:      data.ref,
    purpose:  data.purpose,
    contact:  data.contact,
  });
}

async function sbDeleteDocument(id) {
  return await dbDelete(DB_TABLES.documents, id);
}

// ============================================================
// COMPLAINTS
// Fields: id, complainant, category, priority, status,
//         date, desc
// ============================================================

async function sbGetComplaints() {
  return await dbFetch(DB_TABLES.complaints);
}

async function sbCreateComplaint(data) {
  return await dbInsert(DB_TABLES.complaints, {
    id:          data.id,
    complainant: data.complainant,
    category:    data.category,
    priority:    data.priority || 'Medium',
    status:      data.status   || 'Pending',
    date:        data.date,
    desc:        data.desc     || '',
  });
}

async function sbUpdateComplaint(id, data) {
  return await dbUpdate(DB_TABLES.complaints, id, {
    complainant: data.complainant,
    category:    data.category,
    priority:    data.priority,
    status:      data.status,
    date:        data.date,
    desc:        data.desc,
  });
}

async function sbDeleteComplaint(id) {
  return await dbDelete(DB_TABLES.complaints, id);
}

// ============================================================
// PROJECTS
// Fields: id, title, category, status, budget,
//         progress, desc
// ============================================================

async function sbGetProjects() {
  return await dbFetch(DB_TABLES.projects);
}

async function sbCreateProject(data) {
  return await dbInsert(DB_TABLES.projects, {
    id:       data.id,
    title:    data.title,
    category: data.category,
    status:   data.status   || 'Planned',
    budget:   data.budget   || 0,
    progress: data.progress || 0,
    desc:     data.desc     || '',
  });
}

async function sbUpdateProject(id, data) {
  return await dbUpdate(DB_TABLES.projects, id, {
    title:    data.title,
    category: data.category,
    status:   data.status,
    budget:   data.budget,
    progress: data.progress,
    desc:     data.desc,
  });
}

async function sbDeleteProject(id) {
  return await dbDelete(DB_TABLES.projects, id);
}

// ============================================================
// ANNOUNCEMENTS
// Fields: id, title, category, content, date
// ============================================================

async function sbGetAnnouncements() {
  return await dbFetch(DB_TABLES.announcements);
}

async function sbCreateAnnouncement(data) {
  return await dbInsert(DB_TABLES.announcements, {
    id:       data.id,
    title:    data.title,
    category: data.category || 'general',
    content:  data.content  || '',
    date:     data.date,
  });
}

async function sbUpdateAnnouncement(id, data) {
  return await dbUpdate(DB_TABLES.announcements, id, {
    title:    data.title,
    category: data.category,
    content:  data.content,
    date:     data.date,
  });
}

async function sbDeleteAnnouncement(id) {
  return await dbDelete(DB_TABLES.announcements, id);
}

// ============================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================

function subscribeToTable(table, callback) {
  if (!supabaseClient) {
    console.warn('Supabase not initialized — skipping real-time subscription');
    return null;
  }
  return supabaseClient
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}

console.log('✅ supabase.js loaded — ' + (supabaseClient ? 'ONLINE mode' : 'OFFLINE mode (localStorage)'));