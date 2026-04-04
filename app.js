// ══════════════════════════════════════════════════════════════
// PAYATAS LEDGER - MAIN APPLICATION
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// GLOBAL DATA
// ══════════════════════════════════════════════════════════════

var residents = [];
var documents = [];
var complaints = [];
var projects = [];
var announcements = [];
var users = [];
var currentUser = null;

// Default users
var defaultUsers = [
  { id: 'USR-001', username: 'admin', password: 'admin123', name: 'Admin Payatas', email: 'admin@payatas.gov.ph', role: 'Super Administrator', status: 'Active', lastLogin: 'Now' },
  { id: 'USR-002', username: 'staff1', password: 'staff123', name: 'Maria Santos', email: 'maria.santos@payatas.gov.ph', role: 'Staff', status: 'Active', lastLogin: 'Yesterday' },
  { id: 'USR-003', username: 'staff2', password: 'staff123', name: 'Juan Dela Cruz', email: 'juan.delacruz@payatas.gov.ph', role: 'Staff', status: 'Active', lastLogin: 'Last week' }
];

// Load users from localStorage or use defaults
users = JSON.parse(localStorage.getItem('payatas_users')) || defaultUsers;
if (!localStorage.getItem('payatas_users')) {
  localStorage.setItem('payatas_users', JSON.stringify(defaultUsers));
}

// Check session
currentUser = JSON.parse(sessionStorage.getItem('payatas_current_user')) || null;

// Fallback data
var fallbackResidents = [
  { id: 'PAY-001', initials: 'MS', name: 'Mateo Santos', address: '124 Orchid St. Phase 2', purok: 'Purok 4', phone: '+63 917 555 0192', email: 'mateo@payatas.ph', status: 'Active' },
  { id: 'PAY-002', initials: 'ER', name: 'Elena Reyes', address: 'Blk 5 Lot 12, Area C', purok: 'Purok 1', phone: '+63 920 123 4567', email: 'elena@payatas.ph', status: 'Active' },
  { id: 'PAY-003', initials: 'JR', name: 'Juan Rivera', address: '45 Molave Street', purok: 'Purok 2', phone: '+63 945 987 6543', email: 'juan@payatas.ph', status: 'Inactive' },
  { id: 'PAY-004', initials: 'AL', name: 'Alicia Lopez', address: '78 Sampaguita Ext.', purok: 'Purok 3', phone: '+63 916 222 3344', email: 'alicia@payatas.ph', status: 'Active' },
  { id: 'PAY-005', initials: 'BR', name: 'Bernadette Ramos', address: '33 Kalayaan Ave.', purok: 'Purok 5', phone: '+63 932 441 8800', email: 'berna@payatas.ph', status: 'Active' },
];

var fallbackDocuments = [
  { id: 'DOC-001', name: 'Maria Alicia Dela Cruz', type: 'Barangay Clearance', date: 'Oct 23, 2023', status: 'Pending' },
  { id: 'DOC-002', name: 'Ricardo Santos', type: 'Business Permit', date: 'Oct 22, 2023', status: 'Approved' },
  { id: 'DOC-003', name: 'Juanito Pineda', type: 'Certificate of Indigency', date: 'Oct 21, 2023', status: 'Ready for Pickup' },
  { id: 'DOC-004', name: 'Elena Ledesma', type: 'Barangay Clearance', date: 'Oct 20, 2023', status: 'Rejected' },
  { id: 'DOC-005', name: 'Fernando Bautista', type: 'Business Permit', date: 'Oct 19, 2023', status: 'Approved' },
];

var fallbackComplaints = [
  { id: 'CP-8842', category: 'Health & Sanitation', priority: 'Urgent', status: 'Pending', submitter: 'Elena Javier', date: 'Oct 22, 2023' },
  { id: 'CP-8841', category: 'Infrastructure', priority: 'Standard', status: 'In Progress', submitter: 'Roberto Cruz', date: 'Oct 23, 2023' },
  { id: 'CP-8839', category: 'Noise Disturbance', priority: 'Low', status: 'Resolved', submitter: 'Maria Luna', date: 'Oct 20, 2023' },
  { id: 'CP-8843', category: 'Infrastructure', priority: 'Urgent', status: 'Pending', submitter: 'Samuel Mateo', date: 'Oct 24, 2023' },
];

var fallbackProjects = [
  { id: 'PRJ-001', title: 'Phase 4 Main Road Rehabilitation', description: 'Complete resurfacing of main artery', status: 'Ongoing', budget: 1250000, progress: 65, target: 'Dec 2023' },
  { id: 'PRJ-002', title: 'Solar-Powered Lighting', description: 'Installation of 50 solar lamps', status: 'Completed', budget: 450000, progress: 100, target: 'Sep 2023' },
  { id: 'PRJ-003', title: 'Multipurpose Hall Expansion', description: 'Expand local health center', status: 'Planned', budget: 2800000, progress: 0, target: 'Jan 2024' },
  { id: 'PRJ-004', title: 'Drainage Upgrade', description: 'Drainage for 2000+ households', status: 'Ongoing', budget: 3200000, progress: 28, target: 'March 2024' },
];

