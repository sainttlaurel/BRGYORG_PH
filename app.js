// ══════════════════════════════════════════════════════════════
// DATA LOADING FROM SUPABASE
// ══════════════════════════════════════════════════════════════

// Global data stores (loaded from Supabase)
let residents = [];
let documents = [];
let complaints = [];
let projects = [];
let announcements = [];

// Load all data from Supabase
async function loadAllData() {
  try {
    // Load residents
    const residentsData = await getResidents();
    if (residentsData && residentsData.length > 0) {
      residents = residentsData.map(function(r) {
        return {
          id: r.resident_id || r.id,
          initials: r.initials || getInitials(r.name),
          color: '#dbeafe',
          tcolor: '#1e3a8a',
          name: r.name,
          address: r.address,
          purok: r.purok,
          phone: r.phone,
          email: r.email,
          status: r.status
        };
      });
    } else {
      // Use fallback data if empty
      residents = fallbackResidents;
    }
    
    // Load documents
    const documentsData = await getDocuments();
    if (documentsData && documentsData.length > 0) {
      documents = documentsData.map(function(d) {
        return {
          id: d.doc_id || d.id,
          initials: d.resident_name ? getInitials(d.resident_name) : '??',
          color: '#dbeafe',
          tcolor: '#1e3a8a',
          name: d.resident_name,
          type: d.document_type,
          date: d.requested_date ? new Date(d.requested_date).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : 'N/A',
          status: d.status
        };
      });
    } else {
      // Use fallback data if empty
      documents = fallbackDocuments;
    }
    
    console.log('✅ Data loaded from Supabase');
    return true;
  } catch (error) {
    console.error('Error loading data, using fallback:', error);
    // Use fallback data on error
    residents = fallbackResidents;
    documents = fallbackDocuments;
    return false;
  }
}

// Update login to use Supabase authentication
async function login() {
  var username = document.getElementById('login-username').value.trim();
  var password = document.getElementById('login-password').value;
  var errorEl = document.getElementById('login-error');
  
  if (!username || !password) {
    errorEl.textContent = 'Please enter username and password.';
    return;
  }
  
  try {
    // Try to authenticate with Supabase
    const user = await authenticateUser(username, password);
    
    if (user) {
      if (user.status !== 'Active') {
        errorEl.textContent = 'Your account is deactivated. Contact administrator.';
        return;
      }
      
      // Update last login
      await updateUser(user.id, { last_login: new Date().toISOString() });
      
      // Set current user
      currentUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.last_login || 'Now'
      };
      
      sessionStorage.setItem('payatas_current_user', JSON.stringify(currentUser));
      
      errorEl.textContent = '';
      
      // Load data from Supabase
      await loadAllData();
      
      showMainApp();
      updateUserInfo();
      renderResidentTable();
      renderDocumentsTable();
      renderUsersTable();
      updateUserStats();
      updateAdminUI();
      showToast('Welcome back, ' + user.name + '!', 'success');
    }
  } catch (error) {
    console.log('Supabase auth failed, using fallback:', error.message);
    
    // Fallback to localStorage for offline/demo mode
    var localUsers = JSON.parse(localStorage.getItem('payatas_users')) || defaultUsers;
    var user = localUsers.find(function(u) { return u.username === username && u.password === password; });
    
    if (user) {
      if (user.status !== 'Active') {
        errorEl.textContent = 'Your account is deactivated. Contact administrator.';
        return;
      }
      
      user.lastLogin = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
      localStorage.setItem('payatas_users', JSON.stringify(localUsers));
      
      currentUser = user;
      sessionStorage.setItem('payatas_current_user', JSON.stringify(user));
      
      errorEl.textContent = '';
      showMainApp();
      updateUserInfo();
      renderResidentTable();
      renderDocumentsTable();
      updateAdminUI();
      showToast('Welcome back, ' + user.name + '! (Offline Mode)', 'info');
    } else {
      errorEl.textContent = 'Invalid username or password.';
    }
  }
}

// Fallback default users for offline mode
var defaultUsers = [
  { id: 'USR-001', username: 'admin', password: 'admin123', name: 'Admin Payatas', email: 'admin@payatas.gov.ph', role: 'Super Administrator', status: 'Active', lastLogin: 'April 5, 2026 - 8:14 AM' },
  { id: 'USR-002', username: 'staff1', password: 'staff123', name: 'Maria Santos', email: 'maria.santos@payatas.gov.ph', role: 'Staff', status: 'Active', lastLogin: 'April 4, 2026 - 3:45 PM' },
  { id: 'USR-003', username: 'staff2', password: 'staff123', name: 'Juan Dela Cruz', email: 'juan.delacruz@payatas.gov.ph', role: 'Staff', status: 'Active', lastLogin: 'April 3, 2026 - 9:20 AM' }
];

var users = JSON.parse(localStorage.getItem('payatas_users')) || defaultUsers;
if (!localStorage.getItem('payatas_users')) {
  localStorage.setItem('payatas_users', JSON.stringify(defaultUsers));
}

var currentUser = JSON.parse(sessionStorage.getItem('payatas_current_user')) || null;

// Check if user is logged in on page load
function checkAuth() {
  if (currentUser) {
    showMainApp();
    updateUserInfo();
    loadAllData().then(function() {
      renderResidentTable();
      renderDocumentsTable();
      updateAdminUI();
    });
    // Also load users for admin
    if (isAdmin()) {
      loadUsersFromSupabase();
    }
  }
}

async function loadUsersFromSupabase() {
  try {
    const usersData = await getUsers();
    if (usersData) {
      users = usersData.map(function(u) {
        return {
          id: u.id,
          username: u.username,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          lastLogin: u.last_login || 'Never'
        };
      });
    }
  } catch (error) {
    console.log('Using local users (offline mode)');
  }
  renderUsersTable();
  updateUserStats();
}

function logout() {
  openModal('Confirm Logout',
    '<div style="text-align:center;padding:16px 0;"><div style="width:56px;height:56px;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">'+
      '<span class="material-symbols-outlined" style="font-size:28px;color:#d97706">logout</span></div>'+
      '<p style="font-size:14px;color:var(--on-surface-variant);line-height:1.6;">Are you sure you want to log out?</p></div>',
    btnSec('Cancel','closeModal()')+' <button onclick="confirmLogout()" style="'+btnPrimStyle()+'background:linear-gradient(135deg,#dc2626,#ef4444);">Log Out</button>'
  );
}

function confirmLogout() {
  sessionStorage.removeItem('payatas_current_user');
  currentUser = null;
  residents = [];
  documents = [];
  closeModal();
  hideMainApp();
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').textContent = '';
  showToast('You have been logged out.', 'info');
}

function showMainApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
}

function hideMainApp() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
}

function updateUserInfo() {
  if (!currentUser) return;
  
  var avatar = document.querySelector('.avatar');
  var nameEl = document.querySelector('.user-info .name');
  var roleEl = document.querySelector('.user-info .role');
  
  if (avatar) avatar.textContent = getInitials(currentUser.name);
  if (nameEl) nameEl.textContent = currentUser.name;
  if (roleEl) roleEl.textContent = currentUser.role;
}

function getInitials(name) {
  return name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
}

function togglePassword() {
  var passwordInput = document.getElementById('login-password');
  var icon = document.querySelector('.toggle-password .material-symbols-outlined');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.textContent = 'visibility_off';
  } else {
    passwordInput.type = 'password';
    icon.textContent = 'visibility';
  }
}

function isAdmin() {
  return currentUser && (currentUser.role === 'Super Administrator' || currentUser.role === 'Administrator');
}

function updateAdminUI() {
  var adminElements = document.querySelectorAll('.admin-only');
  adminElements.forEach(function(el) {
    el.style.display = isAdmin() ? '' : 'none';
  });
}

