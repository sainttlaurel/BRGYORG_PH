// ══════════════════════════════════════════════════════════════
// MAIN APPLICATION ENTRY POINT
// Payatas Ledger - Barangay Civic Management System
// ══════════════════════════════════════════════════════════════

// Load page-specific modules (commented out for single-file approach)
// Uncomment these to load from separate files
// require('./pages/dashboard.js');
// require('./pages/residents.js');
// require('./pages/documents.js');
// require('./pages/complaints.js');
// require('./pages/projects.js');
// require('./pages/announcements.js');
// require('./pages/reports.js');
// require('./pages/users.js');
// require('./pages/settings.js');

// ══════════════════════════════════════════════════════════════
// CORE FUNCTIONS (Shared across all pages)
// ══════════════════════════════════════════════════════════════

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
    
    // Load complaints
    try {
      const complaintsData = await getComplaints();
      if (complaintsData && complaintsData.length > 0) {
        complaints = complaintsData.map(function(c) {
          return {
            id: c.complaint_id || c.id,
            category: c.category,
            priority: c.priority,
            status: c.status,
            submitter: c.complainant_name || c.submitter,
            purok: c.purok || c.location,
            description: c.description,
            date: c.submitted_date ? new Date(c.submitted_date).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : 'N/A'
          };
        });
      } else {
        complaints = fallbackComplaints;
      }
    } catch (e) {
      complaints = fallbackComplaints;
    }
    
    console.log('✅ Data loaded from Supabase');
    return true;
  } catch (error) {
    console.error('Error loading data, using fallback:', error);
    // Use fallback data on error
    residents = fallbackResidents;
    documents = fallbackDocuments;
    complaints = fallbackComplaints;
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
// AUTHENTICATION
// ══════════════════════════════════════════════════════════════

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
      if (isAdmin()) {
        renderUsersTable();
        updateUserStats();
      }
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
      if (isAdmin()) {
        renderUsersTable();
        updateUserStats();
      }
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
      if (isAdmin()) {
        renderUsersTable();
        updateUserStats();
      }
      updateAdminUI();
    }).catch(function(){
      // Fallback if loadAllData fails
      renderResidentTable();
      renderDocumentsTable();
      if (isAdmin()) {
        renderUsersTable();
        updateUserStats();
      }
      updateAdminUI();
    });
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

// ══════════════════════════════════════════════════════════════
// PRINT FUNCTIONS
// ══════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════
// FALLBACK DATA
// ══════════════════════════════════════════════════════════════

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

var fallbackComplaints = [
  { id:'CP-8842', category:'Health & Sanitation', priority:'Urgent', status:'Pending Assessment', submitter:'Elena Javier', purok:'Purok 3', description:'Large scale dumping detected near the community playground. Potential health hazard for children.', date:'Oct 22, 2023' },
  { id:'CP-8841', category:'Infrastructure', priority:'Standard', status:'In Progress', submitter:'Roberto Cruz', purok:'Purok 2', description:'The main street lamp at Block 5 has been flickering for three days and is now completely dark.', date:'Oct 23, 2023' },
  { id:'CP-8839', category:'Noise Disturbance', priority:'Low Urgency', status:'Resolved', submitter:'Maria Luna', purok:'Purok 1', description:'Report of loud music and construction work occurring past 10 PM.', date:'Oct 20, 2023' },
  { id:'CP-8843', category:'Infrastructure', priority:'Urgent', status:'Awaiting Dispatch', submitter:'Samuel Mateo', purok:'Purok 4', description:'Major leak causing flooding in front of the community center.', date:'Oct 24, 2023' },
];

var fallbackProjects = [
  { id: 'PRJ-001', title: 'Phase 4 Main Road Rehabilitation', description: 'Complete resurfacing of the main artery to improve traffic flow.', status: 'Ongoing', budget: 1250000, progress: 65, target_date: 'Dec 2023' },
  { id: 'PRJ-002', title: 'Solar-Powered Lighting Initiative', description: 'Installation of 50 high-efficiency solar lamps across dark corridors.', status: 'Completed', budget: 450000, progress: 100, target_date: 'Sep 2023' },
  { id: 'PRJ-003', title: 'Multipurpose Hall Expansion', description: 'Expand local health center for community events.', status: 'Planned', budget: 2800000, progress: 0, target_date: 'Jan 2024' },
  { id: 'PRJ-004', title: 'Central Payatas Drainage Upgrade', description: 'Drainage improvement for 2000+ households.', status: 'Ongoing', budget: 3200000, progress: 28, target_date: 'March 2024' },
];