var fallbackAnnouncements = [
  { id: 'ANN-001', title: 'Emergency Road Maintenance', category: 'Advisory', content: 'Scheduled repair works this Monday', date: 'Oct 22, 2023' },
  { id: 'ANN-002', title: 'Community Clean-up Drive', category: 'Events', content: 'Monthly initiative to keep parks clean', date: 'Oct 25, 2023' },
  { id: 'ANN-003', title: 'Quarterly Town Hall', category: 'Governance', content: 'Budget transparency report', date: 'Oct 28, 2023' },
];

// Initialize with fallback data
residents = fallbackResidents;
documents = fallbackDocuments;
complaints = fallbackComplaints;
projects = fallbackProjects;
announcements = fallbackAnnouncements;

var notifToggles = { 'Urgent Complaints': true, 'New Documents': true, 'Project Updates': false, 'Weekly Reports': true };

// ══════════════════════════════════════════════════════════════
// AUTHENTICATION
// ══════════════════════════════════════════════════════════════

function login() {
  var username = document.getElementById('login-username').value.trim();
  var password = document.getElementById('login-password').value;
  var errorEl = document.getElementById('login-error');
  
  if (!username || !password) {
    errorEl.textContent = 'Please enter username and password';
    return;
  }
  
  var user = users.find(function(u) { return u.username === username && u.password === password; });
  
  if (user) {
    currentUser = user;
    user.lastLogin = 'Now';
    localStorage.setItem('payatas_users', JSON.stringify(users));
    sessionStorage.setItem('payatas_current_user', JSON.stringify(user));
    showMainApp();
    initApp();
    showToast('Welcome back, ' + user.name + '!', 'success');
  } else {
    errorEl.textContent = 'Invalid username or password';
  }
}

function logout() {
  sessionStorage.removeItem('payatas_current_user');
  currentUser = null;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
  showToast('Logged out successfully', 'info');
}

function showMainApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
}

function isAdmin() {
  return currentUser && (currentUser.role === 'Super Administrator' || currentUser.role === 'Administrator');
}

function togglePassword() {
  var pw = document.getElementById('login-password');
  pw.type = pw.type === 'password' ? 'text' : 'password';
}

// ══════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════

function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  // Show selected page
  var page = document.getElementById('page-' + pageId);
  if (page) {
    page.classList.add('active');
  }
  // Update nav
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var navIndex = { dashboard: 0, residents: 1, documents: 2, complaints: 3, projects: 4, announcements: 5, reports: 6, users: 7, settings: 8 };
  var navItems = document.querySelectorAll('.nav-item');
  if (navIndex[pageId] !== undefined && navItems[navIndex[pageId]]) {
    navItems[navIndex[pageId]].classList.add('active');
  }
  window.scrollTo(0, 0);
}

// ══════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════

function initApp() {
  // Update user info
  if (currentUser) {
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-role').textContent = currentUser.role;
    document.getElementById('user-avatar').textContent = getInitials(currentUser.name);
    document.getElementById('dashboard-welcome').textContent = 'Welcome back, ' + currentUser.name + '!';
  }
  
  // Set date
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Render all tables
  renderResidentsTable();
  renderDocumentsTable();
  renderComplaintsTable();
  renderProjectsGrid();
  renderAnnouncementsGrid();
  renderUsersTable();
  
  // Render notification toggles
  renderNotificationToggles();
  
  // Update admin UI
  if (!isAdmin()) {
    document.querySelectorAll('.admin-only').forEach(function(el) { el.style.display = 'none'; });
  }
}

// ══════════════════════════════════════════════════════════════
// RENDER FUNCTIONS
// ══════════════════════════════════════════════════════════════

function renderResidentsTable() {
  var tbody = document.getElementById('residents-table');
  if (!tbody) return;
  tbody.innerHTML = residents.map(function(r) {
    return '<tr>' +
      '<td><div class="flex-center gap-3"><div class="av" style="background:#dbeafe;color:#1e3a8a">' + r.initials + '</div><div><div class="font-bold">' + r.name + '</div><div class="text-xs text-muted">' + r.id + '</div></div></div></td>' +
      '<td><div class="font-bold text-sm">' + r.address + '</div><div class="text-xs text-muted">' + r.purok + '</div></td>' +
      '<td><div class="text-sm">' + r.phone + '</div><div class="text-xs text-muted">' + r.email + '</div></td>' +
      '<td><span class="badge ' + (r.status === 'Active' ? 'badge-approved' : 'badge-pending') + '">' + r.status + '</span></td>' +
      '<td><button class="tbl-action-btn" onclick="editResident(\'' + r.id + '\')"><span class="material-symbols-outlined">edit</span></button>' +
      '<button class="tbl-action-btn danger" onclick="deleteResident(\'' + r.id + '\')"><span class="material-symbols-outlined">delete</span></button></td></tr>';
  }).join('');
}

