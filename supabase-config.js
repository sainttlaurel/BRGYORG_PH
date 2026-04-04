const SUPABASE_CONFIG = {
  url: '',
  anonKey: ''
};


// Initialize Supabase Client
let supabaseClient = null;

try {
  if (typeof supabase !== 'undefined' && supabase.createClient && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

    // Test connection
    supabaseClient.from('users').select('count').limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.warn('Supabase connection issue:', error.message);
        } else {
          console.log('Supabase connected successfully!');
        }
      })
      .catch((err) => {
        console.warn('Supabase test query failed:', err.message);
      });
  } else {
    console.warn('Supabase SDK not loaded or config missing. Running in offline mode.');
  }
} catch (err) {
  console.warn('Supabase initialization failed:', err.message, '- Running in offline mode.');
  supabaseClient = null;
}

// Database Tables Schema
const DB_TABLES = {
  users: 'users',
  residents: 'residents',
  documents: 'documents',
  complaints: 'complaints',
  projects: 'projects',
  announcements: 'announcements',
  user_roles: 'user_roles'
};

// ============================================================
// DATABASE OPERATIONS
// ============================================================

// Generic fetch function
async function fetchFromSupabase(table, select = '*', filters = {}) {
  if (!supabaseClient) throw new Error('Supabase not initialized (offline mode)');
  let query = supabaseClient.from(table).select(select);
  
  // Apply filters
  Object.keys(filters).forEach(key => {
    query = query.eq(key, filters[key]);
  });
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Generic insert function
async function insertToSupabase(table, data) {
  if (!supabaseClient) throw new Error('Supabase not initialized (offline mode)');
  const { data: result, error } = await supabaseClient
    .from(table)
    .insert(data)
    .select();
  
  if (error) throw error;
  return result;
}

// Generic update function
async function updateInSupabase(table, id, data) {
  if (!supabaseClient) throw new Error('Supabase not initialized (offline mode)');
  const { data: result, error } = await supabaseClient
    .from(table)
    .update(data)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return result;
}

// Generic delete function
async function deleteFromSupabase(table, id) {
  if (!supabaseClient) throw new Error('Supabase not initialized (offline mode)');
  const { error } = await supabaseClient
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { success: true };
}

// ============================================================
// USER OPERATIONS
// ============================================================

async function getUsers() {
  return await fetchFromSupabase(DB_TABLES.users);
}

async function createUser(userData) {
  return await insertToSupabase(DB_TABLES.users, userData);
}

async function updateUser(id, userData) {
  return await updateInSupabase(DB_TABLES.users, id, userData);
}

async function deleteUser(id) {
  return await deleteFromSupabase(DB_TABLES.users, id);
}

async function authenticateUser(username, password) {
  if (!supabaseClient) throw new Error('Supabase not initialized (offline mode)');
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
// RESIDENT OPERATIONS
// ============================================================

async function getResidents() {
  return await fetchFromSupabase(DB_TABLES.residents);
}

async function createResident(residentData) {
  return await insertToSupabase(DB_TABLES.residents, residentData);
}

async function updateResident(id, residentData) {
  return await updateInSupabase(DB_TABLES.residents, id, residentData);
}

async function deleteResident(id) {
  return await deleteFromSupabase(DB_TABLES.residents, id);
}

// ============================================================
// DOCUMENT OPERATIONS
// ============================================================

async function getDocuments() {
  return await fetchFromSupabase(DB_TABLES.documents);
}

async function createDocument(docData) {
  return await insertToSupabase(DB_TABLES.documents, docData);
}

async function updateDocument(id, docData) {
  return await updateInSupabase(DB_TABLES.documents, id, docData);
}

async function deleteDocument(id) {
  return await deleteFromSupabase(DB_TABLES.documents, id);
}

// ============================================================
// COMPLAINT OPERATIONS
// ============================================================

async function getComplaints() {
  return await fetchFromSupabase(DB_TABLES.complaints);
}

async function createComplaint(complaintData) {
  return await insertToSupabase(DB_TABLES.complaints, complaintData);
}

async function updateComplaint(id, complaintData) {
  return await updateInSupabase(DB_TABLES.complaints, id, complaintData);
}

async function deleteComplaint(id) {
  return await deleteFromSupabase(DB_TABLES.complaints, id);
}

// ============================================================
// PROJECT OPERATIONS
// ============================================================

async function getProjects() {
  return await fetchFromSupabase(DB_TABLES.projects);
}

async function createProject(projectData) {
  return await insertToSupabase(DB_TABLES.projects, projectData);
}

async function updateProject(id, projectData) {
  return await updateInSupabase(DB_TABLES.projects, id, projectData);
}

async function deleteProject(id) {
  return await deleteFromSupabase(DB_TABLES.projects, id);
}

// ============================================================
// ANNOUNCEMENT OPERATIONS
// ============================================================

async function getAnnouncements() {
  return await fetchFromSupabase(DB_TABLES.announcements);
}

async function createAnnouncement(announcementData) {
  return await insertToSupabase(DB_TABLES.announcements, announcementData);
}

async function updateAnnouncement(id, announcementData) {
  return await updateInSupabase(DB_TABLES.announcements, id, announcementData);
}

async function deleteAnnouncement(id) {
  return await deleteFromSupabase(DB_TABLES.announcements, id);
}

// ============================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================

// Subscribe to changes in a table
function subscribeToTable(table, callback) {
  if (!supabaseClient) { console.warn('Supabase not initialized, skipping subscription'); return null; }
  return supabaseClient
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}

// ============================================================
// STORAGE OPERATIONS (for file uploads)
// ============================================================

async function uploadFile(bucket, path, file) {
  if (!supabaseClient) throw new Error('Supabase not initialized (offline mode)');
  const { data, error } = await supabaseClient
    .storage
    .from(bucket)
    .upload(path, file);
  
  if (error) throw error;
  return data;
}

async function getFileUrl(bucket, path) {
  if (!supabaseClient) throw new Error('Supabase not initialized (offline mode)');
  const { data } = supabaseClient
    .storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

async function deleteFile(bucket, path) {
  if (!supabaseClient) throw new Error('Supabase not initialized (offline mode)');
  const { error } = await supabaseClient
    .storage
    .from(bucket)
    .remove([path]);
  
  if (error) throw error;
  return { success: true };
}

console.log('Supabase client initialized');