function printContent(content, title) {
  var printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) { showToast('Pop-up blocked. Please allow pop-ups for this site.', 'error'); return; }
  printWindow.document.write('<!DOCTYPE html><html><head><title>' + title + '</title>');
  printWindow.document.write('<style>@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");');
  printWindow.document.write('body{font-family:"Inter",sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#191c1d;}');
  printWindow.document.write('h1{font-size:24px;font-weight:800;margin-bottom:8px;}');
  printWindow.document.write('h2{font-size:18px;font-weight:700;margin:20px 0 10px;}');
  printWindow.document.write('p{font-size:14px;color:#434655;line-height:1.6;}');
  printWindow.document.write('.meta{font-size:12px;color:#64748b;margin-bottom:20px;}');
  printWindow.document.write('.section{border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;}');
  printWindow.document.write('.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;}');
  printWindow.document.write('.label{font-size:12px;font-weight:600;color:#64748b;}');
  printWindow.document.write('.value{font-size:13px;font-weight:600;}');
  printWindow.document.write('.badge{display:inline-block;padding:4px 10px;border-radius:99px;font-size:10px;font-weight:700;text-transform:uppercase;}');
  printWindow.document.write('.badge-pending{background:#fef9c3;color:#92400e;}');
  printWindow.document.write('.badge-approved{background:#dcfce7;color:#14532d;}');
  printWindow.document.write('.badge-rejected{background:#fee2e2;color:#991b1b;}');
  printWindow.document.write('.footer{margin-top:30px;padding-top:20px;border-top:2px solid #004ac6;text-align:center;font-size:12px;color:#64748b;}');
  printWindow.document.write('@media print{@page{margin:20mm;}}</style></head><body>');
  printWindow.document.write(content);
  printWindow.document.write('<div class="footer">Barangay Payatas Civic Management System<br>Printed on ' + new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'}) + '</div>');
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  setTimeout(function(){ printWindow.print(); },500);
}

function printDocumentRequest(id) {
  var d = documents.find(function(x){ return x.id===id; });
  if (!d) return;
  var badgeClass = d.status === 'Approved' ? 'badge-approved' : (d.status === 'Rejected' ? 'badge-rejected' : 'badge-pending');
  var content = '<h1>Barangay Payatas</h1><p class="meta">Document Request Certificate</p>';
  content += '<div class="section"><div class="row"><span class="label">Request ID</span><span class="value">' + d.id + '</span></div>';
  content += '<div class="row"><span class="label">Resident Name</span><span class="value">' + d.name + '</span></div>';
  content += '<div class="row"><span class="label">Document Type</span><span class="value">' + d.type + '</span></div>';
  content += '<div class="row"><span class="label">Request Date</span><span class="value">' + d.date + '</span></div>';
  content += '<div class="row"><span class="label">Status</span><span class="value"><span class="badge ' + badgeClass + '">' + d.status + '</span></span></div></div>';
  content += '<div style="margin-top:20px;"><h2>Certification</h2><p>This certifies that the above document request has been processed by the Barangay Payatas Administration. For verification, please contact the barangay office.</p></div>';
  printContent(content, 'Document Request - ' + d.id);
  showToast('Printing document request for ' + d.name, 'info');
}

function printResidentRecord(id) {
  var r = residents.find(function(x){ return x.id===id; });
  if (!r) return;
  var statusClass = r.status === 'Active' ? 'badge-approved' : 'badge-pending';
  var content = '<h1>Barangay Payatas</h1><p class="meta">Resident Identification Record</p>';
  content += '<div class="section"><div class="row"><span class="label">Resident ID</span><span class="value">' + r.id + '</span></div>';
  content += '<div class="row"><span class="label">Full Name</span><span class="value">' + r.name + '</span></div>';
  content += '<div class="row"><span class="label">Address</span><span class="value">' + r.address + '</span></div>';
  content += '<div class="row"><span class="label">Purok</span><span class="value">' + r.purok + '</span></div>';
  content += '<div class="row"><span class="label">Phone</span><span class="value">' + r.phone + '</span></div>';
  content += '<div class="row"><span class="label">Email</span><span class="value">' + r.email + '</span></div>';
  content += '<div class="row"><span class="label">Status</span><span class="value"><span class="badge ' + statusClass + '">' + r.status + '</span></span></div></div>';
  content += '<div style="margin-top:20px;"><p>This is an official record from the Barangay Payatas Resident Database.</p></div>';
  printContent(content, 'Resident Record - ' + r.id);
  showToast('Printing resident record for ' + r.name, 'info');
}

function printComplaintRecord(id) {
  var content = '<h1>Barangay Payatas</h1><p class="meta">Complaint Acknowledgment</p>';
  content += '<div class="section"><div class="row"><span class="label">Case ID</span><span class="value">#CP-' + Math.floor(Math.random()*9000+1000) + '</span></div>';
  content += '<div class="row"><span class="label">Date Filed</span><span class="value">' + new Date().toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) + '</span></div>';
  content += '<div class="row"><span class="label">Status</span><span class="value"><span class="badge badge-pending">Processing</span></span></div></div>';
  content += '<div style="margin-top:20px;"><p>Your complaint has been received and is being processed. Reference case number for follow-ups.</p></div>';
  printContent(content, 'Complaint Acknowledgment');
  showToast('Printing complaint acknowledgment', 'info');
}

function printProjectReport() {
  var content = '<h1>Barangay Payatas</h1><p class="meta">Community Projects Report - ' + new Date().toLocaleDateString('en-US', {month:'long',year:'numeric'}) + '</p>';
  content += '<div class="section"><h2>Project Summary</h2>';
  content += '<div class="row"><span class="label">Total Budget</span><span class="value">₱4,200,000</span></div>';
  content += '<div class="row"><span class="label">Ongoing Projects</span><span class="value">12</span></div>';
  content += '<div class="row"><span class="label">Completed</span><span class="value">24</span></div>';
  content += '<div class="row"><span class="label">Planned</span><span class="value">8</span></div></div>';
  content += '<div style="margin-top:20px;"><p>Generated from Payatas Ledger Community Projects Module.</p></div>';
  printContent(content, 'Projects Report');
  showToast('Printing projects report', 'info');
}

function printAnnouncement(id) {
  var content = '<h1>Barangay Payatas</h1><p class="meta">Official Announcement</p>';
  content += '<div class="section"><h2>Community Notice</h2><p>This announcement has been posted by the Barangay Administration for community awareness.</p></div>';
  content += '<div style="margin-top:20px;"><p>For inquiries, please contact the Barangay Hall.</p></div>';
  printContent(content, 'Announcement');
  showToast('Printing announcement', 'info');
}

// ══════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ══════════════════════════════════════════════════════════════

function exportToCSV(data, filename, headers) {
  var csv = headers.join(',') + '\n';
  data.forEach(function(row) {
    csv += row.join(',') + '\n';
  });
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename + '_' + new Date().toISOString().slice(0,10) + '.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportResidentsCSV() {
  var headers = ['ID', 'Name', 'Address', 'Purok', 'Phone', 'Email', 'Status'];
  var data = residents.map(function(r) {
    return [r.id, '"' + r.name + '"', '"' + r.address + '"', r.purok, r.phone, r.email, r.status];
  });
  exportToCSV(data, 'payatas_residents', headers);
  showToast('Residents data exported to CSV!', 'success');
}

function exportDocumentsCSV() {
  var headers = ['ID', 'Resident Name', 'Document Type', 'Date', 'Status'];
  var data = documents.map(function(d) {
    return [d.id, '"' + d.name + '"', d.type, d.date, d.status];
  });
  exportToCSV(data, 'payatas_documents', headers);
  showToast('Documents data exported to CSV!', 'success');
}

function exportComplaintsCSV() {
  var headers = ['Case ID', 'Category', 'Priority', 'Status', 'Date Submitted'];
  var data = [
    ['CP-8842', 'Health & Sanitation', 'Urgent', 'Pending Assessment', 'Oct 22, 2023'],
    ['CP-8841', 'Infrastructure', 'Standard', 'In Progress', 'Oct 23, 2023'],
    ['CP-8839', 'Noise Disturbance', 'Low Urgency', 'Resolved', 'Oct 20, 2023'],
    ['CP-8843', 'Infrastructure', 'Urgent', 'Awaiting Dispatch', 'Oct 24, 2023']
  ];
  exportToCSV(data, 'payatas_complaints', headers);
  showToast('Complaints data exported to CSV!', 'success');
}

function exportProjectsCSV() {
  var headers = ['Project Name', 'Status', 'Budget', 'Timeline', 'Progress'];
  var data = [
    ['Phase 4 Main Road Rehabilitation', 'Ongoing', '₱1,250,000', 'Dec 2023', '65%'],
    ['Solar-Powered Lighting Initiative', 'Completed', '₱450,000', 'Sep 2023', '100%'],
    ['Multipurpose Hall Expansion', 'Planned', '₱2,800,000', 'Jan 2024', '0%'],
    ['Central Payatas Drainage Upgrade', 'Ongoing', '₱3,200,000', 'March 2024', '28%']
  ];
  exportToCSV(data, 'payatas_projects', headers);
  showToast('Projects data exported to CSV!', 'success');
}