function renderDocumentsTable() {
  var tbody = document.getElementById('documents-table');
  if (!tbody) return;
  tbody.innerHTML = documents.map(function(d) {
    var badgeClass = d.status === 'Approved' ? 'badge-approved' : (d.status === 'Rejected' ? 'badge-rejected' : 'badge-pending');
    var initials = d.name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
    return '<tr>' +
      '<td><div class="flex-center gap-3"><div class="av" style="background:#dbeafe;color:#1e3a8a">' + initials + '</div><span class="font-bold">' + d.name + '</span></div></td>' +
      '<td class="text-muted">' + d.type + '</td>' +
      '<td class="text-muted text-sm">' + d.date + '</td>' +
      '<td><span class="badge ' + badgeClass + '">' + d.status + '</span></td>' +
      '<td><button class="tbl-action-btn" onclick="viewDoc(\'' + d.id + '\')"><span class="material-symbols-outlined">visibility</span></button>' +
      (d.status === 'Pending' ? '<button class="tbl-action-btn" style="color:#16a34a" onclick="approveDoc(\'' + d.id + '\')"><span class="material-symbols-outlined">check</span></button><button class="tbl-action-btn danger" onclick="rejectDoc(\'' + d.id + '\')"><span class="material-symbols-outlined">close</span></button>' : '') + '</td></tr>';
  }).join('');
  
  // Also update dashboard
  var dashTbody = document.getElementById('dashboard-docs');
  if (dashTbody) {
    dashTbody.innerHTML = documents.slice(0, 5).map(function(d) {
      var badgeClass = d.status === 'Approved' ? 'badge-approved' : (d.status === 'Rejected' ? 'badge-rejected' : 'badge-pending');
      return '<tr><td>' + d.name + '</td><td class="text-muted">' + d.type + '</td><td class="text-muted text-sm">' + d.date + '</td><td><span class="badge ' + badgeClass + '">' + d.status + '</span></td></tr>';
    }).join('');
  }
}

function renderComplaintsTable() {
  var tbody = document.getElementById('complaints-table');
  if (!tbody) return;
  tbody.innerHTML = complaints.map(function(c) {
    var priorityColor = c.priority === 'Urgent' ? '#dc2626' : (c.priority === 'Standard' ? '#3b82f6' : '#10b981');
    var statusClass = c.status === 'Resolved' ? 'badge-approved' : (c.status === 'In Progress' ? 'badge-inprogress' : 'badge-pending');
    return '<tr>' +
      '<td><div class="flex-center gap-2"><div style="width:8px;height:8px;border-radius:50%;background:' + priorityColor + '"></div><span class="font-bold">' + c.category + '</span></div></td>' +
      '<td><span class="badge ' + statusClass + '">' + c.status + '</span></td>' +
      '<td class="text-muted">' + c.submitter + '</td>' +
      '<td class="text-muted text-sm">' + c.date + '</td>' +
      '<td><button class="tbl-action-btn" onclick="viewComplaint(\'' + c.id + '\')"><span class="material-symbols-outlined">visibility</span></button></td></tr>';
  }).join('');
}

function renderProjectsGrid() {
  var grid = document.getElementById('projects-grid');
  if (!grid) return;
  grid.innerHTML = projects.map(function(p) {
    var statusColors = { 'Ongoing': 'rgba(0,74,198,0.9)', 'Completed': 'rgba(5,150,105,0.9)', 'Planned': 'rgba(148,55,0,0.9)' };
    var gradient = { 'Ongoing': '#1e3a8a,#2563eb', 'Completed': '#064e3b,#10b981', 'Planned': '#7c2d12,#ea580c' };
    return '<div class="proj-card">' +
      '<div class="proj-img" style="background:linear-gradient(135deg,' + gradient[p.status] + ')">' +
      '<div class="proj-status-tag" style="background:' + statusColors[p.status] + '">' + p.status + '</div></div>' +
      '<div class="proj-body">' +
      '<div class="proj-title">' + p.title + '</div>' +
      '<div class="proj-desc">' + p.description + '</div>' +
      '<div class="proj-footer"><div class="proj-progress-label"><span>Progress</span><span>' + p.progress + '%</span></div>' +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + p.progress + '%"></div></div>' +
      '<div class="proj-meta"><div class="proj-meta-item"><span class="mkey">Budget</span><span class="mval">₱' + p.budget.toLocaleString() + '</span></div><div class="proj-meta-item"><span class="mkey">Target</span><span class="mval">' + p.target + '</span></div></div></div></div></div>';
  }).join('');
}