var fallbackAnnouncements = [
  { id: 'ANN-001', title: 'Emergency Road Maintenance: IBP Road Section', category: 'Advisory', content: 'Scheduled repair works will begin this Monday. Please expect rerouting and minor delays in the North sector.', published_at: '2023-10-22' },
  { id: 'ANN-002', title: 'Community Clean-up Drive: Payatas Green', category: 'Events', content: 'Monthly initiative to keep public parks clean. Join us this Saturday!', published_at: '2023-10-25' },
  { id: 'ANN-003', title: 'Quarterly Town Hall: Budget Transparency', category: 'Governance', content: 'Financial performance review and upcoming projects presentation.', published_at: '2023-10-28' },
];

var notifToggles = { 'Urgent Complaints': true, 'New Document Requests': true, 'Project Updates': false, 'Weekly Reports': true };

// Initialize fallback data
residents = fallbackResidents;
documents = fallbackDocuments;
complaints = fallbackComplaints;
projects = fallbackProjects;
announcements = fallbackAnnouncements;

// ══════════════════════════════════════════════════════════════
// UI HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

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
  // Remove active class from all pages
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  // Remove active class from all nav items
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
  
  // Activate the selected page
  var page = document.getElementById('page-'+pageId);
  if (page) {
    page.classList.add('active');
    console.log('Page activated: page-' + pageId);
  } else {
    console.error('Page not found: page-' + pageId);
  }
  
  var navMap = { 'dashboard':0,'residents':1,'documents':2,'complaints':3,'projects':4,'announcements':5,'reports':6,'users':7,'settings':8 };
  var navItems = document.querySelectorAll('.nav-item');
  if (navMap[pageId] !== undefined && navItems[navMap[pageId]]) {
    navItems[navMap[pageId]].classList.add('active');
  }
  
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
// GLOBAL SEARCH
// ══════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════
// NOTIFICATION BELL
// ══════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════
// SIDEBAR CTA
// ══════════════════════════════════════════════════════════════

document.querySelector('.sidebar-cta-btn').addEventListener('click', function(){ openNewAnnouncementModal(); });

// ══════════════════════════════════════════════════════════════
// PROFILE / AVATAR
// ══════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════
// PAGINATION
// ══════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════
// FAB BUTTONS
// ══════════════════════════════════════════════════════════════

document.querySelectorAll('.fab').forEach(function(fab){
  fab.addEventListener('click', function(){
    var page=fab.closest('.page');
    if (!page) return;
    if (page.id==='page-complaints') openNewComplaintModal();
    else if (page.id==='page-projects') openNewProjectModal();
    else if (page.id==='page-announcements') openNewAnnouncementModal();
  });
});

// ══════════════════════════════════════════════════════════════
// SYSTEM MANUAL & SUPPORT
// ══════════════════════════════════════════════════════════════

function showSystemManual(){
  openModal('System Manual - Payatas Ledger (Demo)',
    '<div style="display:flex;flex-direction:column;gap:16px;font-size:13.5px;color:var(--on-surface-variant);line-height:1.7;">'+
      '<div style="background:#fef3c7;border-radius:10px;padding:14px 16px;font-size:13px;font-weight:600;color:#92400e;">⚠️ Demo Project - For Educational Purposes Only</div>'+
      '<div style="background:#dbeafe;border-radius:10px;padding:14px 16px;font-size:13px;font-weight:600;color:#1e3a8a;">📖 User Guide v2.4</div>'+
      '<div><strong>1. Login</strong><br>Use your username and password to access the system. Default admin: admin / admin123</div>'+
      '<div><strong>2. Residents</strong><br>Manage resident records, add new residents, filter by purok or status.</div>'+
      '<div><strong>3. Document Requests</strong><br>Process document requests - View details, Approve, Reject, or Generate PDF.</div>'+
      '<div><strong>4. Complaints</strong><br>Track and resolve community complaints. Mark as resolved when done.</div>'+
      '<div><strong>5. Projects</strong><br>Monitor ongoing community projects and their progress.</div>'+
      '<div><strong>6. Announcements</strong><br>Post important notices for the community.</div>'+
      '<div><strong>7. Reports</strong><br>Export reports with date range filtering.</div>'+
      '<div><strong>8. Users (Admin)</strong><br>Add, edit, or remove system users. Only visible to Administrators.</div>'+
      '<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(195,198,215,0.2)"><strong>Disclaimer</strong><br>This is a fictional demo project. Not affiliated with any government agency.</div>'+
    '</div>',
    btnSec('Close','closeModal()')
  );
}