function exportToPDF(content, title) {
  var printWindow = window.open('', '_blank', 'width=800,height=600');
  printWindow.document.write('<!DOCTYPE html><html><head><title>' + title + '</title>');
  printWindow.document.write('<style>@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");');
  printWindow.document.write('body{font-family:"Inter",sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#191c1d;}');
  printWindow.document.write('h1{font-size:24px;font-weight:800;margin-bottom:8px;}');
  printWindow.document.write('.meta{font-size:12px;color:#64748b;margin-bottom:20px;}');
  printWindow.document.write('.section{border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;}');
  printWindow.document.write('.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;}');
  printWindow.document.write('.label{font-size:12px;font-weight:600;color:#64748b;}');
  printWindow.document.write('.value{font-size:13px;font-weight:600;}');
  printWindow.document.write('.footer{margin-top:30px;padding-top:20px;border-top:2px solid #004ac6;text-align:center;font-size:12px;color:#64748b;}');
  printWindow.document.write('@media print{@page{margin:20mm;}}</style></head><body>');
  printWindow.document.write(content);
  printWindow.document.write('<div class="footer">Barangay Payatas Civic Management System<br>Generated on ' + new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'}) + '</div>');
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  setTimeout(function(){ printWindow.print(); },500);
}

function exportDashboardReport() {
  var content = '<h1>Barangay Payatas</h1><p class="meta">Dashboard Overview Report - ' + new Date().toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'}) + '</p>';
  content += '<div class="section"><h2>Statistics</h2>';
  content += '<div class="row"><span class="label">Total Residents</span><span class="value">42,305</span></div>';
  content += '<div class="row"><span class="label">Pending Requests</span><span class="value">18</span></div>';
  content += '<div class="row"><span class="label">Active Complaints</span><span class="value">5</span></div>';
  content += '<div class="row"><span class="label">Ongoing Projects</span><span class="value">3</span></div></div>';
  exportToPDF(content, 'Dashboard Report');
  showToast('Dashboard report exported!', 'success');
}

function generateResidentPDF(id) {
  var r = residents.find(function(x){ return x.id===id; });
  if (!r) return;
  var content = '<h1>Barangay Payatas</h1><p class="meta">Resident Certificate</p>';
  content += '<div class="section"><div class="row"><span class="label">Resident ID</span><span class="value">' + r.id + '</span></div>';
  content += '<div class="row"><span class="label">Name</span><span class="value">' + r.name + '</span></div>';
  content += '<div class="row"><span class="label">Address</span><span class="value">' + r.address + '</span></div>';
  content += '<div class="row"><span class="label">Purok</span><span class="value">' + r.purok + '</span></div>';
  content += '<div class="row"><span class="label">Status</span><span class="value">' + r.status + '</span></div></div>';
  content += '<div style="margin-top:20px;"><p style="font-size:14px;">This is to certify that the above individual is a registered resident of Barangay Payatas.</p>';
  content += '<p style="font-size:12px;color:#64748b;margin-top:10px;">Document ID: CERT-' + Math.floor(Math.random()*90000+10000) + '</p></div>';
  exportToPDF(content, 'Resident Certificate - ' + r.name);
  showToast('Generating resident certificate for ' + r.name, 'success');
}

// ══════════════════════════════════════════════════════════════
// NEW REQUEST FUNCTIONS
// ══════════════════════════════════════════════════════════════

function openNewRequestModal() {
  openModal('New Document Request',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#dbeafe;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:4px;">'+
        '<span class="material-symbols-outlined" style="color:#1e3a8a;font-size:20px;">description</span>'+
        '<span style="font-size:12px;font-weight:700;color:#1e3a8a;">New Document Request</span></div>'+
      field('Resident Name','doc-name','text','Full name of resident')+
      field('Document Type','doc-type','select','',['Barangay Clearance','Certificate of Indigency','Business Permit','Residency Certificate','Good Moral Certificate'])+
      field('Purpose','doc-purpose','text','Reason for request')+
      field('Priority','doc-prio','select','',['Standard','Urgent'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Submit Request','saveDocRequest()')
  );
}

function openNewComplaintModal() {
  openModal('File New Complaint',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#fee2e2;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:4px;">'+
        '<span class="material-symbols-outlined" style="color:#991b1b;font-size:20px;">gavel</span>'+
        '<span style="font-size:12px;font-weight:700;color:#991b1b;">Submit New Complaint</span></div>'+
      field('Complainant Name','cmp-name','text','Full name')+
      field('Category','cmp-cat','select','',['Health & Sanitation','Infrastructure','Security','Waste Management','Noise Disturbance','Public Safety'])+
      field('Priority','cmp-prio','select','',['Urgent','Standard','Low Urgency'])+
      field('Location / Purok','cmp-loc','text','Street or Purok')+
      field('Description','cmp-desc','textarea','Describe the complaint in detail...')+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Submit Complaint','saveNewComplaint()')
  );
}

function saveNewComplaint() {
  var name = val('cmp-name');
  var category = val('cmp-cat');
  if (!name) { showToast('Please enter complainant name.', 'error'); return; }
  var caseId = 'CP-' + Math.floor(Math.random()*9000+1000);
  closeModal();
  showToast('Complaint filed with Case ID #' + caseId + '!', 'success');
}

function openNewProjectModal() {
  openModal('Create New Project',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#ede9fe;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:4px;">'+
        '<span class="material-symbols-outlined" style="color:#7c3aed;font-size:20px;">account_tree</span>'+
        '<span style="font-size:12px;font-weight:700;color:#7c3aed;">New Community Project</span></div>'+
      field('Project Title','prj-title','text','e.g. Phase 5 Drainage Upgrade')+
      field('Status','prj-status','select','',['Planned','Ongoing','Completed'])+
      field('Budget (₱)','prj-budget','text','e.g. 1,500,000')+
      field('Target Date','prj-date','text','e.g. March 2024')+
      field('Contractor','prj-contractor','text','Company name')+
      field('Description','prj-desc','textarea','Brief description...')+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Create Project','saveNewProject()')
  );
}

function saveNewProject() {
  var title = val('prj-title');
  if (!title) { showToast('Please enter project title.', 'error'); return; }
  closeModal();
  showToast('New project "' + title + '" created successfully!', 'success');
}

function openNewAnnouncementModal() {
  openModal('Post New Announcement',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#dcfce7;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:4px;">'+
        '<span class="material-symbols-outlined" style="color:#065f46;font-size:20px;">campaign</span>'+
        '<span style="font-size:12px;font-weight:700;color:#065f46;">New Community Announcement</span></div>'+
      field('Title','ann-title-i','text','Announcement headline')+
      field('Category','ann-cat-i','select','',['Advisory','Events','Governance','Schedule','Sports','Health','General'])+
      field('Content','ann-content-i','textarea','Write the full announcement here...')+
      field('Valid Until','ann-date-i','text','e.g. November 30, 2023')+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Post Announcement','saveAnnouncement()')
  );
}

function openNewResidentModal() {
  openModal('Add New Resident',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#dbeafe;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:4px;">'+
        '<span class="material-symbols-outlined" style="color:#1e3a8a;font-size:20px;">person_add</span>'+
        '<span style="font-size:12px;font-weight:700;color:#1e3a8a;">Register New Resident</span></div>'+
      field('Full Name','res-name','text','e.g. Juan dela Cruz')+
      field('Address','res-address','text','Street, Block, Lot')+
      field('Purok','res-purok','select','',['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7','Purok 8','Purok 9'])+
      field('Phone','res-phone','tel','+63 9XX XXX XXXX')+
      field('Email','res-email','email','email@example.com')+
      field('Status','res-status','select','',['Active','Inactive'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Save Resident','saveResident()')
  );
}

// ─── DATA STORES (fallback data when offline or Supabase unavailable) ────

// Fallback data when offline or Supabase unavailable
var fallbackResidents = [
  { id:'PAY-2023-0842', initials:'MS', color:'#dbeafe', tcolor:'#1e3a8a', name:'Mateo Santos',      address:'124 Orchid St. Phase 2', purok:'Purok 4', phone:'+63 917 555 0192', email:'mateo@payatas.ph',     status:'Active'   },
  { id:'PAY-2023-1129', initials:'ER', color:'#dbeafe', tcolor:'#1e3a8a', name:'Elena Reyes',       address:'Blk 5 Lot 12, Area C',   purok:'Purok 1', phone:'+63 920 123 4567', email:'elena@payatas.ph',     status:'Active'   },
  { id:'PAY-2022-0450', initials:'JR', color:'#e2e8f0', tcolor:'#475569', name:'Juan Rivera',       address:'45 Molave Street',        purok:'Purok 2', phone:'+63 945 987 6543', email:'juan@payatas.ph',      status:'Inactive' },
  { id:'PAY-2023-1562', initials:'AL', color:'#fef3c7', tcolor:'#92400e', name:'Alicia Lopez',      address:'78 Sampaguita Ext.',      purok:'Purok 3', phone:'+63 916 222 3344', email:'alicia@payatas.ph',    status:'Active'   },
  { id:'PAY-2023-2041', initials:'BR', color:'#dcfce7', tcolor:'#065f46', name:'Bernadette Ramos',  address:'33 Kalayaan Ave.',        purok:'Purok 5', phone:'+63 932 441 8800', email:'berna@payatas.ph',     status:'Active'   },
];

var fallbackDocuments = [
  { id:'DOC-001', initials:'MA', color:'#dbeafe', tcolor:'#1e3a8a', name:'Maria Alicia Dela Cruz', type:'Barangay Clearance',       date:'Oct 23, 2023', status:'Pending',          rejectReason:'' },
  { id:'DOC-002', initials:'RS', color:'#dbeafe', tcolor:'#1e3a8a', name:'Ricardo Santos',         type:'Business Permit',          date:'Oct 22, 2023', status:'Approved',         rejectReason:'' },
  { id:'DOC-003', initials:'JP', color:'#fef3c7', tcolor:'#92400e', name:'Juanito Pineda',         type:'Certificate of Indigency', date:'Oct 21, 2023', status:'Ready for Pickup', rejectReason:'' },
  { id:'DOC-004', initials:'EL', color:'#fee2e2', tcolor:'#991b1b', name:'Elena Ledesma',          type:'Barangay Clearance',       date:'Oct 20, 2023', status:'Rejected',         rejectReason:'Incomplete supporting documents.' },
  { id:'DOC-005', initials:'FB', color:'#dbeafe', tcolor:'#1e3a8a', name:'Fernando Bautista',      type:'Business Permit',          date:'Oct 19, 2023', status:'Approved',         rejectReason:'' },
];

var notifToggles = { 'Urgent Complaints': true, 'New Document Requests': true, 'Project Updates': false, 'Weekly Reports': true };

// ─── TOAST ──────────────────────────────────────────────────

function showToast(message, type) {
  type = type || 'success';
  if (!document.getElementById('toast-container')) {
    var tc = document.createElement('div');
    tc.id = 'toast-container';
    tc.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;';
    document.body.appendChild(tc);
  }
  var container = document.getElementById('toast-container');
  var colors = { success:'#10b981', error:'#dc2626', info:'#2563eb', warning:'#f59e0b' };
  var icons  = { success:'check_circle', error:'cancel', info:'info', warning:'warning' };
  var toast = document.createElement('div');
  toast.style.cssText = 'background:#1e293b;color:white;padding:12px 20px;border-radius:12px;font-size:13.5px;font-weight:600;display:flex;align-items:center;gap:10px;box-shadow:0 8px 28px rgba(0,0,0,0.3);pointer-events:auto;border-left:4px solid '+(colors[type]||colors.info)+';min-width:260px;max-width:420px;font-family:Inter,sans-serif;';
  toast.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;color:'+(colors[type]||colors.info)+';flex-shrink:0">'+(icons[type]||icons.info)+'</span><span>'+message+'</span>';
  container.appendChild(toast);
  setTimeout(function() { toast.style.transition='all 0.3s'; toast.style.opacity='0'; toast.style.transform='translateY(8px)'; setTimeout(function(){ toast.remove(); },300); }, 3000);
}

// ─── MODAL ──────────────────────────────────────────────────

function openModal(title, bodyHTML, footerHTML) {
  var old = document.getElementById('modal-overlay');
  if (old) old.remove();
  var overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,36,0.6);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML =
    '<div style="background:white;border-radius:18px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.3);">' +
      '<div style="padding:24px 28px 20px;border-bottom:1px solid rgba(195,198,215,0.15);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:white;z-index:1;border-radius:18px 18px 0 0;">' +
        '<h3 style="font-size:18px;font-weight:800;letter-spacing:-0.3px;font-family:Inter,sans-serif;">'+title+'</h3>' +
        '<button onclick="closeModal()" style="background:#f1f5f9;border:none;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;"><span class="material-symbols-outlined" style="font-size:20px;">close</span></button>' +
      '</div>' +
      '<div style="padding:24px 28px;" id="modal-body">'+bodyHTML+'</div>' +
      (footerHTML ? '<div style="padding:16px 28px 24px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid rgba(195,198,215,0.12);">'+footerHTML+'</div>' : '') +
    '</div>';
  overlay.addEventListener('click', function(e){ if(e.target===overlay) closeModal(); });
  document.body.appendChild(overlay);
}

function closeModal() {
  var o = document.getElementById('modal-overlay');
  if (o) o.remove();
}

// ─── PAGE NAVIGATION ────────────────────────────────────────

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
  var page = document.getElementById('page-'+pageId);
  if (page) page.classList.add('active');
  var navMap = { 'dashboard':0,'residents':1,'documents':2,'complaints':3,'projects':4,'announcements':5,'reports':6,'settings':7 };
  var navItems = document.querySelectorAll('.nav-item');
  if (navMap[pageId] !== undefined) navItems[navMap[pageId]].classList.add('active');
  var placeholders = {
    'dashboard':'Search residents, documents, or records...',
    'residents':'Search residents, records, or files...',
    'documents':'Search requests...',
    'complaints':'Search complaints, residents, or case IDs...',
    'projects':'Search projects...',
    'announcements':'Search announcements...',
    'reports':'Search analytics...',
    'settings':'Search settings...'
  };
  var si = document.getElementById('searchInput');
  if (si && placeholders[pageId]) si.placeholder = placeholders[pageId];
  window.scrollTo(0,0);
}

// ─── GLOBAL SEARCH ──────────────────────────────────────────

document.getElementById('searchInput').addEventListener('input', function(){
  var q = this.value.toLowerCase().trim();
  var activePage = document.querySelector('.page.active');
  if (!activePage) return;
  if (!q) {
    activePage.querySelectorAll('tbody tr, .complaint-card, .ann-card, .proj-card').forEach(function(el){ el.style.display=''; });
    return;
  }
  activePage.querySelectorAll('tbody tr').forEach(function(tr){ tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none'; });
  activePage.querySelectorAll('.complaint-card').forEach(function(c){ c.style.display=c.textContent.toLowerCase().includes(q)?'':'none'; });
  activePage.querySelectorAll('.ann-card').forEach(function(c){ c.style.display=c.textContent.toLowerCase().includes(q)?'':'none'; });
  activePage.querySelectorAll('.proj-card').forEach(function(c){ c.style.display=c.textContent.toLowerCase().includes(q)?'':'none'; });
});

document.getElementById('searchInput').addEventListener('keydown', function(e){
  if (e.key==='Escape'){
    this.value='';
    document.querySelectorAll('tbody tr,.complaint-card,.ann-card,.proj-card').forEach(function(el){ el.style.display=''; });
  }
});

// ─── CHART TOGGLES ──────────────────────────────────────────

document.querySelectorAll('.chart-toggle button').forEach(function(btn){
  btn.addEventListener('click', function(){
    var parent=this.parentElement;
    parent.querySelectorAll('button').forEach(function(b){ b.className='ctb-inactive'; });
    this.className='ctb-active';
    showToast('Chart view: '+this.textContent,'info');
  });
});

// ─── FILTER CHIPS ───────────────────────────────────────────

document.querySelectorAll('.filter-chip').forEach(function(chip){
  chip.addEventListener('click', function(){
    var parent=this.parentElement;
    parent.querySelectorAll('.filter-chip').forEach(function(c){ c.className='filter-chip chip-inactive'; });
    this.className='filter-chip chip-active';
  });
});

// ─── FILTER TAGS ────────────────────────────────────────────

document.querySelectorAll('.filter-tag').forEach(function(tag){
  tag.addEventListener('click', function(){
    this.classList.toggle('active-tag');
    var isActive=this.classList.contains('active-tag');
    this.style.background=isActive?'rgba(0,74,198,0.08)':'';
    this.style.borderColor=isActive?'rgba(0,74,198,0.4)':'';
    this.style.color=isActive?'var(--primary)':'';
  });
});

// ─── NOTIFICATION BELL ──────────────────────────────────────

document.querySelector('.notif-btn').addEventListener('click', function(){
  var notifs=[
    { icon:'warning',       color:'#dc2626', bg:'#fee2e2', msg:'Urgent: Burst water pipe on Dahlia Ave.',     time:'2h ago' },
    { icon:'description',   color:'#d97706', bg:'#fef3c7', msg:'New document request from Maria Dela Cruz.',  time:'3h ago' },
    { icon:'account_tree',  color:'#7c3aed', bg:'#ede9fe', msg:'Phase 4 Road Rehab reached 65% progress.',    time:'5h ago' },
    { icon:'campaign',      color:'#2563eb', bg:'#dbeafe', msg:'New announcement: Vaccination Drive posted.',  time:'1d ago' },
    { icon:'check_circle',  color:'#16a34a', bg:'#dcfce7', msg:'Complaint #CP-8839 has been resolved.',        time:'1d ago' },
  ];
  var body=notifs.map(function(n){
    return '<div style="display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid rgba(195,198,215,0.1);">'+
      '<div style="width:36px;height:36px;border-radius:10px;background:'+n.bg+';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+
        '<span class="material-symbols-outlined" style="font-size:18px;color:'+n.color+'">'+n.icon+'</span></div>'+
      '<div><div style="font-size:13px;font-weight:600;line-height:1.4;">'+n.msg+'</div>'+
        '<div style="font-size:11px;color:#94a3b8;margin-top:3px;">'+n.time+'</div></div></div>';
  }).join('');
  body += '<button onclick="closeModal();showToast(\'All notifications marked as read\',\'success\');" style="margin-top:14px;width:100%;padding:10px;background:#f1f5f9;border:none;border-radius:9px;font-size:12.5px;font-weight:700;color:var(--primary);cursor:pointer;font-family:Inter,sans-serif;">Mark all as read</button>';
  openModal('Notifications', body);
  var dot=document.querySelector('.notif-dot');
  if(dot) dot.style.display='none';
});

// ─── SIDEBAR CTA ────────────────────────────────────────────

document.querySelector('.sidebar-cta-btn').addEventListener('click', function(){ openNewAnnouncementModal(); });

// ─── DASHBOARD BUTTONS ──────────────────────────────────────

var dashBtns = document.querySelectorAll('#page-dashboard .pg-actions button');
if (dashBtns[0]) dashBtns[0].addEventListener('click', function(){
  showToast('Generating report…','info');
  setTimeout(function(){ showToast('Report exported successfully!','success'); },1800);
});
if (dashBtns[1]) dashBtns[1].addEventListener('click', function(){ openNewRequestModal(); });

// Emergency Hub: Launch Alert
var emergBtn = document.querySelector('.emergency-card button');
if (emergBtn) emergBtn.addEventListener('click', function(){
  openModal('Launch Emergency Alert',
    '<div style="background:#fee2e2;border-radius:12px;padding:16px 18px;margin-bottom:20px;display:flex;gap:12px;align-items:flex-start;">'+
      '<span class="material-symbols-outlined" style="color:#dc2626;flex-shrink:0">warning</span>'+
      '<span style="font-size:13px;font-weight:600;color:#991b1b;">This will broadcast an SMS and push notification to ALL residents. Use only for genuine emergencies.</span></div>'+
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Alert Type','alert-type','select','',['🚨 Natural Disaster','🔥 Fire Emergency','🏥 Health Emergency','📢 General Community Alert'])+
      field('Message','alert-msg','textarea','Type your emergency message here...')+
    '</div>',
    btnSec('Cancel','closeModal()')+' <button onclick="launchAlert()" style="'+btnPrimStyle()+'background:linear-gradient(135deg,#dc2626,#ef4444);">🚨 Send Alert Now</button>'
  );
});

function launchAlert(){
  var msg=document.getElementById('alert-msg');
  if (!msg||!msg.value.trim()){ showToast('Please type an alert message.','error'); return; }
  closeModal(); showToast('Emergency alert broadcast sent to all residents!','success');
}

// ─── RESIDENTS ───────────────────────────────────────────────

var resBtns = document.querySelectorAll('#page-residents .pg-actions button');
if (resBtns[0]) resBtns[0].addEventListener('click', function(){
  var csv=['ID,Name,Address,Purok,Phone,Email,Status'].concat(residents.map(function(r){
    return r.id+',"'+r.name+'","'+r.address+'",'+r.purok+','+r.phone+','+r.email+','+r.status;
  })).join('\n');
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='payatas_residents.csv'; a.click();
  showToast('Residents exported as CSV!','success');
});
if (resBtns[1]) resBtns[1].addEventListener('click', function(){ openAddResidentModal(); });

function openAddResidentModal(){
  openModal('Add New Resident',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Full Name','res-name','text','e.g. Juan dela Cruz')+
      field('Address','res-address','text','Street, Block, Lot')+
      field('Purok','res-purok','select','',['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7','Purok 8','Purok 9'])+
      field('Phone','res-phone','tel','+63 9XX XXX XXXX')+
      field('Email','res-email','email','email@example.com')+
      field('Status','res-status','select','',['Active','Inactive'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Save Resident','saveResident()')
  );
}

function saveResident(){
  var name=val('res-name'), address=val('res-address'), purok=val('res-purok'), phone=val('res-phone'), email=val('res-email'), status=val('res-status');
  if (!name||!address||!phone){ showToast('Please fill in all required fields.','error'); return; }
  var initials=name.split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
  var newId='PAY-2023-'+Math.floor(Math.random()*9000+1000);
  residents.push({ id:newId, initials:initials, color:'#dbeafe', tcolor:'#1e3a8a', name:name, address:address, purok:purok, phone:phone, email:email, status:status });
  renderResidentTable();
  closeModal();
  showToast(name+' added to the resident directory!','success');
}

function renderResidentTable(){
  var tbody=document.querySelector('#page-residents tbody');
  if (!tbody) return;
  tbody.innerHTML=residents.map(function(r){
    return '<tr>'+
      '<td><div class="flex-center gap-3"><div class="av" style="background:'+r.color+';color:'+r.tcolor+'">'+r.initials+'</div>'+
        '<div><div class="font-bold">'+r.name+'</div><div class="text-xs text-muted">ID: '+r.id+'</div></div></div></td>'+
      '<td><div class="font-bold text-sm">'+r.address+'</div><div class="text-xs text-muted">'+r.purok+'</div></td>'+
      '<td><div><div class="flex-center gap-2 text-sm"><span class="material-symbols-outlined" style="font-size:14px;color:var(--on-surface-variant)">phone</span>'+r.phone+'</div>'+
        '<div class="flex-center gap-2 text-xs text-muted" style="margin-top:3px"><span class="material-symbols-outlined" style="font-size:13px">mail</span>'+r.email+'</div></div></td>'+
      '<td><span class="badge '+(r.status==='Active'?'res-status-active':'res-status-inactive')+'">'+r.status+'</span></td>'+
      '<td><div class="tbl-actions" style="opacity:1">'+
        '<button class="tbl-action-btn" onclick="editResident(\''+r.id+'\')"><span class="material-symbols-outlined">edit</span></button>'+
        '<button class="tbl-action-btn danger" onclick="deleteResident(\''+r.id+'\')"><span class="material-symbols-outlined">delete</span></button>'+
      '</div></td></tr>';
  }).join('');
  // Resident inline search
  var resSearch=document.querySelector('#page-residents input[type=text]');
  if (resSearch) {
    resSearch.oninput=function(){
      var q=this.value.toLowerCase();
      tbody.querySelectorAll('tr').forEach(function(tr){ tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none'; });
    };
  }
  // Status filter
  var resSel=document.querySelector('#page-residents select');
  if (resSel) {
    resSel.onchange=function(){
      var v=this.value;
      tbody.querySelectorAll('tr').forEach(function(tr){ tr.style.display=(!v||v==='All Statuses'||tr.textContent.includes(v))?'':'none'; });
    };
  }
}

function editResident(id){
  var r=residents.find(function(x){ return x.id===id; });
  if (!r) return;
  openModal('Edit Resident — '+r.name,
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      fieldVal('Full Name','res-name-e','text',r.name)+
      fieldVal('Address','res-address-e','text',r.address)+
      field('Purok','res-purok-e','select','',['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7','Purok 8','Purok 9'])+
      fieldVal('Phone','res-phone-e','tel',r.phone)+
      fieldVal('Email','res-email-e','email',r.email)+
      field('Status','res-status-e','select','',['Active','Inactive'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Save Changes','updateResident(\''+id+'\')')
  );
  setTimeout(function(){
    var ps=document.getElementById('res-purok-e'); if(ps){ Array.from(ps.options).forEach(function(o){ if(o.value===r.purok)o.selected=true; }); }
    var ss=document.getElementById('res-status-e'); if(ss){ Array.from(ss.options).forEach(function(o){ if(o.value===r.status)o.selected=true; }); }
  },50);
}

function updateResident(id){
  var r=residents.find(function(x){ return x.id===id; }); if (!r) return;
  r.name=val('res-name-e')||r.name; r.address=val('res-address-e')||r.address; r.purok=val('res-purok-e')||r.purok;
  r.phone=val('res-phone-e')||r.phone; r.email=val('res-email-e')||r.email; r.status=val('res-status-e')||r.status;
  renderResidentTable(); closeModal(); showToast('Resident record updated!','success');
}

function deleteResident(id){
  var r=residents.find(function(x){ return x.id===id; }); if (!r) return;
  openModal('Confirm Delete',
    '<div style="text-align:center;padding:16px 0;"><div style="width:56px;height:56px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">'+
      '<span class="material-symbols-outlined" style="font-size:28px;color:#dc2626">delete</span></div>'+
      '<p style="font-size:14px;color:var(--on-surface-variant);line-height:1.6;">Remove <strong>'+r.name+'</strong> from the resident directory? This cannot be undone.</p></div>',
    btnSec('Cancel','closeModal()')+' <button onclick="confirmDeleteResident(\''+id+'\')" style="'+btnPrimStyle()+'background:linear-gradient(135deg,#dc2626,#ef4444);">Delete Resident</button>'
  );
}

function confirmDeleteResident(id){
  var name=residents.find(function(x){ return x.id===id; })?.name;
  residents=residents.filter(function(x){ return x.id!==id; });
  renderResidentTable(); closeModal(); showToast((name||'Resident')+' removed from directory.','info');
}

// ─── DOCUMENTS ───────────────────────────────────────────────

function openNewRequestModal(){
  openModal('New Document Request',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Resident Name','doc-name','text','Full name of resident')+
      field('Document Type','doc-type','select','',['Barangay Clearance','Certificate of Indigency','Business Permit','Residency Certificate','Good Moral Certificate'])+
      field('Purpose','doc-purpose','text','Reason for request')+
      field('Priority','doc-prio','select','',['Standard','Urgent'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Submit Request','saveDocRequest()')
  );
}

function saveDocRequest(){
  var name=val('doc-name'), type=val('doc-type');
  if (!name){ showToast('Please enter a resident name.','error'); return; }
  var initials=name.split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
  var newId='DOC-'+Math.floor(Math.random()*900+100);
  var now=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  documents.unshift({ id:newId, initials:initials, color:'#dbeafe', tcolor:'#1e3a8a', name:name, type:type, date:now, status:'Pending', rejectReason:'' });
  renderDocumentsTable(); closeModal(); showToast('Document request for '+name+' submitted!','success');
}

var docBtns=document.querySelectorAll('#page-documents .pg-actions button, #page-documents .btn-primary, #page-documents .btn-secondary');
document.querySelectorAll('#page-documents button').forEach(function(btn){
  if (btn.textContent.trim()==='Clear Filters') btn.addEventListener('click', function(){
    document.querySelectorAll('#page-documents .filter-select').forEach(function(s){ s.selectedIndex=0; });
    renderDocumentsTable(); showToast('Filters cleared.','info');
  });
  if (btn.textContent.trim()==='Apply View') btn.addEventListener('click', function(){ renderDocumentsTable(); showToast('View updated.','info'); });
});

var docAddBtn=document.querySelector('#page-documents .btn-primary');
if (docAddBtn && docAddBtn.textContent.includes('New')) docAddBtn.addEventListener('click', function(){ openNewRequestModal(); });

function renderDocumentsTable(){
  var tbody=document.querySelector('#page-documents tbody');
  if (!tbody) return;
  tbody.innerHTML=documents.map(function(d){
    var badge='', actions='';
    if (d.status==='Pending'){
      badge='<span class="badge badge-pending"><span class="badge-dot"></span>Pending</span>';
      actions='<button class="tbl-action-btn" onclick="viewDoc(\''+d.id+'\')"><span class="material-symbols-outlined">visibility</span></button>'+
              '<button class="tbl-action-btn" style="color:#16a34a" onclick="approveDoc(\''+d.id+'\')"><span class="material-symbols-outlined">check_circle</span></button>'+
              '<button class="tbl-action-btn danger" onclick="rejectDoc(\''+d.id+'\')"><span class="material-symbols-outlined">cancel</span></button>';
    } else if (d.status==='Approved'){
      badge='<span class="badge badge-approved"><span class="badge-dot"></span>Approved</span>';
      actions='<button class="tbl-action-btn" style="display:flex;align-items:center;gap:5px;padding:6px 10px;color:var(--primary);background:rgba(0,74,198,0.08);border-radius:8px;font-size:11.5px;font-weight:700;" onclick="generateDoc(\''+d.id+'\')">'+
              '<span class="material-symbols-outlined" style="font-size:15px">picture_as_pdf</span>Generate</button>';
    } else if (d.status==='Ready for Pickup'){
      badge='<span class="badge badge-pickup"><span class="badge-dot"></span>Ready for Pickup</span>';
      actions='<button class="tbl-action-btn" onclick="viewDoc(\''+d.id+'\')"><span class="material-symbols-outlined">visibility</span></button>'+
              '<button class="tbl-action-btn" onclick="printDoc(\''+d.id+'\')"><span class="material-symbols-outlined">print</span></button>';
    } else if (d.status==='Rejected'){
      badge='<span class="badge badge-rejected"><span class="badge-dot"></span>Rejected</span>';
      actions='<button class="tbl-action-btn" style="font-size:11.5px;font-weight:700;padding:6px 10px;" onclick="viewRejectReason(\''+d.id+'\')">View Reason</button>';
    }
    return '<tr><td><div class="flex-center gap-3"><div class="av" style="background:'+d.color+';color:'+d.tcolor+'">'+d.initials+'</div><span class="font-bold">'+d.name+'</span></div></td>'+
      '<td class="text-muted">'+d.type+'</td><td class="text-muted text-sm">'+d.date+'</td>'+
      '<td>'+badge+'</td><td><div class="tbl-actions" style="opacity:1">'+actions+'</div></td></tr>';
  }).join('');
}

function viewDoc(id){
  var d=documents.find(function(x){ return x.id===id; }); if (!d) return;
  openModal('Document Request — '+d.id,
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">'+
      kv('Resident Name',d.name)+kv('Document Type',d.type)+kv('Request Date',d.date)+kv('Status',d.status)+
    '</div>'
  );
}

function approveDoc(id){
  var d=documents.find(function(x){ return x.id===id; }); if (!d) return;
  openModal('Approve Request',
    '<p style="font-size:13.5px;color:var(--on-surface-variant);line-height:1.6;">Approve <strong>'+d.type+'</strong> for <strong>'+d.name+'</strong>? This will notify the resident.</p>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Approve','confirmApproveDoc(\''+id+'\')')
  );
}

function confirmApproveDoc(id){
  var d=documents.find(function(x){ return x.id===id; });
  if (d) d.status='Approved';
  renderDocumentsTable(); closeModal(); showToast('Request approved for '+(d?d.name:'resident')+'!','success');
}

function rejectDoc(id){
  var d=documents.find(function(x){ return x.id===id; }); if (!d) return;
  openModal('Reject Request',
    '<p style="font-size:13.5px;color:var(--on-surface-variant);line-height:1.6;margin-bottom:14px;">Provide a reason for rejecting <strong>'+d.type+'</strong> from <strong>'+d.name+'</strong>.</p>'+
    '<textarea id="reject-reason" rows="3" placeholder="e.g. Incomplete supporting documents..." style="width:100%;padding:10px 12px;border-radius:9px;border:1.5px solid rgba(195,198,215,0.4);font-size:13px;font-family:Inter,sans-serif;outline:none;resize:none;"></textarea>',
    btnSec('Cancel','closeModal()')+' <button onclick="confirmRejectDoc(\''+id+'\')" style="'+btnPrimStyle()+'background:linear-gradient(135deg,#dc2626,#ef4444);">Reject</button>'
  );
}

function confirmRejectDoc(id){
  var d=documents.find(function(x){ return x.id===id; });
  if (d){ d.status='Rejected'; d.rejectReason=(document.getElementById('reject-reason')||{}).value||'No reason provided.'; }
  renderDocumentsTable(); closeModal(); showToast('Request from '+(d?d.name:'resident')+' rejected.','info');
}

function viewRejectReason(id){
  var d=documents.find(function(x){ return x.id===id; });
  openModal('Rejection Reason','<p style="font-size:14px;line-height:1.6;color:var(--on-surface-variant);">'+(d&&d.rejectReason?d.rejectReason:'No reason was recorded.')+'</p>');
}

function generateDoc(id){
  var d=documents.find(function(x){ return x.id===id; });
  if (d){ d.status='Ready for Pickup'; }
  showToast('Generating PDF for '+(d?d.name:'resident')+'… Ready for download!','success');
  setTimeout(function(){ renderDocumentsTable(); },600);
}

function printDoc(id){
  var d=documents.find(function(x){ return x.id===id; });
  showToast('Sending '+(d?d.type:'document')+' to printer…','info');
}

// ─── COMPLAINTS ──────────────────────────────────────────────

var cmpBtns=document.querySelectorAll('#page-complaints .pg-actions button');
if (cmpBtns[0]) cmpBtns[0].addEventListener('click', function(){
  openModal('Filter Complaints',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Category','fcmp-cat','select','',['All Categories','Health & Sanitation','Infrastructure','Security','Waste Management','Noise Disturbance'])+
      field('Status','fcmp-status','select','',['All Statuses','Pending Assessment','In Progress','Awaiting Dispatch','Resolved'])+
      field('Date Range','fcmp-date','select','',['All Time','Today','This Week','This Month'])+
    '</div>',
    btnSec('Clear','closeModal()')+' '+btnPrim('Apply Filters','closeModal();showToast(\'Filters applied.\',\'info\');')
  );
});
if (cmpBtns[1]) cmpBtns[1].addEventListener('click', function(){ openFileComplaintModal(); });

function openFileComplaintModal(){
  openModal('File New Complaint',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Complainant Name','cmp-name','text','Full name')+
      field('Category','cmp-cat','select','',['Health & Sanitation','Infrastructure','Security','Waste Management','Noise Disturbance','Public Safety'])+
      field('Priority','cmp-prio','select','',['Urgent','Standard','Low Urgency'])+
      field('Location / Purok','cmp-loc','text','Street or Purok')+
      field('Description','cmp-desc','textarea','Describe the complaint in detail...')+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Submit Complaint','saveComplaint()')
  );
}

function saveComplaint(){
  var name=val('cmp-name');
  if (!name){ showToast('Please enter complainant name.','error'); return; }
  closeModal(); showToast('Complaint filed and assigned case ID #CP-'+Math.floor(Math.random()*9000+1000)+'!','success');
}

// Resolution report
var cwOverlay=document.querySelector('.cw-img-overlay');
if (cwOverlay) cwOverlay.addEventListener('click', function(){
  openModal('Resolution Report — #CP-8839',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#d1fae5;border-radius:10px;padding:14px 16px;display:flex;gap:10px;align-items:center;">'+
        '<span class="material-symbols-outlined" style="color:#065f46;font-size:20px;font-variation-settings:\'FILL\' 1">check_circle</span>'+
        '<span style="font-size:13px;font-weight:700;color:#065f46;">Complaint Resolved – Oct 21, 2023</span></div>'+
      '<div><strong>Complaint:</strong> Excessive Noise – San Jose St.</div>'+
      '<div><strong>Action Taken:</strong> Officers visited the site at 11:30 PM and issued a verbal warning. Residents complied immediately.</div>'+
      '<div><strong>Resolved by:</strong> Tanod Team B (Officer Dela Rosa)</div>'+
      '<div><strong>Follow-up:</strong> None required. Case closed.</div>'+
    '</div>'
  );
});

// Load more
document.querySelectorAll('button').forEach(function(btn){
  if (btn.textContent.trim().startsWith('Load 10 more'))
    btn.addEventListener('click', function(){ showToast('Loading more complaints…','info'); });
});

// ─── PROJECTS ────────────────────────────────────────────────

var projBtns=document.querySelectorAll('#page-projects .pg-actions button');
if (projBtns[0]) projBtns[0].addEventListener('click', function(){
  showToast('Generating projects report…','info');
  setTimeout(function(){ showToast('Report exported!','success'); },1600);
});
if (projBtns[1]) projBtns[1].addEventListener('click', function(){ openCreateProjectModal(); });

function openCreateProjectModal(){
  openModal('Create New Project',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Project Title','prj-title','text','e.g. Phase 5 Drainage Upgrade')+
      field('Status','prj-status','select','',['Planned','Ongoing','Completed'])+
      field('Budget (₱)','prj-budget','text','e.g. 1,500,000')+
      field('Target Date','prj-date','text','e.g. March 2024')+
      field('Contractor','prj-contractor','text','Company name')+
      field('Description','prj-desc','textarea','Brief description...')+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Create Project','closeModal();showToast(\'New project created!\',\'success\');')
  );
}

// Volunteering button
document.querySelectorAll('button').forEach(function(btn){
  if (btn.textContent.trim()==='View Volunteering Details'){
    btn.addEventListener('click', function(){
      openModal('Community-Led Cleanup — Volunteering',
        '<div style="display:flex;flex-direction:column;gap:14px;">'+
          '<div style="background:#dbeafe;border-radius:10px;padding:14px 16px;font-size:13px;font-weight:600;color:#1e3a8a;">📅 November 4–5, 2023 | 7:00 AM – 12:00 PM</div>'+
          '<p style="font-size:13.5px;color:var(--on-surface-variant);line-height:1.6;">Volunteer-driven initiative focused on cleaning public streets, sorting recyclables, and planting trees.</p>'+
          '<div><strong>Meeting Point:</strong> Barangay Hall Gate</div>'+
          '<div><strong>What to bring:</strong> Gloves, trash bags, water</div>'+
          '<div><strong>Registered:</strong> 42 / 100 volunteers</div>'+
        '</div>',
        btnSec('Close','closeModal()')+' '+btnPrim('Register Now','closeModal();showToast(\'Registered as volunteer!\',\'success\');')
      );
    });
  }
});

// ─── ANNOUNCEMENTS ───────────────────────────────────────────

var annFilterBtn=document.querySelector('#page-announcements .pg-actions button');
if (annFilterBtn) annFilterBtn.addEventListener('click', function(){
  openModal('Filter Announcements',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Category','ann-filter-cat','select','',['All Categories','Advisory','Events','Governance','Schedule','Sports','Health'])+
      field('Date Range','ann-filter-date','select','',['All Time','This Week','This Month','Last Month'])+
    '</div>',
    btnSec('Clear','closeModal()')+' '+btnPrim('Apply','closeModal();showToast(\'Filter applied.\',\'info\');')
  );
});

// Featured: Read Full Guidelines
document.querySelectorAll('button').forEach(function(btn){
  if (btn.textContent.trim()==='Read Full Guidelines'){
    btn.addEventListener('click', function(){
      openModal('Vaccination Drive — Full Guidelines',
        '<div style="display:flex;flex-direction:column;gap:14px;font-size:13.5px;color:var(--on-surface-variant);line-height:1.7;">'+
          '<p><strong>Date:</strong> Saturday, October 28, 2023 | <strong>Time:</strong> 8:00 AM – 4:00 PM</p>'+
          '<p><strong>Venue:</strong> Barangay Payatas Multi-Purpose Hall</p>'+
          '<hr style="border:none;border-top:1px solid rgba(195,198,215,0.2);">'+
          '<p><strong>Services:</strong> Flu vaccinations, Pediatric check-ups, Dental screenings, Free medicines</p>'+
          '<p><strong>Who can join:</strong> All Payatas residents. Bring one valid ID and your family health card.</p>'+
          '<p>Walk-ins are welcome. Families with children under 5 and senior citizens get priority lanes.</p>'+
        '</div>'
      );
    });
  }
});

// Ann-card links
document.querySelectorAll('.ann-link').forEach(function(link){
  link.style.cursor='pointer';
  link.addEventListener('click', function(){
    var card=link.closest('.ann-card');
    var title=(card&&card.querySelector('.ann-title'))?card.querySelector('.ann-title').textContent:'Announcement';
    var excerpt=(card&&card.querySelector('.ann-excerpt'))?card.querySelector('.ann-excerpt').textContent:'';
    openModal(title,'<p style="font-size:13.5px;color:var(--on-surface-variant);line-height:1.7;">'+excerpt+'</p>'+
      '<p style="margin-top:14px;font-size:13px;color:#94a3b8;">Full document available at the Barangay Hall.</p>');
  });
});

// Add Announcement card
var annAddCard=document.querySelector('.ann-add-card');
if (annAddCard) annAddCard.addEventListener('click', function(){ openNewAnnouncementModal(); });

function openNewAnnouncementModal(){
  openModal('Post New Announcement',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Title','ann-title-i','text','Announcement headline')+
      field('Category','ann-cat-i','select','',['Advisory','Events','Governance','Schedule','Sports','Health','General'])+
      field('Content','ann-content-i','textarea','Write the full announcement here...')+
      field('Valid Until','ann-date-i','text','e.g. November 30, 2023')+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Post Announcement','saveAnnouncement()')
  );
}

function saveAnnouncement(){
  var title=val('ann-title-i');
  if (!title){ showToast('Please enter an announcement title.','error'); return; }
  closeModal(); showToast('Announcement posted to the community board!','success');
}

// ─── REPORTS ─────────────────────────────────────────────────

var repBtns=document.querySelectorAll('#page-reports .pg-actions button');
if (repBtns[0]) repBtns[0].addEventListener('click', function(){
  openModal('Select Date Range',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('From Date','dr-from','text','e.g. Oct 1, 2023')+
      field('To Date','dr-to','text','e.g. Oct 31, 2023')+
      field('Preset','dr-preset','select','',['This Month','Last Month','Last 3 Months','Last 6 Months','Year to Date'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Apply Range','applyDateRange()')
  );
});
if (repBtns[1]) repBtns[1].addEventListener('click', function(){
  showToast('Compiling all reports…','info');
  setTimeout(function(){ showToast('All reports exported!','success'); },2000);
});

function applyDateRange(){
  var from=val('dr-from')||'Start', to=val('dr-to')||'End';
  var dval=document.querySelector('.drb-val');
  if (dval) dval.textContent=from+' – '+to;
  closeModal(); showToast('Date range updated.','info');
}

// View Historical Data
var histLink=document.querySelector('.mt-head a');
if (histLink) histLink.addEventListener('click', function(e){
  e.preventDefault();
  openModal('Historical Performance Data',
    '<table style="width:100%;border-collapse:collapse;">'+
      '<thead><tr style="background:#f8f9fa;">'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Month</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Requests</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Revenue</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Complaints</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Resolution</th>'+
      '</tr></thead><tbody>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">October 2023</td><td style="padding:12px 14px">2,410</td><td style="padding:12px 14px">₱142,850</td><td style="padding:12px 14px">42</td><td style="padding:12px 14px"><span class="badge badge-approved">94%</span></td></tr>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">September 2023</td><td style="padding:12px 14px">2,150</td><td style="padding:12px 14px">₱128,400</td><td style="padding:12px 14px">58</td><td style="padding:12px 14px"><span class="badge badge-pending">88%</span></td></tr>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">August 2023</td><td style="padding:12px 14px">2,890</td><td style="padding:12px 14px">₱156,200</td><td style="padding:12px 14px">35</td><td style="padding:12px 14px"><span class="badge badge-approved">97%</span></td></tr>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">July 2023</td><td style="padding:12px 14px">2,100</td><td style="padding:12px 14px">₱119,300</td><td style="padding:12px 14px">61</td><td style="padding:12px 14px"><span class="badge badge-pending">82%</span></td></tr>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">June 2023</td><td style="padding:12px 14px">3,120</td><td style="padding:12px 14px">₱174,600</td><td style="padding:12px 14px">28</td><td style="padding:12px 14px"><span class="badge badge-approved">98%</span></td></tr>'+
      '</tbody></table>'
  );
});

// ─── SETTINGS ────────────────────────────────────────────────

var settingsSaveBtn=document.querySelector('#page-settings .btn-primary');
if (settingsSaveBtn) settingsSaveBtn.addEventListener('click', function(){ showToast('Settings saved successfully!','success'); });

// Notification toggles in settings
document.querySelectorAll('#page-settings [style*="border-radius:99px"][style*="cursor:pointer"]').forEach(function(toggle, i){
  var labels=Object.keys(notifToggles);
  var label=labels[i];
  if (!label) return;
  toggle.setAttribute('data-notif-label', label);
  toggle.addEventListener('click', function(){
    notifToggles[label]=!notifToggles[label];
    var isOn=notifToggles[label];
    this.style.background=isOn?'var(--primary)':'var(--surface-container-highest)';
    var knob=this.querySelector('div');
    if (knob){ knob.style.left=isOn?'':'3px'; knob.style.right=isOn?'3px':''; }
    showToast(label+' notifications '+(isOn?'enabled':'disabled'), isOn?'success':'info');
  });
});

// ─── PAGINATION ──────────────────────────────────────────────

document.querySelectorAll('.pg-btns').forEach(function(group){
  group.querySelectorAll('.pg-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      if (this.querySelector('.material-symbols-outlined')) return;
      group.querySelectorAll('.pg-btn').forEach(function(b){ b.classList.remove('active-pg'); });
      this.classList.add('active-pg');
      showToast('Navigated to page '+this.textContent,'info');
    });
  });
});

// ─── FAB BUTTONS ─────────────────────────────────────────────

document.querySelectorAll('.fab').forEach(function(fab){
  fab.addEventListener('click', function(){
    var page=fab.closest('.page');
    if (!page) return;
    if (page.id==='page-complaints') openFileComplaintModal();
    else if (page.id==='page-projects') openCreateProjectModal();
    else if (page.id==='page-announcements') openNewAnnouncementModal();
  });
});

// ─── AVATAR / PROFILE ────────────────────────────────────────

document.querySelector('.avatar').addEventListener('click', function(){
  if (!currentUser) return;
  var initials = getInitials(currentUser.name);
  openModal('My Profile',
    '<div style="text-align:center;padding-bottom:20px;border-bottom:1px solid rgba(195,198,215,0.15);margin-bottom:20px;">'+
      '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-container));display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:800;margin:0 auto 12px;">'+initials+'</div>'+
      '<div style="font-size:17px;font-weight:800;">'+currentUser.name+'</div>'+
      '<div style="font-size:12px;color:#94a3b8;margin-top:3px;">'+currentUser.role+'</div></div>'+
    '<div style="display:flex;flex-direction:column;gap:12px;font-size:13.5px;">'+
      kv('Email', currentUser.email)+
      kv('Role', currentUser.role)+
      kv('Last Login', currentUser.lastLogin)+
      kv('User ID', currentUser.id)+
    '</div>',
    btnSec('Close','closeModal()')+' <button onclick="closeModal();logout();" style="'+btnPrimStyle()+'background:linear-gradient(135deg,#dc2626,#ef4444);">Log Out</button>'
  );
});

// ─── HELPER UTILITIES ────────────────────────────────────────

function val(id){ var el=document.getElementById(id); return el?el.value.trim():''; }

function field(label, id, type, placeholder, options){
  options=options||[];
  var baseStyle='width:100%;padding:9px 12px;background:#f1f5f9;border:1.5px solid rgba(195,198,215,0.3);border-radius:9px;font-size:13.5px;font-family:Inter,sans-serif;color:#191c1d;outline:none;box-sizing:border-box;';
  var lbl='<label style="display:block;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">'+label+'</label>';
  if (type==='select'){
    return '<div>'+lbl+'<select id="'+id+'" style="'+baseStyle+'cursor:pointer;">'+options.map(function(o){ return '<option value="'+o+'">'+o+'</option>'; }).join('')+'</select></div>';
  } else if (type==='textarea'){
    return '<div>'+lbl+'<textarea id="'+id+'" rows="3" placeholder="'+placeholder+'" style="'+baseStyle+'resize:none;"></textarea></div>';
  }
  return '<div>'+lbl+'<input type="'+type+'" id="'+id+'" placeholder="'+placeholder+'" style="'+baseStyle+'"/></div>';
}

function fieldVal(label, id, type, value){
  var baseStyle='width:100%;padding:9px 12px;background:#f1f5f9;border:1.5px solid rgba(195,198,215,0.3);border-radius:9px;font-size:13.5px;font-family:Inter,sans-serif;color:#191c1d;outline:none;box-sizing:border-box;';
  return '<div><label style="display:block;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">'+label+'</label>'+
    '<input type="'+type+'" id="'+id+'" value="'+value+'" style="'+baseStyle+'"/></div>';
}

function kv(k, v){
  return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(195,198,215,0.1);"><span style="color:#64748b;font-weight:600;">'+k+'</span><span>'+v+'</span></div>';
}

function btnPrimStyle(){
  return 'padding:9px 20px;background:linear-gradient(135deg,#004ac6,#2563eb);color:white;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;';
}

function btnPrim(label, onclick){
  return '<button onclick="'+onclick+'" style="'+btnPrimStyle()+'">'+label+'</button>';
}

function btnSec(label, onclick){
  return '<button onclick="'+onclick+'" style="padding:9px 18px;background:#f1f5f9;color:#191c1d;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;">'+label+'</button>';
}

// ══════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════

var style=document.createElement('style');
style.textContent='@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}'+
  '#modal-overlay>div{animation:slideUp 0.22s ease;}'+
  '#toast-container>div{animation:slideUp 0.22s ease;}';
document.head.appendChild(style);

// Check authentication on page load
checkAuth();

// Add Enter key listener for login form
document.getElementById('login-password').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    login();
  }
});