function renderAnnouncementsGrid() {
  var grid = document.getElementById('announcements-grid');
  if (!grid) return;
  grid.innerHTML = announcements.map(function(a) {
    var catColors = { 'Advisory': '#943700', 'Events': '#16a34a', 'Governance': '#2563eb' };
    return '<div class="ann-card">' +
      '<div class="ann-img" style="background:linear-gradient(135deg,#1e293b,#334155)"><div class="ann-cat" style="background:' + (catColors[a.category] || '#7c3aed') + '">' + a.category + '</div></div>' +
      '<div class="ann-body"><div class="ann-date"><span class="material-symbols-outlined">calendar_month</span> ' + a.date + '</div>' +
      '<div class="ann-title">' + a.title + '</div><div class="ann-excerpt">' + a.content + '</div></div></div>';
  }).join('');
}

function renderUsersTable() {
  var tbody = document.getElementById('users-table');
  if (!tbody) return;
  tbody.innerHTML = users.map(function(u) {
    var roleBadge = u.role === 'Super Administrator' || u.role === 'Administrator' ? '<span style="background:#dbeafe;color:#1e3a8a;padding:3px 8px;border-radius:6px;font-size:10px;">' + u.role + '</span>' : '<span style="background:#f1f5f9;color:#475569;padding:3px 8px;border-radius:6px;font-size:10px;">' + u.role + '</span>';
    return '<tr>' +
      '<td><div class="flex-center gap-3"><div class="av" style="background:#dbeafe;color:#1e3a8a">' + getInitials(u.name) + '</div><div><div class="font-bold">' + u.name + '</div><div class="text-xs text-muted">' + u.username + '</div></div></div></td>' +
      '<td>' + roleBadge + '</td>' +
      '<td class="text-muted">' + u.email + '</td>' +
      '<td><span class="badge ' + (u.status === 'Active' ? 'badge-approved' : 'badge-pending') + '">' + u.status + '</span></td>' +
      '<td><button class="tbl-action-btn" onclick="editUser(\'' + u.id + '\')"><span class="material-symbols-outlined">edit</span></button><button class="tbl-action-btn danger" onclick="deleteUser(\'' + u.id + '\')"><span class="material-symbols-outlined">delete</span></button></td></tr>';
  }).join('');
}

function renderNotificationToggles() {
  var container = document.getElementById('notification-toggles');
  if (!container) return;
  var html = '';
  Object.keys(notifToggles).forEach(function(key) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">' +
      '<span>' + key + '</span>' +
      '<div class="toggle' + (notifToggles[key] ? ' active' : '') + '" data-key="' + key + '" onclick="toggleNotification(this)" style="width:40px;height:22px;background:var(--primary);border-radius:99px;position:relative;cursor:pointer">' +
      '<div style="position:absolute;right:3px;top:3px;width:16px;height:16px;background:white;border-radius:50%"></div></div></div>';
  });
  container.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════
// MODALS AND UI
// ══════════════════════════════════════════════════════════════

function openModal(title, content, buttons) {
  var overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,36,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = '<div style="background:white;border-radius:18px;width:100%;max-width:500px;padding:24px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<h3 style="font-size:18px;font-weight:800">' + title + '</h3>' +
    '<button onclick="closeModal()" style="background:none;border:none;cursor:pointer;"><span class="material-symbols-outlined">close</span></button></div>' +
    '<div style="margin-bottom:20px;">' + content + '</div>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;">' + (buttons || '') + '</div></div>';
  overlay.onclick = function(e) { if (e.target === overlay) closeModal(); };
  document.body.appendChild(overlay);
}

function closeModal() {
  var overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}

function showToast(message, type) {
  type = type || 'success';
  var colors = { success: '#10b981', error: '#dc2626', info: '#2563eb' };
  var icons = { success: 'check_circle', error: 'cancel', info: 'info' };
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:10px;z-index:9999;border-left:4px solid ' + colors[type] + ';';
  toast.innerHTML = '<span class="material-symbols-outlined" style="color:' + colors[type] + '">' + icons[type] + '</span><span>' + message + '</span>';
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3000);
}

function getInitials(name) {
  return name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
}

// ══════════════════════════════════════════════════════════════
// MODAL FORMS
// ══════════════════════════════════════════════════════════════

function openNewRequestModal() {
  openModal('New Document Request',
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
    '<input type="text" id="doc-name" placeholder="Resident Name" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<select id="doc-type" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<option>Barangay Clearance</option><option>Certificate of Indigency</option><option>Business Permit</option></select>' +
    '<input type="text" id="doc-purpose" placeholder="Purpose" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"></div>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Cancel</button>' +
    '<button onclick="saveNewRequest()" style="padding:10px 20px;background:linear-gradient(135deg,#004ac6,#2563eb);color:white;border:none;border-radius:8px;cursor:pointer;">Submit</button>'
  );
}

function saveNewRequest() {
  var name = document.getElementById('doc-name').value;
  var type = document.getElementById('doc-type').value;
  if (!name) { showToast('Please enter resident name', 'error'); return; }
  var initials = name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
  var newDoc = { id: 'DOC-' + Math.floor(Math.random() * 900 + 100), name: name, type: type, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), status: 'Pending' };
  documents.unshift(newDoc);
  closeModal();
  renderDocumentsTable();
  showToast('Document request submitted!', 'success');
}