function showSupportEscalation(){
  openModal('Support Escalation',
    '<div style="display:flex;flex-direction:column;gap:14px;font-size:13.5px;color:var(--on-surface-variant);line-height:1.6;">'+
      '<div style="background:#fee2e2;border-radius:10px;padding:14px 16px;display:flex;gap:10px;align-items:center;">'+
        '<span class="material-symbols-outlined" style="color:#991b1b;font-size:20px">support_agent</span>'+
        '<span style="font-size:13px;font-weight:700;color:#991b1b;">Need Technical Assistance?</span></div>'+
      '<p>For issues requiring escalation, please provide the following information:</p>'+
      '<div>'+field('Your Name','support-name','text','Full name')+'</div>'+
      '<div>'+field('Email','support-email','email','Contact email')+'</div>'+
      '<div>'+field('Issue Category','support-cat','select','',['Login Issue','Data Error','Feature Request','System Bug','Other'])+'</div>'+
      '<div>'+field('Description','support-desc','textarea','Describe the issue in detail...')+'</div>'+
      '<p style="font-size:12px;color:#64748b;">Our support team will respond within 24-48 hours.</p>'+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Submit Ticket','submitSupportTicket()')
  );
}

function submitSupportTicket(){
  var name = val('support-name');
  var email = val('support-email');
  var cat = val('support-cat');
  var desc = val('support-desc');
  
  if (!name || !email || !desc){
    showToast('Please fill in all required fields.','error');
    return;
  }
  
  closeModal();
  showToast('Support ticket submitted! We will contact you at '+email,'success');
}

// ══════════════════════════════════════════════════════════════
// ANIMATION STYLES
// ══════════════════════════════════════════════════════════════

var style=document.createElement('style');
style.textContent='@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}'+
  '#modal-overlay>div{animation:slideUp 0.22s ease;}'+
  '#toast-container>div{animation:slideUp 0.22s ease;}';
document.head.appendChild(style);

// ══════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════

function initializeApp() {
  console.log('Initializing Payatas Ledger Demo...');
  
  try {
    // Check authentication
    checkAuth();
    console.log('Auth check complete');
  } catch(e) {
    console.error('Error in checkAuth:', e);
  }

  try {
    // Initialize tables if user is already logged in
    if (currentUser) {
      console.log('User logged in, initializing tables...');
      renderResidentTable();
      renderDocumentsTable();
      renderComplaintsTable();
      renderProjectsTable();
      renderAnnouncements();
      if (isAdmin()) {
        renderUsersTable();
        updateUserStats();
      }
    } else {
      // Even if not logged in, render tables with fallback data
      console.log('No user logged in, using fallback data');
      if (typeof residents !== 'undefined' && residents.length > 0) {
        renderResidentTable();
      }
      if (typeof documents !== 'undefined' && documents.length > 0) {
        renderDocumentsTable();
      }
      if (typeof complaints !== 'undefined' && complaints.length > 0) {
        renderComplaintsTable();
      }
      if (typeof projects !== 'undefined' && projects.length > 0) {
        renderProjectsTable();
      }
      if (typeof announcements !== 'undefined' && announcements.length > 0) {
        renderAnnouncements();
      }
    }
  } catch(e) {
    console.error('Error initializing tables:', e);
  }

  // Add Enter key listener for login form
  var pwField = document.getElementById('login-password');
  if (pwField) {
    pwField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        login();
      }
    });
  }

  // Add notification toggle listeners
  var toggles = document.querySelectorAll('[data-notif-label]');
  toggles.forEach(function(toggle) {
    toggle.addEventListener('click', function() {
      var label = this.getAttribute('data-notif-label');
      notifToggles[label] = !notifToggles[label];
      this.style.background = notifToggles[label] ? 'var(--primary)' : 'var(--surface-container-highest)';
      var dot = this.querySelector('div');
      if (dot) {
        dot.style.left = notifToggles[label] ? '21px' : '3px';
      }
      showToast(label + ' notifications ' + (notifToggles[label] ? 'enabled' : 'disabled'), 'info');
    });
  });

  // Load saved settings
  loadSettings();

  console.log('Initialization complete');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}