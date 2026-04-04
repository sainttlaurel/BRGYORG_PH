// ============================================================
// SUPABASE CONFIGURATION
// Payatas Ledger - Civic Management System
// ============================================================

// Supabase Configuration
// IMPORTANT: Replace with your actual Supabase credentials from Dashboard -> Settings -> API
// The anon key is a JWT token that starts with "eyJ..."

// Option 1: Direct values (replace with your actual credentials)
const SUPABASE_CONFIG = {
  url: 'https://xyaqigazszqhvvglqint.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5YXFpZ2F6c3pxaHF2Z2xxaW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyOTI5NDcsImV4cCI6MjA1ODg2ODk0N30.1sM3YnH3_qE8vZ8gLkXvJvX0yL0tE0nO5tL0d4N8Yc'
};

// Option 2: If you have proper env variables (for production builds only)
// const SUPABASE_CONFIG = {
//   url: window.ENV?.SUPABASE_URL || 'https://xyaqigazszqhvvglqint.supabase.co',
//   anonKey: window.ENV?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
// };

// Initialize Supabase Client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Test connection
supabaseClient.from('users').select('count').limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('⚠️ Supabase connection issue:', error.message);
      console.log('Error code:', error.code);
      console.log('Error details:', error.details);
      // Show a visual alert on the page
      document.body.insertAdjacentHTML('beforeend', 
        '<div id="supabase-error" style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#fee2e2;border:1px solid #dc2626;color:#991b1b;padding:12px 20px;border-radius:8px;font-size:13px;z-index:9999;">'+
          '⚠️ Database not connected. Please run supabase-schema.sql in Supabase SQL Editor.'+
        '</div>'
      );
    } else {
      console.log('Supabase connected successfully!');
    }
  });

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
  const { data: result, error } = await supabaseClient
    .from(table)
    .insert(data)
    .select();
  
  if (error) throw error;
  return result;
}

// Generic update function
async function updateInSupabase(table, id, data) {
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
  return supabaseClient
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}

// ============================================================
// STORAGE OPERATIONS (for file uploads)
// ============================================================

async function uploadFile(bucket, path, file) {
  const { data, error } = await supabaseClient
    .storage
    .from(bucket)
    .upload(path, file);
  
  if (error) throw error;
  return data;
}

async function getFileUrl(bucket, path) {
  const { data } = supabaseClient
    .storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

async function deleteFile(bucket, path) {
  const { error } = await supabaseClient
    .storage
    .from(bucket)
    .remove([path]);
  
  if (error) throw error;
  return { success: true };
}

console.log('Supabase client initialized');