function openAddResidentModal() {
  openModal('Add New Resident',
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
    '<input type="text" id="res-name" placeholder="Full Name" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<input type="text" id="res-address" placeholder="Address" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<select id="res-purok" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"><option>Purok 1</option><option>Purok 2</option><option>Purok 3</option><option>Purok 4</option><option>Purok 5</option></select>' +
    '<input type="text" id="res-phone" placeholder="Phone" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"></div>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Cancel</button>' +
    '<button onclick="saveNewResident()" style="padding:10px 20px;background:linear-gradient(135deg,#004ac6,#2563eb);color:white;border:none;border-radius:8px;cursor:pointer;">Save</button>'
  );
}

function saveNewResident() {
  var name = document.getElementById('res-name').value;
  var address = document.getElementById('res-address').value;
  var purok = document.getElementById('res-purok').value;
  var phone = document.getElementById('res-phone').value;
  if (!name || !address) { showToast('Please fill required fields', 'error'); return; }
  var initials = name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
  residents.push({ id: 'PAY-' + Math.floor(Math.random() * 9000 + 1000), initials: initials, name: name, address: address, purok: purok, phone: phone, email: '', status: 'Active' });
  closeModal();
  renderResidentsTable();
  showToast('Resident added!', 'success');
}

function openNewComplaintModal() {
  openModal('New Complaint',
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
    '<input type="text" id="cmp-name" placeholder="Complainant Name" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<select id="cmp-category" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"><option>Health & Sanitation</option><option>Infrastructure</option><option>Noise Disturbance</option><option>Security</option></select>' +
    '<select id="cmp-priority" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"><option>Urgent</option><option>Standard</option><option>Low</option></select>' +
    '<input type="text" id="cmp-location" placeholder="Location / Purok" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"></div>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Cancel</button>' +
    '<button onclick="saveNewComplaint()" style="padding:10px 20px;background:linear-gradient(135deg,#004ac6,#2563eb);color:white;border:none;border-radius:8px;cursor:pointer;">Submit</button>'
  );
}

function saveNewComplaint() {
  var name = document.getElementById('cmp-name').value;
  var category = document.getElementById('cmp-category').value;
  var priority = document.getElementById('cmp-priority').value;
  if (!name) { showToast('Please enter complainant name', 'error'); return; }
  var newCmp = { id: 'CP-' + Math.floor(Math.random() * 9000 + 1000), category: category, priority: priority, status: 'Pending', submitter: name, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
  complaints.unshift(newCmp);
  closeModal();
  renderComplaintsTable();
  showToast('Complaint filed!', 'success');
}

function openNewProjectModal() {
  openModal('New Project',
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
    '<input type="text" id="prj-title" placeholder="Project Title" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<select id="prj-status" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"><option>Planned</option><option>Ongoing</option><option>Completed</option></select>' +
    '<input type="text" id="prj-budget" placeholder="Budget (e.g. 1000000)" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"></div>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Cancel</button>' +
    '<button onclick="saveNewProject()" style="padding:10px 20px;background:linear-gradient(135deg,#004ac6,#2563eb);color:white;border:none;border-radius:8px;cursor:pointer;">Create</button>'
  );
}

function saveNewProject() {
  var title = document.getElementById('prj-title').value;
  var status = document.getElementById('prj-status').value;
  var budget = parseInt(document.getElementById('prj-budget').value) || 0;
  if (!title) { showToast('Please enter project title', 'error'); return; }
  projects.push({ id: 'PRJ-' + Math.floor(Math.random() * 900 + 100), title: title, description: '', status: status, budget: budget, progress: 0, target: 'TBD' });
  closeModal();
  renderProjectsGrid();
  showToast('Project created!', 'success');
}

function openNewAnnouncementModal() {
  openModal('New Announcement',
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
    '<input type="text" id="ann-title" placeholder="Title" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<select id="ann-category" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"><option>Advisory</option><option>Events</option><option>Governance</option></select>' +
    '<textarea id="ann-content" placeholder="Content" rows="3" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"></textarea></div>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Cancel</button>' +
    '<button onclick="saveNewAnnouncement()" style="padding:10px 20px;background:linear-gradient(135deg,#004ac6,#2563eb);color:white;border:none;border-radius:8px;cursor:pointer;">Post</button>'
  );
}

function saveNewAnnouncement() {
  var title = document.getElementById('ann-title').value;
  var category = document.getElementById('ann-category').value;
  var content = document.getElementById('ann-content').value;
  if (!title) { showToast('Please enter title', 'error'); return; }
  announcements.unshift({ id: 'ANN-' + Math.floor(Math.random() * 900 + 100), title: title, category: category, content: content, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) });
  closeModal();
  renderAnnouncementsGrid();
  showToast('Announcement posted!', 'success');
}

function openAddUserModal() {
  openModal('Add User',
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
    '<input type="text" id="new-user-name" placeholder="Full Name" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<input type="text" id="new-user-username" placeholder="Username" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<input type="email" id="new-user-email" placeholder="Email" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<select id="new-user-role" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"><option>Staff</option><option>Administrator</option><option>Super Administrator</option></select></div>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Cancel</button>' +
    '<button onclick="createNewUser()" style="padding:10px 20px;background:linear-gradient(135deg,#004ac6,#2563eb);color:white;border:none;border-radius:8px;cursor:pointer;">Create</button>'
  );
}

function createNewUser() {
  var name = document.getElementById('new-user-name').value;
  var username = document.getElementById('new-user-username').value;
  var email = document.getElementById('new-user-email').value;
  var role = document.getElementById('new-user-role').value;
  if (!name || !username) { showToast('Please fill required fields', 'error'); return; }
  users.push({ id: 'USR-' + Math.floor(Math.random() * 900 + 100), username: username, password: 'password123', name: name, email: email, role: role, status: 'Active', lastLogin: 'Never' });
  localStorage.setItem('payatas_users', JSON.stringify(users));
  closeModal();
  renderUsersTable();
  showToast('User created!', 'success');
}

function saveSettings() {
  var name = document.getElementById('setting-name').value;
  var district = document.getElementById('setting-district').value;
  var contact = document.getElementById('setting-contact').value;
  var email = document.getElementById('setting-email').value;
  localStorage.setItem('barangay_settings', JSON.stringify({ name: name, district: district, contact: contact, email: email, notifications: notifToggles }));
  showToast('Settings saved!', 'success');
}

function toggleNotification(el) {
  var key = el.getAttribute('data-key');
  notifToggles[key] = !notifToggles[key];
  el.style.background = notifToggles[key] ? 'var(--primary)' : 'var(--surface-container-highest)';
  el.querySelector('div').style.left = notifToggles[key] ? '21px' : '3px';
}

// ══════════════════════════════════════════════════════════════
// DOCUMENT ACTIONS
// ══════════════════════════════════════════════════════════════

function viewDoc(id) {
  var d = documents.find(function(x) { return x.id === id; });
  if (!d) return;
  openModal('Document Details',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div><strong>Resident:</strong></div><div>' + d.name + '</div><div><strong>Type:</strong></div><div>' + d.type + '</div><div><strong>Date:</strong></div><div>' + d.date + '</div><div><strong>Status:</strong></div><div>' + d.status + '</div></div>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Close</button>'
  );
}

function approveDoc(id) {
  var d = documents.find(function(x) { return x.id === id; });
  if (d) { d.status = 'Approved'; renderDocumentsTable(); showToast('Document approved!', 'success'); }
}

function rejectDoc(id) {
  var d = documents.find(function(x) { return x.id === id; });
  if (d) { d.status = 'Rejected'; renderDocumentsTable(); showToast('Document rejected', 'info'); }
}

function viewComplaint(id) {
  var c = complaints.find(function(x) { return x.id === id; });
  if (!c) return;
  openModal('Complaint Details',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div><strong>Category:</strong></div><div>' + c.category + '</div><div><strong>Priority:</strong></div><div>' + c.priority + '</div><div><strong>Status:</strong></div><div>' + c.status + '</div><div><strong>Submitter:</strong></div><div>' + c.submitter + '</div><div><strong>Date:</strong></div><div>' + c.date + '</div></div>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Close</button>'
  );
}

// ══════════════════════════════════════════════════════════════
// USER ACTIONS
// ══════════════════════════════════════════════════════════════

function editUser(id) {
  var u = users.find(function(x) { return x.id === id; });
  if (!u) return;
  openModal('Edit User',
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
    '<input type="text" id="edit-user-name" value="' + u.name + '" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<input type="email" id="edit-user-email" value="' + u.email + '" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<select id="edit-user-role" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"><option' + (u.role === 'Staff' ? ' selected' : '') + '>Staff</option><option' + (u.role === 'Administrator' ? ' selected' : '') + '>Administrator</option></select></div>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Cancel</button>' +
    '<button onclick="updateUser(\'' + id + '\')" style="padding:10px 20px;background:linear-gradient(135deg,#004ac6,#2563eb);color:white;border:none;border-radius:8px;cursor:pointer;">Save</button>'
  );
}

function updateUser(id) {
  var u = users.find(function(x) { return x.id === id; });
  if (u) {
    u.name = document.getElementById('edit-user-name').value;
    u.email = document.getElementById('edit-user-email').value;
    u.role = document.getElementById('edit-user-role').value;
    localStorage.setItem('payatas_users', JSON.stringify(users));
    renderUsersTable();
    closeModal();
    showToast('User updated!', 'success');
  }
}

function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  users = users.filter(function(x) { return x.id !== id; });
  localStorage.setItem('payatas_users', JSON.stringify(users));
  renderUsersTable();
  showToast('User deleted', 'info');
}

function editResident(id) {
  var r = residents.find(function(x) { return x.id === id; });
  if (!r) return;
  openModal('Edit Resident',
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
    '<input type="text" id="edit-res-name" value="' + r.name + '" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<input type="text" id="edit-res-address" value="' + r.address + '" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">' +
    '<input type="text" id="edit-res-phone" value="' + r.phone + '" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"></div>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Cancel</button>' +
    '<button onclick="updateResident(\'' + id + '\')" style="padding:10px 20px;background:linear-gradient(135deg,#004ac6,#2563eb);color:white;border:none;border-radius:8px;cursor:pointer;">Save</button>'
  );
}

function updateResident(id) {
  var r = residents.find(function(x) { return x.id === id; });
  if (r) {
    r.name = document.getElementById('edit-res-name').value;
    r.address = document.getElementById('edit-res-address').value;
    r.phone = document.getElementById('edit-res-phone').value;
    renderResidentsTable();
    closeModal();
    showToast('Resident updated!', 'success');
  }
}

function deleteResident(id) {
  if (!confirm('Delete this resident?')) return;
  residents = residents.filter(function(x) { return x.id !== id; });
  renderResidentsTable();
  showToast('Resident deleted', 'info');
}

// ══════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ══════════════════════════════════════════════════════════════

function exportResidentsCSV() {
  var csv = 'ID,Name,Address,Purok,Phone,Status\n';
  residents.forEach(function(r) { csv += r.id + ',' + r.name + ',' + r.address + ',' + r.purok + ',' + r.phone + ',' + r.status + '\n'; });
  downloadCSV(csv, 'residents');
  showToast('Residents exported!', 'success');
}

function exportDocumentsCSV() {
  var csv = 'ID,Resident,Type,Date,Status\n';
  documents.forEach(function(d) { csv += d.id + ',' + d.name + ',' + d.type + ',' + d.date + ',' + d.status + '\n'; });
  downloadCSV(csv, 'documents');
  showToast('Documents exported!', 'success');
}

function exportComplaintsCSV() {
  var csv = 'ID,Category,Priority,Status,Submitter,Date\n';
  complaints.forEach(function(c) { csv += c.id + ',' + c.category + ',' + c.priority + ',' + c.status + ',' + c.submitter + ',' + c.date + '\n'; });
  downloadCSV(csv, 'complaints');
  showToast('Complaints exported!', 'success');
}

function exportProjectsCSV() {
  var csv = 'ID,Title,Status,Budget,Progress\n';
  projects.forEach(function(p) { csv += p.id + ',' + p.title + ',' + p.status + ',' + p.budget + ',' + p.progress + '\n'; });
  downloadCSV(csv, 'projects');
  showToast('Projects exported!', 'success');
}

function exportUsersCSV() {
  var csv = 'ID,Name,Email,Role,Status\n';
  users.forEach(function(u) { csv += u.id + ',' + u.name + ',' + u.email + ',' + u.role + ',' + u.status + '\n'; });
  downloadCSV(csv, 'users');
  showToast('Users exported!', 'success');
}

function exportAllReports() {
  var content = 'PAYATAS LEDGER - ALL REPORTS\nGenerated: ' + new Date().toLocaleDateString() + '\n\n';
  content += 'RESIDENTS: ' + residents.length + '\n';
  content += 'DOCUMENTS: ' + documents.length + '\n';
  content += 'COMPLAINTS: ' + complaints.length + '\n';
  content += 'PROJECTS: ' + projects.length + '\n';
  content += 'USERS: ' + users.length + '\n';
  downloadCSV(content, 'all_reports');
  showToast('All reports exported!', 'success');
}

function exportDashboardReport() {
  var content = 'DASHBOARD REPORT\nGenerated: ' + new Date().toLocaleDateString() + '\n\n';
  content += 'Total Residents: ' + residents.length + '\n';
  content += 'Pending Requests: ' + documents.filter(function(d) { return d.status === 'Pending'; }).length + '\n';
  content += 'Active Complaints: ' + complaints.filter(function(c) { return c.status !== 'Resolved'; }).length + '\n';
  downloadCSV(content, 'dashboard_report');
  showToast('Dashboard report exported!', 'success');
}

function downloadCSV(content, filename) {
  var blob = new Blob([content], { type: 'text/csv' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  link.click();
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS & PROFILE
// ══════════════════════════════════════════════════════════════

function showNotifications() {
  var notifs = [
    { icon: 'warning', color: '#dc2626', msg: 'Urgent: Water pipe burst on Dahlia Ave', time: '2 hours ago' },
    { icon: 'description', color: '#d97706', msg: 'New document request from Maria Cruz', time: '3 hours ago' },
    { icon: 'campaign', color: '#2563eb', msg: 'New announcement posted', time: '1 day ago' }
  ];
  var html = notifs.map(function(n) {
    return '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #e2e8f0;">' +
      '<div style="width:36px;height:36px;background:' + n.color + '20' + ';border-radius:8px;display:flex;align-items:center;justify-content:center;">' +
      '<span class="material-symbols-outlined" style="color:' + n.color + '">' + n.icon + '</span></div>' +
      '<div><div style="font-size:13px;font-weight:600">' + n.msg + '</div><div style="font-size:11px;color:#64748b">' + n.time + '</div></div></div>';
  }).join('');
  openModal('Notifications', html + '<button onclick="closeModal();showToast(\'All marked as read\',\'success\')" style="margin-top:12px;width:100%;padding:10px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Mark all as read</button>', '');
}

function showProfile() {
  if (!currentUser) return;
  openModal('My Profile',
    '<div style="text-align:center;padding-bottom:20px;border-bottom:1px solid #e2e8f0;margin-bottom:20px;">' +
    '<div style="width:64px;height:64px;background:linear-gradient(135deg,var(--primary),#2563eb);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:800;margin:0 auto 12px;">' + getInitials(currentUser.name) + '</div>' +
    '<div style="font-size:17px;font-weight:800">' + currentUser.name + '</div>' +
    '<div style="font-size:12px;color:#94a3b8">' + currentUser.role + '</div></div>' +
    '<div style="font-size:14px;"><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b">Email</span><span>' + currentUser.email + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b">Role</span><span>' + currentUser.role + '</span></div></div>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Close</button>' +
    '<button onclick="closeModal();logout()" style="padding:10px 20px;background:#dc2626;color:white;border:none;border-radius:8px;cursor:pointer;">Log Out</button>'
  );
}

function openEmergencyAlert() {
  openModal('Launch Emergency Alert',
    '<div style="background:#fee2e2;padding:16px;border-radius:12px;margin-bottom:16px;">' +
    '<span style="color:#dc2626;font-weight:700">Warning: This will broadcast to ALL residents!</span></div>' +
    '<textarea id="emergency-msg" rows="3" placeholder="Enter emergency message..." style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"></textarea>',
    '<button onclick="closeModal()" style="padding:10px 20px;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;">Cancel</button>' +
    '<button onclick="sendEmergencyAlert()" style="padding:10px 20px;background:#dc2626;color:white;border:none;border-radius:8px;cursor:pointer;">SEND ALERT</button>'
  );
}

function sendEmergencyAlert() {
  var msg = document.getElementById('emergency-msg').value;
  if (!msg) { showToast('Please enter a message', 'error'); return; }
  closeModal();
  showToast('Emergency alert broadcast sent!', 'success');
}

// ══════════════════════════════════════════════════════════════
// FILTER FUNCTIONS
// ══════════════════════════════════════════════════════════════

function filterResidents() {
  var q = document.getElementById('residents-search').value.toLowerCase();
  var status = document.getElementById('residents-status-filter').value;
  var tbody = document.getElementById('residents-table');
  tbody.querySelectorAll('tr').forEach(function(tr) {
    var match = tr.textContent.toLowerCase().includes(q);
    var statusMatch = !status || tr.textContent.includes(status);
    tr.style.display = (match && statusMatch) ? '' : 'none';
  });
}

function filterDocuments() {
  var q = document.getElementById('documents-search').value.toLowerCase();
  var type = document.getElementById('documents-type-filter').value;
  var status = document.getElementById('documents-status-filter').value;
  var tbody = document.getElementById('documents-table');
  tbody.querySelectorAll('tr').forEach(function(tr) {
    var match = tr.textContent.toLowerCase().includes(q);
    var typeMatch = !type || tr.textContent.includes(type);
    var statusMatch = !status || tr.textContent.includes(status);
    tr.style.display = (match && typeMatch && statusMatch) ? '' : 'none';
  });
}

function showDocFilters() {
  // Toggle the filter bar visibility on documents page
  var filterBar = document.querySelector('#page-documents .filter-bar');
  if (filterBar) {
    if (filterBar.style.display === 'none') {
      filterBar.style.display = 'flex';
    } else {
      filterBar.style.display = 'none';
    }
  }
}

function filterComplaints(filter, btn) {
  document.querySelectorAll('#page-complaints .filter-chip').forEach(function(c) { c.className = 'filter-chip chip-inactive'; });
  btn.className = 'filter-chip chip-active';
  var tbody = document.getElementById('complaints-table');
  tbody.querySelectorAll('tr').forEach(function(tr) {
    if (filter === 'all') { tr.style.display = ''; return; }
    var isResolved = tr.textContent.includes('Resolved');
    var isPending = tr.textContent.includes('Pending') || tr.textContent.includes('In Progress');
    tr.style.display = (filter === 'resolved' && isResolved) || (filter === 'pending' && isPending) ? '' : 'none';
  });
}

// ══════════════════════════════════════════════════════════════
// INITIALIZE ON LOAD
// ══════════════════════════════════════════════════════════════

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (currentUser) { showMainApp(); initApp(); }
    document.getElementById('login-password').addEventListener('keypress', function(e) { if (e.key === 'Enter') login(); });
  });
} else {
  if (currentUser) { showMainApp(); initApp(); }
  document.getElementById('login-password').addEventListener('keypress', function(e) { if (e.key === 'Enter') login(); });
}