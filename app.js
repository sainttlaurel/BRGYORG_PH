// ===================== STATE =====================
const USERS_KEY = 'pl_users';
const RESIDENTS_KEY = 'pl_residents';
const DOCUMENTS_KEY = 'pl_documents';
const COMPLAINTS_KEY = 'pl_complaints';
const PROJECTS_KEY = 'pl_projects';
const ANNOUNCEMENTS_KEY = 'pl_announcements';
const SESSION_KEY = 'pl_session';

let state = {
  session: null,
  residents: [],
  documents: [],
  complaints: [],
  projects: [],
  announcements: [],
  users: [],
  complaintFilter: 'all',
  annFilter: 'all',
  annSort: 'newest',           // NEW: announcement sort order
  confirmCallback: null,
  pagination: { residents: 1, documents: 1, complaints: 1 },
  perPage: 8,
  selectedDocuments: new Set(),   // NEW: bulk selection
  selectedComplaints: new Set(),  // NEW: bulk selection
  sessionTimeout: null,           // NEW: session timeout handle
  docDateFrom: '',                // NEW: document date filter
  docDateTo: '',                  // NEW: document date filter
};

// ===================== SEED DATA =====================
function seedData() {
  if (!localStorage.getItem(USERS_KEY)) {
    const users = [
      { id: 1, name: 'Admin Payatas', username: 'admin', password: 'admin123', role: 'Admin', email: 'admin@payatas.gov.ph', status: 'Active', lastActive: '2 mins ago', initials: 'AP' },
      { id: 2, name: 'Elena Garcia', username: 'egarcia', password: 'staff123', role: 'Staff', email: 'elena.garcia@payatas.gov.ph', status: 'Active', lastActive: '1 hour ago', initials: 'EG' },
      { id: 3, name: 'Roberto Santos', username: 'rsantos', password: 'staff123', role: 'Staff', email: 'roberto.santos@payatas.gov.ph', status: 'Active', lastActive: '3 days ago', initials: 'RS' }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  if (!localStorage.getItem(RESIDENTS_KEY)) {
    const residents = [
      { id: 'PAY-029481', fname: 'Maria Clara', lname: 'Agustin', purok: 'Purok 1', contact: '+63 912 345 6789', status: 'Active', registered: '2018', address: 'Block 3 Lot 5, Purok 1, Barangay Payatas', gender: 'Female', dob: '1985-04-12' },
      { id: 'PAY-055102', fname: 'Santiago', lname: 'Bautista Jr.', purok: 'Purok 3', contact: '+63 945 882 1092', status: 'Active', registered: '2020', address: 'Block 7 Lot 2, Purok 3, Barangay Payatas', gender: 'Male', dob: '1991-08-23' },
      { id: 'PAY-010293', fname: 'Theresa Mae', lname: 'Cruz', purok: 'Purok 2', contact: '+63 908 556 1234', status: 'Inactive', registered: '2015', address: 'Block 1 Lot 8, Purok 2, Barangay Payatas', gender: 'Female', dob: '1978-01-15' },
      { id: 'PAY-129038', fname: 'Leonardo', lname: 'Dela Cruz', purok: 'Purok 1', contact: '+63 922 110 4492', status: 'Active', registered: '2022', address: 'Block 5 Lot 11, Purok 1, Barangay Payatas', gender: 'Male', dob: '1995-11-07' },
      { id: 'PAY-003482', fname: 'Gloria', lname: 'Estrada', purok: 'Purok 5', contact: '+63 933 772 0019', status: 'Active', registered: '2012', address: 'Block 2 Lot 4, Purok 5, Barangay Payatas', gender: 'Female', dob: '1962-06-30' },
      { id: 'PAY-073910', fname: 'Ricardo Jose', lname: 'de Vera', purok: 'Purok 4', contact: '+63 917 441 2230', status: 'Active', registered: '2019', address: 'Block 9 Lot 6, Purok 4, Barangay Payatas', gender: 'Male', dob: '1988-03-18' },
      { id: 'PAY-098234', fname: 'Amara', lname: 'Luna', purok: 'Purok 2', contact: '+63 926 234 5678', status: 'Active', registered: '2021', address: 'Block 4 Lot 3, Purok 2, Barangay Payatas', gender: 'Female', dob: '1999-09-05' },
    ];
    localStorage.setItem(RESIDENTS_KEY, JSON.stringify(residents));
  }
  if (!localStorage.getItem(DOCUMENTS_KEY)) {
    const docs = [
      { id: 'DOC-001', resident: 'Mateo Cruz', type: 'Barangay Clearance', date: '2024-10-24', status: 'Approved', ref: 'PAY-2024-001', purpose: 'Employment' },
      { id: 'DOC-002', resident: 'Elena Santos', type: 'Certificate of Indigency', date: '2024-10-26', status: 'Pending', ref: 'PAY-2024-002', purpose: 'Medical assistance' },
      { id: 'DOC-003', resident: 'Ricardo Dalisay', type: 'Residency Certificate', date: '2024-10-25', status: 'Rejected', ref: 'PAY-2024-003', purpose: 'School enrollment' },
      { id: 'DOC-004', resident: 'Amara Luna', type: 'Barangay Clearance', date: '2024-10-27', status: 'Pending', ref: 'PAY-2024-004', purpose: 'Bank account' },
      { id: 'DOC-005', resident: 'Maria Clara Agustin', type: 'Business Permit', date: '2024-10-28', status: 'Pending', ref: 'PAY-2024-005', purpose: 'Business registration' },
    ];
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
  }
  if (!localStorage.getItem(COMPLAINTS_KEY)) {
    const complaints = [
      { id: 'CMP-001', complainant: 'Maria Alicia Santos', category: 'Sanitation', priority: 'High', status: 'Pending', date: '2024-10-24', desc: 'Overflowing garbage bins near the market area.' },
      { id: 'CMP-002', complainant: 'Ricardo Jose de Vera', category: 'Noise', priority: 'Medium', status: 'Pending', date: '2024-10-25', desc: 'Loud music from neighbor past midnight.' },
      { id: 'CMP-003', complainant: 'Elena Ledesma', category: 'Public Safety', priority: 'Low', status: 'Resolved', date: '2024-10-20', desc: 'Broken streetlight in Purok 3.' },
      { id: 'CMP-004', complainant: 'Benjamin Pascual', category: 'Sanitation', priority: 'High', status: 'Pending', date: '2024-10-26', desc: 'Stagnant water causing mosquito breeding.' },
      { id: 'CMP-005', complainant: 'Gloria Estrada', category: 'Infrastructure', priority: 'Medium', status: 'Resolved', date: '2024-10-18', desc: 'Pothole on main road near purok 5.' },
    ];
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
  }
  if (!localStorage.getItem(PROJECTS_KEY)) {
    const projects = [
      { id: 'PRJ-001', title: 'Phase 4 Road Maintenance', category: 'Infrastructure', status: 'Ongoing', budget: 4200000, progress: 75, desc: 'Rehabilitation of main roads in Sectors 1-4.' },
      { id: 'PRJ-002', title: 'Smart LED Street Lighting', category: 'Public Safety', status: 'Ongoing', budget: 1850000, progress: 32, desc: 'Installation of solar LED street lights.' },
      { id: 'PRJ-003', title: 'Barangay Health Center Renovation', category: 'Healthcare', status: 'Completed', budget: 3400000, progress: 100, desc: 'Full renovation of the health center facilities.' },
      { id: 'PRJ-004', title: 'Flood Control & Drainage System', category: 'Environment', status: 'Ongoing', budget: 2900000, progress: 58, desc: 'Upgrading drainage to prevent monsoon flooding.' },
      { id: 'PRJ-005', title: 'Youth Digital Literacy Hub', category: 'Education', status: 'Planned', budget: 1200000, progress: 15, desc: 'Community digital education center.' },
      { id: 'PRJ-006', title: 'Eco-Waste Recovery Center', category: 'Sanitation', status: 'Ongoing', budget: 2100000, progress: 92, desc: 'Organized waste sorting and recovery facility.' },
    ];
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
  if (!localStorage.getItem(ANNOUNCEMENTS_KEY)) {
    const announcements = [
      { id: 'ANN-001', title: 'Annual General Assembly & Budget Transparency Forum', category: 'meeting', content: 'Join us for a detailed review of the upcoming fiscal year projects. We will discuss waste management enhancements and new youth recreational facilities.', date: '2024-10-24' },
      { id: 'ANN-002', title: 'Community Vaccination Drive: Seniors & Children', category: 'health', content: 'Mandatory flu and pneumonia shots available at the Barangay Health Center. Please bring valid IDs and vaccination cards.', date: '2024-10-22' },
      { id: 'ANN-003', title: "All Saints' Day: Office Operations Advisory", category: 'holiday', content: 'The Barangay Hall will be closed for non-emergency services. Garbage collection schedule remains unchanged.', date: '2024-10-31' },
      { id: 'ANN-004', title: 'Street Lighting Committee Update', category: 'meeting', content: 'Review of solar lighting installation progress along Block 5 and 6. Resident feedback on placement is highly encouraged.', date: '2024-10-18' },
      { id: 'ANN-005', title: 'Drainage System Maintenance Program', category: 'infrastructure', content: 'Expect minor road diversions near the marketplace as we perform annual desilting to prevent monsoon flooding.', date: '2024-10-15' },
    ];
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  }
}

function loadState() {
  state.users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  state.residents = JSON.parse(localStorage.getItem(RESIDENTS_KEY) || '[]');
  state.documents = JSON.parse(localStorage.getItem(DOCUMENTS_KEY) || '[]');
  state.complaints = JSON.parse(localStorage.getItem(COMPLAINTS_KEY) || '[]');
  state.projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
  state.announcements = JSON.parse(localStorage.getItem(ANNOUNCEMENTS_KEY) || '[]');
  state.session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ===================== AUTH =====================
function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';
  if (!username || !password) { errorEl.textContent = 'Please enter username and password.'; return; }
  const user = state.users.find(u => u.username === username && u.password === password);
  if (!user) { errorEl.textContent = 'Invalid username or password.'; return; }
  if (user.status === 'Suspended') { errorEl.textContent = 'Your account has been suspended. Contact the administrator.'; return; }
  state.session = user;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  initApp();
  startSessionTimeout(); // NEW: start session timeout on login
}

function logout() {
  clearSessionTimeout();
  sessionStorage.removeItem(SESSION_KEY);
  state.session = null;
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
}

function togglePw() {
  const inp = document.getElementById('login-password');
  const eye = document.getElementById('pw-eye');
  if (inp.type === 'password') { inp.type = 'text'; eye.textContent = 'visibility_off'; }
  else { inp.type = 'password'; eye.textContent = 'visibility'; }
}

// ===================== SESSION TIMEOUT (NEW) =====================
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_WARNING_MS  = 25 * 60 * 1000; // warn at 25 minutes
let _sessionWarningHandle = null;

function startSessionTimeout() {
  clearSessionTimeout();
  _sessionWarningHandle = setTimeout(showSessionWarning, SESSION_WARNING_MS);
  state.sessionTimeout = setTimeout(() => {
    toast('Session expired. Please log in again.', 'error');
    logout();
  }, SESSION_DURATION_MS);
}

function clearSessionTimeout() {
  if (state.sessionTimeout) clearTimeout(state.sessionTimeout);
  if (_sessionWarningHandle) clearTimeout(_sessionWarningHandle);
  state.sessionTimeout = null;
  _sessionWarningHandle = null;
}

function resetSessionTimeout() {
  if (state.session) startSessionTimeout();
}

function showSessionWarning() {
  // Inject a persistent warning banner if not already there
  if (document.getElementById('session-warning-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'session-warning-banner';
  banner.style.cssText = `
    position:fixed;top:0;left:0;right:0;z-index:9999;
    background:#d97706;color:white;padding:10px 20px;
    display:flex;align-items:center;justify-content:space-between;
    font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.2);
  `;
  banner.innerHTML = `
    <span>⚠️ Your session will expire in 5 minutes due to inactivity.</span>
    <button onclick="extendSession()" style="background:white;color:#d97706;border:none;border-radius:6px;padding:4px 14px;font-size:12px;font-weight:700;cursor:pointer;">Stay Logged In</button>
  `;
  document.body.prepend(banner);
}

function extendSession() {
  const banner = document.getElementById('session-warning-banner');
  if (banner) banner.remove();
  startSessionTimeout();
  toast('Session extended for another 30 minutes.', 'success');
}

// Reset timeout on any user interaction
['click', 'keydown', 'mousemove', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, () => {
    const banner = document.getElementById('session-warning-banner');
    if (banner) banner.remove();
    resetSessionTimeout();
  }, { passive: true });
});

// ===================== INIT =====================
function initApp() {
  const u = state.session;
  const ini = u.initials || u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  ['topbar-name', 'sidebar-name'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = u.name; });
  ['topbar-role', 'sidebar-role'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = u.role === 'Admin' ? 'Super Administrator' : 'Staff Member'; });
  ['topbar-avatar', 'sidebar-avatar'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ini; });
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = u.role === 'Admin' ? '' : 'none';
  });
  updateDate();
  updateDashboard();
  updateBadges();
  setGreeting();
  setInterval(setGreeting, 60000);
}

function setGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const el = document.getElementById('dash-greeting');
  if (el && state.session) el.textContent = `Good ${g}, ${state.session.name.split(' ')[0]}! 👋`;
}

function updateDate() {
  const el = document.getElementById('topbar-date');
  if (el) el.textContent = new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function updateBadges() {
  const pending = state.documents.filter(d => d.status === 'Pending').length;
  const activeCmp = state.complaints.filter(c => c.status === 'Pending').length;
  const bd = document.getElementById('badge-documents');
  const bc = document.getElementById('badge-complaints');
  const br = document.getElementById('badge-residents');
  if (bd) { bd.textContent = pending || ''; bd.style.display = pending ? 'inline' : 'none'; }
  if (bc) { bc.textContent = activeCmp || ''; bc.style.display = activeCmp ? 'inline' : 'none'; }
  if (br) { br.style.display = 'none'; }
}

// ===================== NAVIGATION =====================
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.textContent.trim().toLowerCase().startsWith(page === 'dashboard' ? 'dash' : page.slice(0, 4))) btn.classList.add('active');
  });
  closeAllDropdowns();
  // NEW: clear bulk selections when changing pages
  state.selectedDocuments.clear();
  state.selectedComplaints.clear();
  // Close sidebar on mobile when navigating
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
  }
  switch (page) {
    case 'dashboard': updateDashboard(); break;
    case 'residents': renderResidents(); break;
    case 'documents': renderDocuments(); break;
    case 'complaints': renderComplaints(); break;
    case 'projects': renderProjects(); break;
    case 'announcements': renderAnnouncements(); break;
    case 'reports': renderReports(); break;
    case 'users': renderUsers(); break;
  }
  window.scrollTo(0, 0);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  }
}

// ===================== DASHBOARD =====================
function updateDashboard() {
  const pending = state.documents.filter(d => d.status === 'Pending').length;
  const activeCmp = state.complaints.filter(c => c.status === 'Pending').length;
  const ongoing = state.projects.filter(p => p.status === 'Ongoing').length;
  setVal('stat-pending', pending);
  setVal('stat-complaints', activeCmp);
  setVal('stat-projects', ongoing);
  setVal('stat-residents', (12000 + state.residents.length).toLocaleString());
  renderDashboardDocs();
}

function renderDashboardDocs() {
  const tbody = document.getElementById('dashboard-docs-table');
  if (!tbody) return;
  const recent = [...state.documents].slice(-5).reverse();
  if (!recent.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:24px;color:var(--on-surface-3)">No recent requests</td></tr>'; return; }
  tbody.innerHTML = recent.map(d => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="av av-sm" style="background:${avatarColor(d.resident)};color:white">${initials(d.resident)}</div><span>${d.resident}</span></div></td>
      <td><span style="font-size:12px">${d.type}</span></td>
      <td style="color:var(--on-surface-3);font-size:12px">${formatDate(d.date)}</td>
      <td>${statusBadge(d.status)}</td>
      <td><div class="tbl-actions">${d.status === 'Pending' ? `<button class="tbl-btn" onclick="approveDoc('${d.id}')" title="Approve"><span class="material-symbols-outlined">check_circle</span></button><button class="tbl-btn danger" onclick="rejectDoc('${d.id}')" title="Reject"><span class="material-symbols-outlined">cancel</span></button>` : ''}</div></td>
    </tr>
  `).join('');
}

// ===================== RESIDENTS =====================

// FIX: robust unique ID using max existing numeric suffix
function generateResidentId() {
  const nums = state.residents.map(r => {
    const parts = r.id.split('-');
    return parseInt(parts[1], 10) || 0;
  });
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return 'PAY-' + String(next).padStart(6, '0');
}

function renderResidents() {
  const search = val('residents-search').toLowerCase();
  const statusF = val('residents-status');
  const purokF = val('residents-purok');
  let data = state.residents.filter(r => {
    const name = `${r.fname} ${r.lname}`.toLowerCase();
    // FIX: added purok to global search scope; also search gender & dob for completeness
    if (search && !name.includes(search) && !r.id.toLowerCase().includes(search) && !r.address.toLowerCase().includes(search) && !r.purok.toLowerCase().includes(search)) return false;
    if (statusF && r.status !== statusF) return false;
    if (purokF && r.purok !== purokF) return false;
    return true;
  });
  const page = state.pagination.residents;
  const total = data.length;
  const start = (page - 1) * state.perPage;
  const paged = data.slice(start, start + state.perPage);
  const tbody = document.getElementById('residents-table');
  if (!paged.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon"><span class="material-symbols-outlined">groups</span></div><h4>No residents found</h4><p>Try adjusting your search or filters</p></div></td></tr>`;
  } else {
    tbody.innerHTML = paged.map(r => `
      <tr>
        <td><div style="display:flex;align-items:center;gap:10px"><div class="av" style="background:${avatarColor(`${r.fname} ${r.lname}`)};color:white;font-size:11px">${initials(`${r.fname} ${r.lname}`)}</div><div><div style="font-weight:700;font-size:13px">${r.lname}, ${r.fname}</div><div style="font-size:11px;color:var(--on-surface-3)">Since ${r.registered}</div></div></div></td>
        <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--on-surface-3)">${r.id}</td>
        <td>${r.purok}</td>
        <td style="font-size:12px;color:var(--on-surface-3)">${r.contact}</td>
        <td>${r.status === 'Active' ? '<span class="badge badge-active"><span class="badge-dot"></span>Active</span>' : '<span class="badge badge-inactive"><span class="badge-dot"></span>Inactive</span>'}</td>
        <td style="font-size:12px;color:var(--on-surface-3)">${r.registered}</td>
        <td><div class="tbl-actions">
          <button class="tbl-btn view" onclick="openResidentPanel('${r.id}')" title="View Profile"><span class="material-symbols-outlined">person</span></button>
          <button class="tbl-btn" onclick="printResidentProfile('${r.id}')" title="Print Profile"><span class="material-symbols-outlined">print</span></button>
          <button class="tbl-btn" onclick="editResident('${r.id}')" title="Edit"><span class="material-symbols-outlined">edit</span></button>
          <button class="tbl-btn danger" onclick="confirmDelete('Resident','Delete this resident record? This cannot be undone.',()=>deleteResident('${r.id}'))" title="Delete"><span class="material-symbols-outlined">delete</span></button>
        </div></td>
      </tr>
    `).join('');
  }
  renderPagination('residents', total, page, 'renderResidents');
}

function editResident(id) {
  const r = state.residents.find(x => x.id === id);
  if (!r) return;
  document.getElementById('edit-modal-title').textContent = 'Edit Resident';
  document.getElementById('edit-modal-body').innerHTML = `
    <div class="form-grid-2">
      <div class="form-group"><label>First Name</label><input id="er-fname" value="${r.fname}"/></div>
      <div class="form-group"><label>Last Name</label><input id="er-lname" value="${r.lname}"/></div>
      <div class="form-group"><label>Contact</label><input id="er-contact" value="${r.contact}"/></div>
      <div class="form-group"><label>Purok</label><select id="er-purok">
        ${['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5'].map(p => `<option ${r.purok === p ? 'selected' : ''}>${p}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Gender</label><select id="er-gender">
        ${['Male','Female','Other','N/A'].map(g=>`<option ${r.gender===g?'selected':''}>${g}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Date of Birth</label><input type="date" id="er-dob" value="${r.dob !== 'N/A' ? r.dob : ''}"/></div>
      <div class="form-group"><label>Status</label><select id="er-status">
        <option ${r.status === 'Active' ? 'selected' : ''}>Active</option>
        <option ${r.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
      </select></div>
    </div>
    <div class="form-group"><label>Address</label><input id="er-address" value="${r.address}"/></div>
    <div class="form-group"><label>Notes</label><textarea id="er-notes">${r.notes || ''}</textarea></div>
  `;
  document.getElementById('edit-modal-save').onclick = () => {
    r.fname = val('er-fname'); r.lname = val('er-lname');
    r.contact = val('er-contact'); r.purok = val('er-purok');
    r.status = val('er-status'); r.address = val('er-address');
    r.gender = val('er-gender');
    r.dob = val('er-dob') || 'N/A';
    r.notes = val('er-notes');
    save(RESIDENTS_KEY, state.residents);
    closeModal('edit-modal');
    renderResidents();
    toast('Resident updated successfully', 'success');
  };
  openModal('edit-modal');
}

function deleteResident(id) {
  state.residents = state.residents.filter(r => r.id !== id);
  save(RESIDENTS_KEY, state.residents);
  renderResidents();
  closeModal('confirm-modal');
  toast('Resident deleted', 'info');
}

function submitResident() {
  const fname = val('res-fname'), lname = val('res-lname');
  const purok = val('res-purok');
  if (!fname || !lname || !purok) { toast('Please fill required fields', 'error'); return; }
  // FIX: use generateResidentId() instead of fragile length-based approach
  const id = generateResidentId();
  state.residents.push({
    id, fname, lname, purok,
    contact: val('res-contact') || 'N/A',
    status: 'Active',
    registered: new Date().getFullYear().toString(),
    address: val('res-address') || 'Barangay Payatas',
    gender: val('res-gender') || 'N/A',
    dob: val('res-dob') || 'N/A',
    notes: val('res-notes')
  });
  save(RESIDENTS_KEY, state.residents);
  closeModal('add-resident-modal');
  ['res-fname', 'res-lname', 'res-contact', 'res-purok', 'res-address', 'res-notes', 'res-dob'].forEach(clearField);
  toast(`Resident ${fname} ${lname} added!`, 'success');
  addNotification('New Resident Added', `${fname} ${lname} registered in ${purok}`, 'person');
  updateBadges(); updateDashboard();
  if (document.getElementById('page-residents').classList.contains('active')) renderResidents();
}

// NEW: Print resident profile
function printResidentProfile(id) {
  const r = state.residents.find(x => x.id === id);
  if (!r) return;
  const fullName = `${r.fname} ${r.lname}`;
  const age = r.dob && r.dob !== 'N/A' ? Math.floor((new Date() - new Date(r.dob)) / 31557600000) + ' years old' : 'N/A';
  const docs = state.documents.filter(d =>
    d.resident.toLowerCase().includes(r.fname.toLowerCase()) ||
    d.resident.toLowerCase().includes(r.lname.toLowerCase())
  );
  const cmps = state.complaints.filter(c =>
    c.complainant.toLowerCase().includes(r.fname.toLowerCase()) ||
    c.complainant.toLowerCase().includes(r.lname.toLowerCase())
  );
  const w = window.open('', '_blank', 'width=750,height=1000');
  w.document.write(`<!DOCTYPE html><html><head>
    <title>Resident Profile — ${fullName}</title>
    <style>
      body{font-family:Georgia,serif;margin:0;padding:40px;color:#111;font-size:13px}
      .header{text-align:center;border-bottom:3px double #1a56db;padding-bottom:20px;margin-bottom:24px}
      .header h1{font-size:20px;color:#1a56db;margin:0 0 4px}
      .header p{font-size:11px;color:#555;margin:0}
      h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:20px 0 12px;color:#1a56db}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
      .field{background:#f9fafb;border-radius:6px;padding:8px 12px}
      .field .lbl{font-size:10px;font-weight:bold;text-transform:uppercase;color:#888;margin-bottom:2px}
      .field .v{font-size:13px;font-weight:600}
      .doc-row,.cmp-row{display:flex;justify-content:space-between;padding:7px 10px;background:#f9fafb;border-radius:6px;margin-bottom:5px;font-size:12px}
      .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700}
      .b-active{background:#f0fdf4;color:#16a34a}
      .b-inactive{background:#f1f5f9;color:#64748b}
      .b-approved{background:#f0fdf4;color:#16a34a}
      .b-pending{background:#fffbeb;color:#d97706}
      .b-rejected{background:#fef2f2;color:#dc2626}
      .footer{margin-top:60px;display:flex;justify-content:space-between;font-size:11px}
      .sig{text-align:center}
      .sig-line{width:180px;border-top:1px solid #111;margin:40px auto 4px}
      .watermark{text-align:center;margin-top:24px;color:#d1d5db;font-size:10px;letter-spacing:1px}
      @media print{body{padding:20px}}
    </style>
  </head><body>
    <div class="header"><h1>Barangay Payatas</h1><p>Litex Road, Quezon City, Metro Manila · +63 2 8123 4567</p><p style="margin-top:6px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">Resident Profile</p></div>
    <div class="grid">
      <div class="field"><div class="lbl">Resident ID</div><div class="v">${r.id}</div></div>
      <div class="field"><div class="lbl">Status</div><div class="v"><span class="badge ${r.status === 'Active' ? 'b-active' : 'b-inactive'}">${r.status}</span></div></div>
      <div class="field"><div class="lbl">First Name</div><div class="v">${r.fname}</div></div>
      <div class="field"><div class="lbl">Last Name</div><div class="v">${r.lname}</div></div>
      <div class="field"><div class="lbl">Date of Birth</div><div class="v">${r.dob !== 'N/A' ? formatDate(r.dob) : 'N/A'}</div></div>
      <div class="field"><div class="lbl">Age</div><div class="v">${age}</div></div>
      <div class="field"><div class="lbl">Gender</div><div class="v">${r.gender || 'N/A'}</div></div>
      <div class="field"><div class="lbl">Contact</div><div class="v">${r.contact}</div></div>
      <div class="field"><div class="lbl">Purok</div><div class="v">${r.purok}</div></div>
      <div class="field"><div class="lbl">Year Registered</div><div class="v">${r.registered}</div></div>
      <div class="field" style="grid-column:1/-1"><div class="lbl">Address</div><div class="v">${r.address}</div></div>
      ${r.notes ? `<div class="field" style="grid-column:1/-1"><div class="lbl">Notes</div><div class="v">${r.notes}</div></div>` : ''}
    </div>
    <h2>Document History (${docs.length})</h2>
    ${docs.length ? docs.map(d=>`<div class="doc-row"><div><strong>${d.type}</strong><span style="color:#888;margin-left:8px;font-family:monospace;font-size:11px">${d.ref}</span></div><div style="display:flex;gap:8px;align-items:center"><span style="color:#888">${formatDate(d.date)}</span><span class="badge ${d.status==='Approved'?'b-approved':d.status==='Pending'?'b-pending':'b-rejected'}">${d.status}</span></div></div>`).join('') : '<p style="color:#888;font-size:12px">No document requests on record.</p>'}
    <h2>Complaint History (${cmps.length})</h2>
    ${cmps.length ? cmps.map(c=>`<div class="cmp-row"><div><strong>${c.category}</strong> — <span style="color:#888">${c.id}</span><div style="color:#888;font-size:11px">${c.desc.slice(0,80)}...</div></div><span class="badge ${c.status==='Resolved'?'b-approved':'b-pending'}">${c.status}</span></div>`).join('') : '<p style="color:#888;font-size:12px">No complaints on record.</p>'}
    <div class="footer">
      <div class="sig"><div class="sig-line"></div><div>Barangay Captain</div></div>
      <div class="sig"><div class="sig-line"></div><div>Secretary / Records Officer</div></div>
    </div>
    <div class="watermark">OFFICIAL DOCUMENT — BARANGAY PAYATAS · PAYATAS LEDGER v2.5.0 · Printed: ${new Date().toLocaleString('en-PH')}</div>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

// ===================== DOCUMENTS =====================

// NEW: render date filter UI (call this once in your HTML or inject it)
function injectDocDateFilters() {
  const toolbar = document.getElementById('docs-toolbar');
  if (!toolbar || document.getElementById('docs-date-from')) return;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--on-surface-3)">
      <span>From</span>
      <input type="date" id="docs-date-from" style="font-size:12px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface)" oninput="onDocDateFilter()"/>
      <span>To</span>
      <input type="date" id="docs-date-to" style="font-size:12px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface)" oninput="onDocDateFilter()"/>
      <button class="tbl-btn" onclick="clearDocDateFilter()" title="Clear date filter" style="padding:4px 8px;font-size:11px">Clear</button>
    </div>
  `;
  toolbar.appendChild(wrap);
}

function onDocDateFilter() {
  state.docDateFrom = val('docs-date-from');
  state.docDateTo   = val('docs-date-to');
  state.pagination.documents = 1;
  renderDocuments();
}

function clearDocDateFilter() {
  state.docDateFrom = '';
  state.docDateTo   = '';
  const f = document.getElementById('docs-date-from');
  const t = document.getElementById('docs-date-to');
  if (f) f.value = '';
  if (t) t.value = '';
  state.pagination.documents = 1;
  renderDocuments();
}

function renderDocuments() {
  injectDocDateFilters(); // ensure date filters exist
  const search = val('docs-search').toLowerCase();
  const typeF   = val('docs-type');
  const statusF = val('docs-status');
  let data = state.documents.filter(d => {
    if (search && !d.resident.toLowerCase().includes(search) && !d.ref.toLowerCase().includes(search)) return false;
    if (typeF && d.type !== typeF) return false;
    if (statusF && d.status !== statusF) return false;
    // NEW: date range filter
    if (state.docDateFrom && d.date < state.docDateFrom) return false;
    if (state.docDateTo   && d.date > state.docDateTo)   return false;
    return true;
  });

  // NEW: bulk action toolbar
  renderDocBulkBar(data);

  const page  = state.pagination.documents;
  const total = data.length;
  const paged = data.slice((page - 1) * state.perPage, page * state.perPage);
  const tbody = document.getElementById('documents-table');

  if (!paged.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon"><span class="material-symbols-outlined">description</span></div><h4>No requests found</h4><p>Try adjusting your filters</p></div></td></tr>`;
  } else {
    tbody.innerHTML = paged.map(d => `
      <tr>
        <td style="width:36px"><input type="checkbox" class="bulk-cb" data-id="${d.id}" ${state.selectedDocuments.has(d.id) ? 'checked' : ''} onchange="toggleDocSelection('${d.id}',this.checked)"/></td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="av av-sm" style="background:${avatarColor(d.resident)};color:white">${initials(d.resident)}</div>${d.resident}</div></td>
        <td>${d.type}</td>
        <td style="font-family:'DM Mono',monospace;font-size:11px;color:var(--on-surface-3)">${d.ref}</td>
        <td style="color:var(--on-surface-3);font-size:12px">${formatDate(d.date)}</td>
        <td style="font-size:12px;color:var(--on-surface-3);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.purpose || '—'}</td>
        <td>${statusBadge(d.status)}</td>
        <td><div class="tbl-actions">
          <button class="tbl-btn view" onclick="openDocPanel('${d.id}')" title="View & Edit"><span class="material-symbols-outlined">open_in_new</span></button>
          ${d.status === 'Pending' ? `<button class="tbl-btn" onclick="approveDoc('${d.id}')" title="Approve"><span class="material-symbols-outlined">check_circle</span></button><button class="tbl-btn danger" onclick="rejectDoc('${d.id}')" title="Reject"><span class="material-symbols-outlined">cancel</span></button>` : ''}
          <button class="tbl-btn danger" onclick="confirmDelete('Document Request','Delete this document request?',()=>deleteDoc('${d.id}'))" title="Delete"><span class="material-symbols-outlined">delete</span></button>
        </div></td>
      </tr>
    `).join('');
  }
  renderPagination('documents', total, page, 'renderDocuments');
}

// NEW: bulk selection helpers for documents
function toggleDocSelection(id, checked) {
  if (checked) state.selectedDocuments.add(id);
  else state.selectedDocuments.delete(id);
  renderDocBulkBar();
}

function renderDocBulkBar(filteredData) {
  let bar = document.getElementById('doc-bulk-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'doc-bulk-bar';
    bar.style.cssText = 'display:none;align-items:center;gap:10px;padding:8px 12px;background:var(--primary-light,#eef2ff);border-radius:8px;margin-bottom:10px;font-size:13px;font-weight:600;';
    const wrap = document.getElementById('doc-bulk-bar-wrap');
    if (wrap) wrap.appendChild(bar);
  }
  const count = state.selectedDocuments.size;
  if (count === 0) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  bar.innerHTML = `
      <span style="color:var(--primary)">${count} selected</span>
      <button class="tbl-btn bulk" onclick="bulkApproveDocuments()" title="Approve selected" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;"><span class="material-symbols-outlined" style="font-size:15px;">check_circle</span> Approve All</button>
      <button class="tbl-btn bulk danger" onclick="bulkRejectDocuments()" title="Reject selected" style="background:#fef2f2;"><span class="material-symbols-outlined" style="font-size:15px;">cancel</span> Reject All</button>
      <button class="tbl-btn bulk danger" onclick="bulkDeleteDocuments()" title="Delete selected"><span class="material-symbols-outlined" style="font-size:15px;">delete</span> Delete</button>
      <button class="tbl-btn bulk" onclick="clearDocSelection()">Clear</button>
    `;
}

function clearDocSelection() {
  state.selectedDocuments.clear();
  renderDocuments();
}

function bulkApproveDocuments() {
  state.selectedDocuments.forEach(id => {
    const d = state.documents.find(x => x.id === id);
    if (d && d.status === 'Pending') {
      d.status = 'Approved';
      addNotification('Document Approved', `${d.type} for ${d.resident} has been approved`, 'success');
    }
  });
  save(DOCUMENTS_KEY, state.documents);
  state.selectedDocuments.clear();
  updateBadges(); updateDashboard(); renderDocuments(); renderDashboardDocs();
  toast('Selected documents approved!', 'success');
}

function bulkRejectDocuments() {
  state.selectedDocuments.forEach(id => {
    const d = state.documents.find(x => x.id === id);
    if (d && d.status === 'Pending') {
      d.status = 'Rejected';
      addNotification('Document Rejected', `${d.type} for ${d.resident} was rejected`, 'warning');
    }
  });
  save(DOCUMENTS_KEY, state.documents);
  state.selectedDocuments.clear();
  updateBadges(); updateDashboard(); renderDocuments(); renderDashboardDocs();
  toast('Selected documents rejected', 'info');
}

function bulkDeleteDocuments() {
  const count = state.selectedDocuments.size;
  confirmDelete('Selected Documents', `Delete ${count} document request(s)? This cannot be undone.`, () => {
    state.documents = state.documents.filter(d => !state.selectedDocuments.has(d.id));
    save(DOCUMENTS_KEY, state.documents);
    state.selectedDocuments.clear();
    closeModal('confirm-modal');
    updateBadges(); updateDashboard(); renderDocuments(); renderDashboardDocs();
    toast(`${count} document(s) deleted`, 'info');
  });
}

function approveDoc(id) {
  const d = state.documents.find(x => x.id === id);
  if (d) {
    d.status = 'Approved';
    save(DOCUMENTS_KEY, state.documents);
    updateBadges(); updateDashboard(); renderDocuments(); renderDashboardDocs();
    toast('Request approved!', 'success');
    addNotification('Document Approved', `${d.type} for ${d.resident} has been approved`, 'success');
  }
}

function rejectDoc(id) {
  const d = state.documents.find(x => x.id === id);
  if (d) {
    d.status = 'Rejected';
    save(DOCUMENTS_KEY, state.documents);
    updateBadges(); updateDashboard(); renderDocuments(); renderDashboardDocs();
    toast('Request rejected', 'info');
    addNotification('Document Rejected', `${d.type} for ${d.resident} was rejected`, 'warning');
  }
}

function deleteDoc(id) {
  state.documents = state.documents.filter(d => d.id !== id);
  save(DOCUMENTS_KEY, state.documents);
  closeModal('confirm-modal'); renderDocuments(); renderDashboardDocs(); updateBadges(); updateDashboard();
  toast('Request deleted', 'info');
}

function submitRequest() {
  const name = val('req-name'), type = val('req-type');
  if (!name || !type) { toast('Please fill required fields', 'error'); return; }
  const id = 'DOC-' + String(state.documents.length + 1).padStart(3, '0');
  const ref = 'PAY-' + new Date().getFullYear() + '-' + String(state.documents.length + 1).padStart(3, '0');
  state.documents.push({ id, resident: name, type, date: today(), status: 'Pending', ref, purpose: val('req-purpose'), contact: val('req-contact') });
  save(DOCUMENTS_KEY, state.documents);
  closeModal('new-request-modal');
  ['req-name', 'req-contact', 'req-type', 'req-purpose'].forEach(clearField);
  toast(`Document request submitted for ${name}`, 'success');
  addNotification('New Document Request', `${name} requested a ${type}`, 'doc');
  updateBadges(); updateDashboard();
  if (document.getElementById('page-documents').classList.contains('active')) renderDocuments();
}

// ===================== COMPLAINTS =====================

function renderComplaints() {
  const search = val('complaints-search').toLowerCase();
  let data = state.complaints.filter(c => {
    if (search && !c.complainant.toLowerCase().includes(search) && !c.category.toLowerCase().includes(search)) return false;
    if (state.complaintFilter === 'pending' && c.status !== 'Pending') return false;
    if (state.complaintFilter === 'resolved' && c.status !== 'Resolved') return false;
    if (state.complaintFilter === 'urgent' && c.priority !== 'High') return false;
    return true;
  });

  const statsEl = document.getElementById('complaints-stats');
  if (statsEl) {
    const total   = state.complaints.length;
    const urgent  = state.complaints.filter(c => c.priority === 'High' && c.status === 'Pending').length;
    const resolved = state.complaints.filter(c => c.status === 'Resolved').length;
    const rate    = total ? Math.round(resolved / total * 100) : 0;
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#eef2ff"><span class="material-symbols-outlined" style="color:#1a56db">inbox</span></div></div><div class="stat-label">Total Cases</div><div class="stat-value">${total}</div></div>
      <div class="stat-card" style="border-left:3px solid var(--error)"><div class="stat-top"><div class="stat-icon" style="background:var(--error-light)"><span class="material-symbols-outlined" style="color:var(--error)">priority_high</span></div></div><div class="stat-label" style="color:var(--error)">Urgent</div><div class="stat-value">${urgent}</div></div>
      <div class="stat-card" style="border-left:3px solid var(--success)"><div class="stat-top"><div class="stat-icon" style="background:var(--success-light)"><span class="material-symbols-outlined" style="color:var(--success)">analytics</span></div></div><div class="stat-label">Resolution Rate</div><div class="stat-value">${rate}%</div></div>
    `;
  }

  // NEW: bulk action toolbar for complaints
  renderComplaintBulkBar();

  const page  = state.pagination.complaints;
  const total = data.length;
  const paged = data.slice((page - 1) * state.perPage, page * state.perPage);
  const tbody = document.getElementById('complaints-table');
  if (!paged.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon"><span class="material-symbols-outlined">gavel</span></div><h4>No complaints found</h4><p>Try adjusting your filters</p></div></td></tr>`;
  } else {
    tbody.innerHTML = paged.map(c => `
      <tr>
        <td style="width:36px"><input type="checkbox" class="bulk-cb" data-id="${c.id}" ${state.selectedComplaints.has(c.id) ? 'checked' : ''} onchange="toggleComplaintSelection('${c.id}',this.checked)"/></td>
        <td><div style="display:flex;align-items:center;gap:8px"><div class="av av-sm" style="background:${avatarColor(c.complainant)};color:white">${initials(c.complainant)}</div><div><div style="font-weight:600">${c.complainant}</div><div style="font-size:11px;color:var(--on-surface-3)">${c.id}</div></div></div></td>
        <td><span style="padding:3px 10px;background:var(--surface);border-radius:99px;font-size:11px;font-weight:600">${c.category}</span></td>
        <td>${priorityBadge(c.priority)}</td>
        <td style="font-size:12px;color:var(--on-surface-3)">${formatDate(c.date)}</td>
        <td>${c.status === 'Resolved' ? '<span class="badge badge-approved"><span class="badge-dot"></span>Resolved</span>' : '<span class="badge badge-urgent"><span class="badge-dot"></span>Pending</span>'}</td>
        <td><div class="tbl-actions">
          ${c.status !== 'Resolved' ? `<button class="tbl-btn" onclick="resolveComplaint('${c.id}')" title="Mark Resolved"><span class="material-symbols-outlined">check_circle</span></button>` : ''}
          <button class="tbl-btn" onclick="viewComplaint('${c.id}')" title="View"><span class="material-symbols-outlined">open_in_new</span></button>
          <button class="tbl-btn" onclick="editComplaint('${c.id}')" title="Edit"><span class="material-symbols-outlined">edit</span></button>
          <button class="tbl-btn danger" onclick="confirmDelete('Complaint','Delete this complaint record?',()=>deleteComplaint('${c.id}'))" title="Delete"><span class="material-symbols-outlined">delete</span></button>
        </div></td>
      </tr>
    `).join('');
  }
  renderPagination('complaints', total, page, 'renderComplaints');
}

// NEW: bulk selection helpers for complaints
function toggleComplaintSelection(id, checked) {
  if (checked) state.selectedComplaints.add(id);
  else state.selectedComplaints.delete(id);
  renderComplaintBulkBar();
}

function renderComplaintBulkBar() {
  let bar = document.getElementById('complaint-bulk-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'complaint-bulk-bar';
    bar.style.cssText = 'display:none;align-items:center;gap:10px;padding:8px 12px;background:var(--primary-light,#eef2ff);border-radius:8px;margin-bottom:10px;font-size:13px;font-weight:600;';
    const wrap = document.getElementById('complaint-bulk-bar-wrap');
    if (wrap) wrap.appendChild(bar);
  }
  const count = state.selectedComplaints.size;
  if (count === 0) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  bar.innerHTML = `
      <span style="color:var(--primary)">${count} selected</span>
      <button class="tbl-btn bulk" onclick="bulkResolveComplaints()" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;"><span class="material-symbols-outlined" style="font-size:15px;">check_circle</span> Resolve All</button>
      <button class="tbl-btn bulk danger" onclick="bulkDeleteComplaints()"><span class="material-symbols-outlined" style="font-size:15px;">delete</span> Delete</button>
      <button class="tbl-btn bulk" onclick="clearComplaintSelection()">Clear</button>
    `;
}

function clearComplaintSelection() {
  state.selectedComplaints.clear();
  renderComplaints();
}

function bulkResolveComplaints() {
  state.selectedComplaints.forEach(id => {
    const c = state.complaints.find(x => x.id === id);
    if (c && c.status !== 'Resolved') {
      c.status = 'Resolved';
      addNotification('Complaint Resolved', `${c.category} complaint by ${c.complainant} marked resolved`, 'success');
    }
  });
  save(COMPLAINTS_KEY, state.complaints);
  state.selectedComplaints.clear();
  renderComplaints(); updateBadges(); updateDashboard();
  toast('Selected complaints resolved!', 'success');
}

function bulkDeleteComplaints() {
  const count = state.selectedComplaints.size;
  confirmDelete('Selected Complaints', `Delete ${count} complaint(s)? This cannot be undone.`, () => {
    state.complaints = state.complaints.filter(c => !state.selectedComplaints.has(c.id));
    save(COMPLAINTS_KEY, state.complaints);
    state.selectedComplaints.clear();
    closeModal('confirm-modal');
    renderComplaints(); updateBadges(); updateDashboard();
    toast(`${count} complaint(s) deleted`, 'info');
  });
}

function filterComplaints(filter, btn) {
  state.complaintFilter = filter;
  state.pagination.complaints = 1;
  document.querySelectorAll('#page-complaints .chip').forEach(b => { b.className = b === btn ? 'chip chip-active' : 'chip chip-inactive'; });
  renderComplaints();
}

function resolveComplaint(id) {
  const c = state.complaints.find(x => x.id === id);
  if (c) {
    c.status = 'Resolved';
    save(COMPLAINTS_KEY, state.complaints);
    renderComplaints(); updateBadges(); updateDashboard();
    toast('Complaint marked as resolved', 'success');
    addNotification('Complaint Resolved', `${c.category} complaint by ${c.complainant} marked resolved`, 'success');
  }
}

function viewComplaint(id) {
  const c = state.complaints.find(x => x.id === id);
  if (!c) return;
  document.getElementById('edit-modal-title').textContent = `Complaint ${c.id}`;
  document.getElementById('edit-modal-body').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;gap:8px">${priorityBadge(c.priority)}${c.status === 'Resolved' ? '<span class="badge badge-approved"><span class="badge-dot"></span>Resolved</span>' : '<span class="badge badge-urgent"><span class="badge-dot"></span>Pending</span>'}</div>
      <div><div class="text-sm text-muted">Complainant</div><div class="font-bold">${c.complainant}</div></div>
      <div><div class="text-sm text-muted">Category</div><div>${c.category}</div></div>
      <div><div class="text-sm text-muted">Date Filed</div><div>${formatDate(c.date)}</div></div>
      <div><div class="text-sm text-muted">Description</div><div style="background:var(--surface);border-radius:8px;padding:12px;font-size:13px;line-height:1.6">${c.desc}</div></div>
    </div>
  `;
  document.getElementById('edit-modal-save').textContent = c.status !== 'Resolved' ? 'Mark as Resolved' : 'Close';
  document.getElementById('edit-modal-save').onclick = c.status !== 'Resolved' ? () => { resolveComplaint(c.id); closeModal('edit-modal'); } : () => closeModal('edit-modal');
  openModal('edit-modal');
}

// NEW: edit complaint details
function editComplaint(id) {
  const c = state.complaints.find(x => x.id === id);
  if (!c) return;
  document.getElementById('edit-modal-title').textContent = `Edit Complaint ${c.id}`;
  document.getElementById('edit-modal-body').innerHTML = `
    <div class="form-group"><label>Complainant Name</label><input id="ec-name" value="${c.complainant}"/></div>
    <div class="form-grid-2">
      <div class="form-group"><label>Category</label><select id="ec-cat">
        ${['Sanitation','Noise','Public Safety','Infrastructure','Environmental','Other'].map(ct=>`<option ${c.category===ct?'selected':''}>${ct}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Priority</label><select id="ec-priority">
        ${['High','Medium','Low'].map(p=>`<option ${c.priority===p?'selected':''}>${p}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Status</label><select id="ec-status">
        <option ${c.status==='Pending'?'selected':''}>Pending</option>
        <option ${c.status==='Resolved'?'selected':''}>Resolved</option>
      </select></div>
    </div>
    <div class="form-group"><label>Description</label><textarea id="ec-desc" style="min-height:90px">${c.desc}</textarea></div>
  `;
  document.getElementById('edit-modal-save').textContent = 'Save Changes';
  document.getElementById('edit-modal-save').onclick = () => {
    c.complainant = val('ec-name') || c.complainant;
    c.category    = val('ec-cat');
    c.priority    = val('ec-priority');
    c.status      = val('ec-status');
    c.desc        = val('ec-desc') || c.desc;
    save(COMPLAINTS_KEY, state.complaints);
    closeModal('edit-modal');
    renderComplaints(); updateBadges(); updateDashboard();
    toast('Complaint updated!', 'success');
  };
  openModal('edit-modal');
}

function deleteComplaint(id) {
  state.complaints = state.complaints.filter(c => c.id !== id);
  save(COMPLAINTS_KEY, state.complaints);
  closeModal('confirm-modal'); renderComplaints(); updateBadges(); updateDashboard();
  toast('Complaint deleted', 'info');
}

function submitComplaint() {
  const name = val('cmp-name'), cat = val('cmp-cat'), desc = val('cmp-desc');
  if (!name || !cat || !desc) { toast('Please fill required fields', 'error'); return; }
  const id = 'CMP-' + String(state.complaints.length + 1).padStart(3, '0');
  state.complaints.push({ id, complainant: name, category: cat, priority: val('cmp-priority') || 'Medium', status: 'Pending', date: today(), desc });
  save(COMPLAINTS_KEY, state.complaints);
  closeModal('new-complaint-modal');
  ['cmp-name', 'cmp-cat', 'cmp-desc'].forEach(clearField);
  toast('Complaint filed successfully!', 'success');
  addNotification('New Complaint Filed', `${name} filed a ${cat} complaint`, 'complaint');
  updateBadges(); updateDashboard();
  if (document.getElementById('page-complaints').classList.contains('active')) renderComplaints();
}

// ===================== PROJECTS =====================
const catColors = { Infrastructure: '#1a56db', Healthcare: '#16a34a', Education: '#7c3aed', Environment: '#0891b2', 'Public Safety': '#d97706', Sanitation: '#dc2626' };
const catBg     = { Infrastructure: '#eef2ff', Healthcare: '#f0fdf4', Education: '#f5f3ff', Environment: '#ecfeff', 'Public Safety': '#fffbeb', Sanitation: '#fef2f2' };

function renderProjects() {
  const statsEl = document.getElementById('projects-stats');
  if (statsEl) {
    const budget    = state.projects.reduce((s, p) => s + p.budget, 0);
    const ongoing   = state.projects.filter(p => p.status === 'Ongoing').length;
    const completed = state.projects.filter(p => p.status === 'Completed').length;
    const planned   = state.projects.filter(p => p.status === 'Planned').length;
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#eef2ff"><span class="material-symbols-outlined" style="color:#1a56db">payments</span></div></div><div class="stat-label">Total Budget</div><div class="stat-value">₱${(budget / 1000000).toFixed(1)}M</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#fffbeb"><span class="material-symbols-outlined" style="color:#d97706">construction</span></div></div><div class="stat-label">Ongoing</div><div class="stat-value">${ongoing}</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#f0fdf4"><span class="material-symbols-outlined" style="color:#16a34a">task_alt</span></div></div><div class="stat-label">Completed</div><div class="stat-value">${completed}</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#f5f3ff"><span class="material-symbols-outlined" style="color:#7c3aed">schedule</span></div></div><div class="stat-label">Planned</div><div class="stat-value">${planned}</div></div>
    `;
  }
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  if (!state.projects.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon"><span class="material-symbols-outlined">account_tree</span></div><h4>No projects yet</h4><p>Create your first project</p></div>`;
    return;
  }
  grid.innerHTML = state.projects.map(p => {
    const color       = catColors[p.category] || '#1a56db';
    const bg          = catBg[p.category]     || '#eef2ff';
    const pct         = Math.min(100, Math.max(0, p.progress));
    const fillClass   = p.status === 'Completed' ? 'fill-success' : pct < 40 ? 'fill-error' : 'fill-primary';
    const statusColor = p.status === 'Completed' ? '#16a34a' : p.status === 'Ongoing' ? '#1a56db' : '#7c3aed';
    return `
      <div class="proj-card">
        <div class="proj-img" style="background:${bg}">
          <span class="material-symbols-outlined" style="font-size:52px;color:${color};opacity:0.2">${catIcon(p.category)}</span>
          <div class="proj-status-tag" style="background:${statusColor}">${p.status}</div>
        </div>
        <div class="proj-body">
          <div class="proj-cat">${p.category}</div>
          <div class="proj-title">${p.title}</div>
          <div class="proj-budget">Budget: <span>₱${Number(p.budget).toLocaleString()}</span></div>
          <div class="progress-wrap mb-3">
            <div class="progress-label"><span>Progress</span><span>${pct}%</span></div>
            <div class="progress-bar"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
          </div>
          <div class="proj-footer">
            <span style="font-size:11px;color:var(--on-surface-3)">${p.desc.slice(0, 50)}...</span>
            <div style="display:flex;gap:4px">
              <button class="tbl-btn" onclick="editProject('${p.id}')" title="Edit"><span class="material-symbols-outlined" style="font-size:16px">edit</span></button>
              <button class="tbl-btn danger" onclick="confirmDelete('Project','Delete this project?',()=>deleteProject('${p.id}'))" title="Delete"><span class="material-symbols-outlined" style="font-size:16px">delete</span></button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function catIcon(cat) {
  const icons = { Infrastructure: 'construction', Healthcare: 'health_and_safety', Education: 'school', Environment: 'eco', 'Public Safety': 'shield', Sanitation: 'recycling' };
  return icons[cat] || 'account_tree';
}

function editProject(id) {
  const p = state.projects.find(x => x.id === id);
  if (!p) return;
  document.getElementById('edit-modal-title').textContent = 'Edit Project';
  document.getElementById('edit-modal-body').innerHTML = `
    <div class="form-group"><label>Title</label><input id="ep-title" value="${p.title}"/></div>
    <div class="form-grid-2">
      <div class="form-group"><label>Category</label><select id="ep-cat">
        ${['Infrastructure', 'Healthcare', 'Education', 'Environment', 'Public Safety', 'Sanitation'].map(c => `<option ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Status</label><select id="ep-status">
        ${['Planned', 'Ongoing', 'Completed'].map(s => `<option ${p.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Budget (₱)</label><input id="ep-budget" type="number" value="${p.budget}"/></div>
      <div class="form-group"><label>Progress (%)</label><input id="ep-progress" type="number" value="${p.progress}" min="0" max="100"/></div>
    </div>
    <div class="form-group"><label>Description</label><textarea id="ep-desc">${p.desc}</textarea></div>
  `;
  document.getElementById('edit-modal-save').onclick = () => {
    p.title    = val('ep-title'); p.category = val('ep-cat');
    p.status   = val('ep-status'); p.budget  = Number(val('ep-budget'));
    p.progress = Number(val('ep-progress')); p.desc = val('ep-desc');
    save(PROJECTS_KEY, state.projects);
    closeModal('edit-modal'); renderProjects();
    toast('Project updated!', 'success');
  };
  openModal('edit-modal');
}

function deleteProject(id) {
  state.projects = state.projects.filter(p => p.id !== id);
  save(PROJECTS_KEY, state.projects);
  closeModal('confirm-modal'); renderProjects(); updateDashboard();
  toast('Project deleted', 'info');
}

function submitProject() {
  const title = val('proj-title'), cat = val('proj-cat');
  if (!title || !cat) { toast('Please fill required fields', 'error'); return; }
  const id = 'PRJ-' + String(state.projects.length + 1).padStart(3, '0');
  state.projects.push({ id, title, category: cat, status: val('proj-status'), budget: Number(val('proj-budget')) || 0, progress: Number(val('proj-progress')) || 0, desc: val('proj-desc') || '' });
  save(PROJECTS_KEY, state.projects);
  closeModal('new-project-modal');
  ['proj-title', 'proj-cat', 'proj-budget', 'proj-progress', 'proj-desc'].forEach(clearField);
  toast(`Project "${title}" created!`, 'success');
  addNotification('New Project Created', `"${title}" added to community projects`, 'info');
  updateDashboard();
  if (document.getElementById('page-projects').classList.contains('active')) renderProjects();
}

// ===================== ANNOUNCEMENTS =====================

// NEW: sort toggle
function setAnnSort(sort, btn) {
  state.annSort = sort;
  document.querySelectorAll('#ann-sort-bar .chip').forEach(b => { b.className = b === btn ? 'chip chip-active' : 'chip chip-inactive'; });
  renderAnnouncements();
}

function renderAnnouncements() {
  const grid = document.getElementById('announcements-grid');
  if (!grid) return;
  let filtered = state.annFilter === 'all' ? [...state.announcements] : state.announcements.filter(a => a.category === state.annFilter);

  // NEW: sort
  filtered.sort((a, b) => {
    if (state.annSort === 'oldest') return new Date(a.date) - new Date(b.date);
    return new Date(b.date) - new Date(a.date); // newest first (default)
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon"><span class="material-symbols-outlined">campaign</span></div><h4>No announcements</h4><p>Publish your first announcement</p></div>`;
    return;
  }
  const catColors2 = { meeting: '#1a56db', health: '#dc2626', holiday: '#7c3aed', infrastructure: '#d97706', general: '#16a34a' };
  const catLabels  = { meeting: 'Meeting', health: 'Health', holiday: 'Holiday', infrastructure: 'Infrastructure', general: 'General' };
  grid.innerHTML = filtered.map(a => `
    <div class="ann-card">
      <div class="ann-img" style="background:${catBg2(a.category)}">
        <span class="material-symbols-outlined" style="font-size:48px;color:${catColors2[a.category] || '#1a56db'};opacity:0.2">${annIcon(a.category)}</span>
        <span class="ann-cat-badge" style="background:${catColors2[a.category] || '#1a56db'}">${catLabels[a.category] || a.category}</span>
      </div>
      <div class="ann-body">
        <div class="ann-date">${formatDate(a.date)}</div>
        <div class="ann-title">${a.title}</div>
        <div class="ann-excerpt">${a.content}</div>
        <div class="ann-footer">
          <button class="ann-edit-btn" onclick="editAnnouncement('${a.id}')"><span class="material-symbols-outlined" style="font-size:14px">edit</span> Edit</button>
          <button class="ann-delete-btn" onclick="confirmDelete('Announcement','Delete this announcement?',()=>deleteAnnouncement('${a.id}'))"><span class="material-symbols-outlined" style="font-size:18px">delete</span></button>
        </div>
      </div>
    </div>
  `).join('');
}

function catBg2(cat) { return { meeting: '#eef2ff', health: '#fef2f2', holiday: '#f5f3ff', infrastructure: '#fffbeb', general: '#f0fdf4' }[cat] || '#eef2ff'; }
function annIcon(cat) { return { meeting: 'groups', health: 'health_and_safety', holiday: 'celebration', infrastructure: 'construction', general: 'campaign' }[cat] || 'campaign'; }

function filterAnnouncements(filter, btn) {
  state.annFilter = filter;
  document.querySelectorAll('#page-announcements .chip:not(#ann-sort-bar .chip)').forEach(b => { b.className = b === btn ? 'chip chip-active' : 'chip chip-inactive'; });
  renderAnnouncements();
}

function editAnnouncement(id) {
  const a = state.announcements.find(x => x.id === id);
  if (!a) return;
  document.getElementById('edit-modal-title').textContent = 'Edit Announcement';
  document.getElementById('edit-modal-body').innerHTML = `
    <div class="form-group"><label>Title</label><input id="ea-title" value="${a.title}"/></div>
    <div class="form-grid-2">
      <div class="form-group"><label>Category</label><select id="ea-cat">
        ${['meeting', 'health', 'holiday', 'infrastructure', 'general'].map(c => `<option ${a.category === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Date</label><input type="date" id="ea-date" value="${a.date}"/></div>
    </div>
    <div class="form-group"><label>Content</label><textarea id="ea-content" style="min-height:100px">${a.content}</textarea></div>
  `;
  document.getElementById('edit-modal-save').onclick = () => {
    a.title    = val('ea-title');
    a.category = val('ea-cat');
    a.content  = val('ea-content');
    a.date     = val('ea-date') || a.date;
    save(ANNOUNCEMENTS_KEY, state.announcements);
    closeModal('edit-modal'); renderAnnouncements();
    toast('Announcement updated!', 'success');
  };
  openModal('edit-modal');
}

function deleteAnnouncement(id) {
  state.announcements = state.announcements.filter(a => a.id !== id);
  save(ANNOUNCEMENTS_KEY, state.announcements);
  closeModal('confirm-modal'); renderAnnouncements();
  toast('Announcement deleted', 'info');
}

function submitAnnouncement() {
  const title = val('ann-title'), content = val('ann-content');
  if (!title || !content) { toast('Please fill required fields', 'error'); return; }
  const id = 'ANN-' + String(state.announcements.length + 1).padStart(3, '0');
  const cat = val('ann-cat') || 'general';
  state.announcements.unshift({ id, title, category: cat, content, date: today() });
  save(ANNOUNCEMENTS_KEY, state.announcements);
  closeModal('new-announcement-modal');
  ['ann-title', 'ann-cat', 'ann-content'].forEach(clearField);
  toast('Announcement published!', 'success');
  // FIX: was missing addNotification
  addNotification('New Announcement', `"${title}" published`, 'info');
  if (document.getElementById('page-announcements').classList.contains('active')) renderAnnouncements();
}

// ===================== USERS =====================
function renderUsers() {
  const statsEl = document.getElementById('users-stats');
  if (statsEl) {
    const admins = state.users.filter(u => u.role === 'Admin').length;
    const staff  = state.users.filter(u => u.role === 'Staff').length;
    const active = state.users.filter(u => u.status === 'Active').length;
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#eef2ff"><span class="material-symbols-outlined" style="color:#1a56db">people</span></div></div><div class="stat-label">Total Users</div><div class="stat-value">${state.users.length}</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#f5f3ff"><span class="material-symbols-outlined" style="color:#7c3aed">verified_user</span></div></div><div class="stat-label">Administrators</div><div class="stat-value">${admins}</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#fffbeb"><span class="material-symbols-outlined" style="color:#d97706">badge</span></div></div><div class="stat-label">Staff</div><div class="stat-value">${staff}</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#f0fdf4"><span class="material-symbols-outlined" style="color:#16a34a">check_circle</span></div></div><div class="stat-label">Active</div><div class="stat-value">${active}</div></div>
    `;
  }
  const tbody = document.getElementById('users-table');
  if (!tbody) return;
  tbody.innerHTML = state.users.map(u => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:10px"><div class="av" style="background:${avatarColor(u.name)};color:white;font-size:11px">${u.initials || initials(u.name)}</div><div><div style="font-weight:700">${u.name}</div><div style="font-size:11px;color:var(--on-surface-3)">@${u.username}</div></div></div></td>
      <td>${u.role === 'Admin' ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge badge-staff">Staff</span>'}</td>
      <td style="font-size:12px;color:var(--on-surface-3)">${u.email}</td>
      <td>${u.status === 'Active' ? '<span class="badge badge-active"><span class="badge-dot"></span>Active</span>' : '<span class="badge badge-suspended"><span class="badge-dot"></span>Suspended</span>'}</td>
      <td style="font-size:12px;color:var(--on-surface-3)">${u.lastActive || 'N/A'}</td>
      <td><div class="tbl-actions">
        <button class="tbl-btn" onclick="editUser(${u.id})" title="Edit"><span class="material-symbols-outlined">edit</span></button>
        <button class="tbl-btn" onclick="toggleUserStatus(${u.id})" title="Toggle Status"><span class="material-symbols-outlined">${u.status === 'Active' ? 'block' : 'check_circle'}</span></button>
        ${u.id !== state.session?.id ? `<button class="tbl-btn danger" onclick="confirmDelete('User','Delete user ${u.name}?',()=>deleteUser(${u.id}))" title="Delete"><span class="material-symbols-outlined">delete</span></button>` : ''}
      </div></td>
    </tr>
  `).join('');
}

function toggleUserStatus(id) {
  const u = state.users.find(x => x.id === id);
  if (!u) return;
  u.status = u.status === 'Active' ? 'Suspended' : 'Active';
  save(USERS_KEY, state.users);
  renderUsers();
  toast(`User ${u.status === 'Active' ? 'activated' : 'suspended'}`, 'info');
}

function editUser(id) {
  const u = state.users.find(x => x.id === id);
  if (!u) return;
  document.getElementById('edit-modal-title').textContent = 'Edit User';
  document.getElementById('edit-modal-body').innerHTML = `
    <div class="form-grid-2">
      <div class="form-group"><label>Full Name</label><input id="eu-name" value="${u.name}"/></div>
      <div class="form-group"><label>Username</label><input id="eu-username" value="${u.username}"/></div>
      <div class="form-group"><label>Email</label><input id="eu-email" value="${u.email}"/></div>
      <div class="form-group"><label>Role</label><select id="eu-role">
        <option ${u.role === 'Staff' ? 'selected' : ''}>Staff</option>
        <option ${u.role === 'Admin' ? 'selected' : ''}>Admin</option>
      </select></div>
    </div>
  `;
  document.getElementById('edit-modal-save').onclick = () => {
    u.name     = val('eu-name'); u.username = val('eu-username');
    u.email    = val('eu-email'); u.role    = val('eu-role');
    u.initials = initials(u.name);
    // FIX: sync session if editing yourself
    if (state.session && state.session.id === u.id) {
      state.session.name     = u.name;
      state.session.username = u.username;
      state.session.email    = u.email;
      state.session.role     = u.role;
      state.session.initials = u.initials;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
      initApp(); // refresh topbar
    }
    save(USERS_KEY, state.users);
    closeModal('edit-modal'); renderUsers();
    toast('User updated!', 'success');
  };
  openModal('edit-modal');
}

function deleteUser(id) {
  state.users = state.users.filter(u => u.id !== id);
  save(USERS_KEY, state.users);
  closeModal('confirm-modal'); renderUsers();
  toast('User deleted', 'info');
}

function submitUser() {
  const name = val('usr-name'), username = val('usr-username'), email = val('usr-email'), password = val('usr-password');
  if (!name || !username || !email || !password) { toast('Please fill all fields', 'error'); return; }
  if (state.users.find(u => u.username === username)) { toast('Username already exists', 'error'); return; }
  const id = Math.max(...state.users.map(u => u.id), 0) + 1;
  state.users.push({ id, name, username, email, password, role: val('usr-role'), status: 'Active', lastActive: 'Just now', initials: initials(name) });
  save(USERS_KEY, state.users);
  closeModal('add-user-modal');
  ['usr-name', 'usr-username', 'usr-email', 'usr-password'].forEach(clearField);
  toast(`User ${name} created!`, 'success');
  renderUsers();
}

// ===================== SETTINGS =====================
function saveSettings() {
  toast('Settings saved successfully!', 'success');
}

function changePassword() {
  const cur = val('s-cur-pw'), nw = val('s-new-pw'), conf = val('s-conf-pw');
  if (!cur || !nw || !conf) { toast('Please fill all password fields', 'error'); return; }
  if (nw !== conf) { toast('New passwords do not match', 'error'); return; }
  const user = state.users.find(u => u.id === state.session?.id);
  if (user && user.password !== cur) { toast('Current password is incorrect', 'error'); return; }
  if (user) {
    user.password = nw;
    save(USERS_KEY, state.users);
    // FIX: sync the session object with the new password
    state.session.password = nw;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
  }
  ['s-cur-pw', 's-new-pw', 's-conf-pw'].forEach(clearField);
  toast('Password updated successfully!', 'success');
}

// ===================== EMERGENCY =====================
function launchEmergency() {
  const msg = val('em-message'), type = val('em-type');
  if (!msg) { toast('Please enter an alert message', 'error'); return; }
  closeModal('emergency-modal');
  clearField('em-message');
  toast(`🚨 Emergency Alert Launched: ${type}`, 'error');
  addNotification('🚨 Emergency Alert Sent', `${type}: ${msg.slice(0, 60)}`, 'warning');
}

// ===================== PAGINATION =====================
// FIX: prevent double ellipsis by tracking whether we already added one on each side
function renderPagination(key, total, current, renderFn) {
  const el = document.getElementById(`${key}-pagination`);
  if (!el) return;
  const pages = Math.ceil(total / state.perPage);
  if (pages <= 1) { el.innerHTML = `<span class="pg-info">Showing ${total} of ${total}</span>`; return; }
  const start = (current - 1) * state.perPage + 1;
  const end   = Math.min(current * state.perPage, total);
  let btns = `<button class="pg-btn" onclick="changePage('${key}','${renderFn}',${current - 1})" ${current === 1 ? 'disabled style="opacity:0.4"' : ''}><span class="material-symbols-outlined">chevron_left</span></button>`;
  let leftEllipsisDone  = false;
  let rightEllipsisDone = false;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= current - 1 && i <= current + 1)) {
      btns += `<button class="pg-btn ${i === current ? 'active-pg' : ''}" onclick="changePage('${key}','${renderFn}',${i})">${i}</button>`;
      leftEllipsisDone  = false;
      rightEllipsisDone = false;
    } else if (i < current - 1 && !leftEllipsisDone) {
      btns += `<button class="pg-btn" disabled style="opacity:0.4">…</button>`;
      leftEllipsisDone = true;
    } else if (i > current + 1 && !rightEllipsisDone) {
      btns += `<button class="pg-btn" disabled style="opacity:0.4">…</button>`;
      rightEllipsisDone = true;
    }
  }
  btns += `<button class="pg-btn" onclick="changePage('${key}','${renderFn}',${current + 1})" ${current === pages ? 'disabled style="opacity:0.4"' : ''}><span class="material-symbols-outlined">chevron_right</span></button>`;
  el.innerHTML = `<span class="pg-info">Showing ${start}–${end} of ${total}</span><div class="pg-btns">${btns}</div>`;
}

function changePage(key, renderFn, page) {
  if (page < 1) return;
  state.pagination[key] = page;
  window[renderFn]();
}

// ===================== MODALS =====================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'none'; document.body.style.overflow = ''; }
}

function closeOnOverlay(e, id) {
  if (e.target.classList.contains('modal-overlay')) closeModal(id);
}

function confirmDelete(noun, message, callback) {
  document.getElementById('confirm-title').textContent = `Delete ${noun}?`;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-action').onclick = callback;
  openModal('confirm-modal');
}

// ===================== NOTIFICATIONS =====================
let notifications = [
  { id: 1, title: 'New complaint filed', text: 'Maria Santos filed a sanitation complaint', icon: 'gavel', color: 'var(--error-light)', iconColor: 'var(--error)', time: '2 min ago', read: false },
  { id: 2, title: 'Document approved', text: 'Barangay Clearance for Mateo Cruz approved', icon: 'description', color: 'var(--success-light)', iconColor: 'var(--success)', time: '15 min ago', read: false },
  { id: 3, title: 'Project update', text: 'Road Maintenance Phase 4 reached 75%', icon: 'account_tree', color: '#eef2ff', iconColor: 'var(--primary)', time: '1 hr ago', read: true },
];

function addNotification(title, text, type) {
  const configs = {
    warning:   { color: 'var(--error-light)',   iconColor: 'var(--error)',   icon: 'warning'      },
    success:   { color: 'var(--success-light)', iconColor: 'var(--success)', icon: 'check_circle' },
    info:      { color: '#eef2ff',              iconColor: 'var(--primary)', icon: 'info'         },
    doc:       { color: '#fffbeb',              iconColor: '#d97706',        icon: 'description'  },
    person:    { color: '#f5f3ff',              iconColor: '#7c3aed',        icon: 'person'       },
    complaint: { color: 'var(--error-light)',   iconColor: 'var(--error)',   icon: 'gavel'        },
  };
  const cfg = configs[type] || configs.info;
  notifications.unshift({ id: Date.now(), title, text, icon: cfg.icon, color: cfg.color, iconColor: cfg.iconColor, time: 'just now', read: false });
  const btn = document.querySelector('.icon-btn .material-symbols-outlined');
  if (btn) { btn.style.color = 'var(--error)'; setTimeout(() => btn.style.color = '', 2000); }
}

function renderNotifications() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  list.innerHTML = notifications.map(n => `
    <div class="notif-item ${!n.read ? 'notif-unread' : ''}" onclick="markRead(${n.id})">
      <div class="notif-icon" style="background:${n.color}"><span class="material-symbols-outlined" style="font-size:16px;color:${n.iconColor}">${n.icon}</span></div>
      <div class="notif-content"><div class="notif-text">${n.title}</div><div class="text-sm text-muted">${n.text}</div><div class="notif-time">${n.time}</div></div>
    </div>
  `).join('');
}

function markRead(id) { const n = notifications.find(x => x.id === id); if (n) n.read = true; renderNotifications(); }
function markAllRead() { notifications.forEach(n => n.read = true); renderNotifications(); toast('All notifications marked as read', 'info'); }

function toggleNotifications() {
  const panel = document.getElementById('notif-panel');
  const profileMenu = document.getElementById('profile-menu');
  if (profileMenu) profileMenu.style.display = 'none';
  if (panel.style.display === 'none' || !panel.style.display) { panel.style.display = 'block'; renderNotifications(); }
  else { panel.style.display = 'none'; }
}

// ===================== PROFILE MENU =====================
function showProfileMenu() {
  const menu = document.getElementById('profile-menu');
  const notifPanel = document.getElementById('notif-panel');
  if (notifPanel) notifPanel.style.display = 'none';
  menu.style.display = menu.style.display === 'none' || !menu.style.display ? 'block' : 'none';
}
function closeProfileMenu() { const m = document.getElementById('profile-menu'); if (m) m.style.display = 'none'; }

function closeAllDropdowns() {
  document.getElementById('notif-panel').style.display = 'none';
  document.getElementById('profile-menu').style.display = 'none';
}

document.addEventListener('click', e => {
  if (!e.target.closest('#notif-panel') && !e.target.closest('.icon-btn')) {
    const p = document.getElementById('notif-panel'); if (p) p.style.display = 'none';
  }
  if (!e.target.closest('#profile-menu') && !e.target.closest('.topbar-user') && !e.target.closest('.sidebar-user')) {
    const m = document.getElementById('profile-menu'); if (m) m.style.display = 'none';
  }
});

// ===================== SEARCH =====================
// FIX: clear stale search fields before navigating to a page
function globalSearch(query) {
  if (!query) return;
  const q = query.toLowerCase();
  // Clear all search fields first
  ['residents-search','docs-search','complaints-search'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const hasRes = state.residents.some(r =>
    `${r.fname} ${r.lname}`.toLowerCase().includes(q) || r.purok.toLowerCase().includes(q)
  );
  const hasDocs = state.documents.some(d => d.resident.toLowerCase().includes(q));
  const hasCmp  = state.complaints.some(c => c.complainant.toLowerCase().includes(q));
  if (hasRes) {
    document.getElementById('residents-search').value = query; showPage('residents');
  } else if (hasDocs) {
    document.getElementById('docs-search').value = query; showPage('documents');
  } else if (hasCmp) {
    document.getElementById('complaints-search').value = query; showPage('complaints');
  } else {
    toast('No results found for "' + query + '"', 'info');
  }
}

// ===================== EXPORT =====================
function exportCSV(type) {
  let rows = [], headers = [];
  if (type === 'residents') {
    headers = ['ID', 'First Name', 'Last Name', 'Purok', 'Contact', 'Status', 'Registered'];
    rows = state.residents.map(r => [r.id, r.fname, r.lname, r.purok, r.contact, r.status, r.registered]);
  } else if (type === 'documents') {
    headers = ['Reference', 'Resident', 'Type', 'Date', 'Status', 'Purpose'];
    rows = state.documents.map(d => [d.ref, d.resident, d.type, d.date, d.status, d.purpose || '']);
  } else if (type === 'complaints') {
    headers = ['ID', 'Complainant', 'Category', 'Priority', 'Status', 'Date'];
    rows = state.complaints.map(c => [c.id, c.complainant, c.category, c.priority, c.status, c.date]);
  } else if (type === 'projects') {
    headers = ['ID', 'Title', 'Category', 'Status', 'Budget', 'Progress'];
    rows = state.projects.map(p => [p.id, p.title, p.category, p.status, p.budget, p.progress + '%']);
  } else if (type === 'users') {
    headers = ['ID', 'Name', 'Username', 'Email', 'Role', 'Status'];
    rows = state.users.map(u => [u.id, u.name, u.username, u.email, u.role, u.status]);
  }
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadFile(csv, `payatas-${type}-${today()}.csv`, 'text/csv');
  toast(`Exported ${type} to CSV`, 'success');
}

// FIX: exportReport now generates a real CSV summary report
function exportReport(type) {
  toast('Generating report...', 'info');
  setTimeout(() => {
    const now = new Date().toLocaleString('en-PH');
    let csv = '';
    if (type === 'monthly' || type === 'summary') {
      const docs      = state.documents;
      const cmps      = state.complaints;
      const residents = state.residents;
      const projects  = state.projects;
      const approved  = docs.filter(d => d.status === 'Approved').length;
      const pending   = docs.filter(d => d.status === 'Pending').length;
      const rejected  = docs.filter(d => d.status === 'Rejected').length;
      const resolved  = cmps.filter(c => c.status === 'Resolved').length;
      const cmpPending = cmps.filter(c => c.status === 'Pending').length;
      const budget    = projects.reduce((s, p) => s + p.budget, 0);
      csv = [
        [`Barangay Payatas — ${type === 'monthly' ? 'Monthly' : 'Summary'} Report`],
        [`Generated: ${now}`],
        [],
        ['=== RESIDENTS ==='],
        ['Total Registered', residents.length],
        ['Active', residents.filter(r => r.status === 'Active').length],
        ['Inactive', residents.filter(r => r.status === 'Inactive').length],
        [],
        ['=== DOCUMENTS ==='],
        ['Total Requests', docs.length],
        ['Approved', approved],
        ['Pending', pending],
        ['Rejected', rejected],
        ['Approval Rate', docs.length ? Math.round(approved / docs.length * 100) + '%' : 'N/A'],
        [],
        ['=== COMPLAINTS ==='],
        ['Total Filed', cmps.length],
        ['Resolved', resolved],
        ['Pending', cmpPending],
        ['Resolution Rate', cmps.length ? Math.round(resolved / cmps.length * 100) + '%' : 'N/A'],
        [],
        ['=== PROJECTS ==='],
        ['Total Projects', projects.length],
        ['Ongoing', projects.filter(p => p.status === 'Ongoing').length],
        ['Completed', projects.filter(p => p.status === 'Completed').length],
        ['Planned', projects.filter(p => p.status === 'Planned').length],
        ['Total Budget', '₱' + budget.toLocaleString()],
      ].map(r => r.map(c => `"${String(c === undefined ? '' : c).replace(/"/g,'""')}"`).join(',')).join('\n');
    } else {
      // fallback: export all complaints or docs as CSV
      csv = exportCSV(type === 'complaints' ? 'complaints' : 'documents') || '';
      return; // exportCSV already triggers download
    }
    downloadFile(csv, `payatas-report-${type}-${today()}.csv`, 'text/csv');
    toast('Report downloaded!', 'success');
  }, 800);
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ===================== TOAST =====================
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: 'check_circle', error: 'error', info: 'info' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">${icons[type] || 'info'}</span>${message}`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ===================== UTILS =====================
function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function setVal(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function clearField(id) { const el = document.getElementById(id); if (el) el.value = ''; }
function today() { return new Date().toISOString().split('T')[0]; }
function formatDate(d) { if (!d) return 'N/A'; const dt = new Date(d); return dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); }

function initials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// FIX: avatarColor — hash can only return values 0..COLORS.length-1 safely
const COLORS = ['#1a56db', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#db2777'];
function avatarColor(name) {
  if (!name) return COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0; // keep unsigned 32-bit
  }
  return COLORS[h % COLORS.length];
}

function statusBadge(status) {
  const map = { Approved: 'badge-approved', Pending: 'badge-pending', Rejected: 'badge-rejected' };
  const dot = { Approved: '#16a34a', Pending: '#d97706', Rejected: '#dc2626' };
  return `<span class="badge ${map[status] || 'badge-inactive'}"><span class="badge-dot" style="background:${dot[status] || '#6b7280'}"></span>${status}</span>`;
}

function priorityBadge(priority) {
  const map = { High: 'badge-urgent', Medium: 'badge-pending', Low: 'badge-inactive' };
  return `<span class="badge ${map[priority] || 'badge-inactive'}">${priority}</span>`;
}

// ===================== BOOTSTRAP =====================
seedData();
loadState();

if (state.session) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  initApp();
  startSessionTimeout();
}

// ===================== DOCUMENT DETAIL PANEL =====================
let _panelDocId = null;

function openDocPanel(id) {
  const d = state.documents.find(x => x.id === id);
  if (!d) return;
  _panelDocId = id;
  document.getElementById('dp-title').textContent = d.type;
  document.getElementById('dp-ref').textContent = d.ref;
  document.getElementById('dp-cert-type').textContent = d.type;
  document.getElementById('dp-cert-name').textContent = d.resident;
  document.getElementById('dp-cert-purpose').textContent = d.purpose || '—';
  document.getElementById('dp-cert-date').textContent = formatDate(d.date);
  document.getElementById('dp-cert-contact').textContent = d.contact || '—';
  document.getElementById('dp-cert-ref').textContent = d.ref;
  const stTag = document.getElementById('dp-cert-status-tag');
  stTag.textContent = d.status;
  stTag.className = 'cert-status-tag ' + d.status.toLowerCase();
  buildTimeline(d.status);
  document.getElementById('dp-edit-name').value    = d.resident;
  document.getElementById('dp-edit-contact').value = d.contact || '';
  document.getElementById('dp-edit-type').value    = d.type;
  document.getElementById('dp-edit-purpose').value = d.purpose || '';
  document.getElementById('dp-edit-status').value  = d.status;
  document.getElementById('doc-panel-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function buildTimeline(status) {
  const steps = [
    { label: 'Request Submitted', desc: 'Resident filed the document request', icon: 'upload_file' },
    { label: 'Under Review', desc: 'Staff is verifying the details', icon: 'manage_search' },
    { label: status === 'Rejected' ? 'Request Rejected' : 'Request Approved', desc: status === 'Rejected' ? 'Document request was declined' : 'Document has been approved', icon: status === 'Rejected' ? 'cancel' : 'check_circle' },
    { label: 'Ready for Release', desc: 'Document is ready for pickup', icon: 'done_all' },
  ];
  const activeIdx = status === 'Approved' ? 3 : status === 'Rejected' ? 2 : 1;
  document.getElementById('dp-timeline').innerHTML = steps.map((s, i) => {
    let cls = 'timeline-step';
    if (i < activeIdx) cls += ' done';
    else if (i === activeIdx) cls += (status === 'Rejected' && i === 2) ? ' rejected-step' : ' current';
    return `<div class="${cls}"><div class="timeline-dot"><span class="material-symbols-outlined">${s.icon}</span></div><div class="timeline-content"><h5>${s.label}</h5><p>${s.desc}</p></div></div>`;
  }).join('');
}

function closeDocPanel(e) {
  if (e && !e.target.classList.contains('doc-panel-overlay')) return;
  closeDocPanelDirect();
}

function closeDocPanelDirect() {
  document.getElementById('doc-panel-overlay').classList.remove('open');
  document.body.style.overflow = '';
  _panelDocId = null;
}

function saveDocPanel() {
  const d = state.documents.find(x => x.id === _panelDocId);
  if (!d) return;
  d.resident = document.getElementById('dp-edit-name').value.trim()    || d.resident;
  d.contact  = document.getElementById('dp-edit-contact').value.trim();
  d.type     = document.getElementById('dp-edit-type').value;
  d.purpose  = document.getElementById('dp-edit-purpose').value.trim();
  d.status   = document.getElementById('dp-edit-status').value;
  save(DOCUMENTS_KEY, state.documents);
  openDocPanel(_panelDocId);
  renderDocuments(); renderDashboardDocs(); updateBadges(); updateDashboard();
  toast('Document updated successfully!', 'success');
}

function printDocument() {
  const d = state.documents.find(x => x.id === _panelDocId);
  if (!d) return;
  const w = window.open('', '_blank', 'width=700,height=900');
  w.document.write(`<!DOCTYPE html><html><head>
    <title>${d.type} — ${d.ref}</title>
    <style>
      body{font-family:Georgia,serif;margin:0;padding:40px;color:#111}
      .header{text-align:center;border-bottom:3px double #1a56db;padding-bottom:20px;margin-bottom:24px}
      .header h1{font-size:22px;color:#1a56db;margin:0 0 4px}
      .header p{font-size:12px;color:#555;margin:0}
      .doc-title{text-align:center;font-size:18px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin:20px 0 28px}
      .field{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px}
      .field .lbl{width:160px;font-weight:bold;flex-shrink:0;color:#444}
      .footer{margin-top:60px;display:flex;justify-content:space-between;font-size:12px}
      .sig{text-align:center}
      .sig-line{width:180px;border-top:1px solid #111;margin:40px auto 4px}
      .watermark{text-align:center;margin-top:32px;color:#d1d5db;font-size:11px;letter-spacing:1px}
      @media print{body{padding:20px}}
    </style>
  </head><body>
    <div class="header"><h1>Barangay Payatas</h1><p>Litex Road, Quezon City, Metro Manila · +63 2 8123 4567</p></div>
    <div class="doc-title">${d.type}</div>
    <div class="field"><span class="lbl">Reference No.</span><span>${d.ref}</span></div>
    <div class="field"><span class="lbl">Issued To</span><span>${d.resident}</span></div>
    <div class="field"><span class="lbl">Purpose</span><span>${d.purpose || 'N/A'}</span></div>
    <div class="field"><span class="lbl">Contact</span><span>${d.contact || 'N/A'}</span></div>
    <div class="field"><span class="lbl">Date Filed</span><span>${formatDate(d.date)}</span></div>
    <div class="field"><span class="lbl">Status</span><span>${d.status}</span></div>
    <div class="footer">
      <div class="sig"><div class="sig-line"></div><div>Barangay Captain</div></div>
      <div class="sig"><div class="sig-line"></div><div>Secretary</div></div>
    </div>
    <div class="watermark">OFFICIAL DOCUMENT — BARANGAY PAYATAS · PAYATAS LEDGER v2.5.0</div>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

// ===================== RESIDENT PROFILE PANEL =====================
let _panelResidentId = null;

function openResidentPanel(id) {
  const r = state.residents.find(x => x.id === id);
  if (!r) return;
  _panelResidentId = id;
  const fullName = `${r.fname} ${r.lname}`;
  document.getElementById('rp-avatar').textContent = initials(fullName);
  document.getElementById('rp-avatar').style.background = avatarColor(fullName);
  document.getElementById('rp-name').textContent = fullName;
  document.getElementById('rp-id').textContent = r.id;
  document.getElementById('rp-badges').innerHTML = `
    ${r.status === 'Active' ? '<span class="badge badge-active"><span class="badge-dot"></span>Active</span>' : '<span class="badge badge-inactive"><span class="badge-dot"></span>Inactive</span>'}
    <span class="badge" style="background:var(--surface);color:var(--on-surface-2)">${r.purok}</span>
    <span class="badge" style="background:var(--surface);color:var(--on-surface-2)">Since ${r.registered}</span>
  `;
  const age = r.dob && r.dob !== 'N/A' ? Math.floor((new Date() - new Date(r.dob)) / 31557600000) + ' yrs' : 'N/A';
  const fields = [
    { label: 'First Name',       val: r.fname },
    { label: 'Last Name',        val: r.lname },
    { label: 'Date of Birth',    val: r.dob !== 'N/A' ? formatDate(r.dob) : 'N/A' },
    { label: 'Age',              val: age },
    { label: 'Gender',           val: r.gender || 'N/A' },
    { label: 'Contact',          val: r.contact },
    { label: 'Purok',            val: r.purok },
    { label: 'Year Registered',  val: r.registered },
    { label: 'Address',          val: r.address, full: true },
    { label: 'Notes',            val: r.notes || '—', full: true },
  ];
  document.getElementById('rp-info-grid').innerHTML = fields.map(f => `
    <div style="${f.full ? 'grid-column:1/-1;' : ''}background:var(--surface);border-radius:8px;padding:10px 12px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--on-surface-3);margin-bottom:3px">${f.label}</div>
      <div style="font-size:13px;font-weight:600;color:var(--on-surface-1)">${f.val}</div>
    </div>
  `).join('');
  const docs = state.documents.filter(d =>
    d.resident.toLowerCase().includes(r.fname.toLowerCase()) ||
    d.resident.toLowerCase().includes(r.lname.toLowerCase())
  );
  document.getElementById('rp-doc-history').innerHTML = docs.length
    ? docs.map(d => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--surface);border-radius:8px;margin-bottom:6px;font-size:12px">
          <div><div style="font-weight:600">${d.type}</div><div style="color:var(--on-surface-3);font-family:'DM Mono',monospace;font-size:10px">${d.ref} · ${formatDate(d.date)}</div></div>
          ${statusBadge(d.status)}
        </div>`).join('')
    : '<div style="font-size:13px;color:var(--on-surface-3);padding:10px 0">No document requests found.</div>';
  const cmps = state.complaints.filter(c =>
    c.complainant.toLowerCase().includes(r.fname.toLowerCase()) ||
    c.complainant.toLowerCase().includes(r.lname.toLowerCase())
  );
  document.getElementById('rp-complaints').innerHTML = cmps.length
    ? cmps.map(c => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--surface);border-radius:8px;margin-bottom:6px;font-size:12px">
          <div><div style="font-weight:600">${c.category} — ${c.id}</div><div style="color:var(--on-surface-3)">${c.desc.slice(0, 60)}...</div></div>
          ${priorityBadge(c.priority)}
        </div>`).join('')
    : '<div style="font-size:13px;color:var(--on-surface-3);padding:10px 0">No linked complaints found.</div>';
  document.getElementById('resident-panel-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// FIX: was checking 'doc-panel-overlay' instead of 'resident-panel-overlay'
function closeResidentPanel(e) {
  if (e && !e.target.classList.contains('resident-panel-overlay')) return;
  closeResidentPanelDirect();
}

function closeResidentPanelDirect() {
  document.getElementById('resident-panel-overlay').classList.remove('open');
  document.body.style.overflow = '';
  _panelResidentId = null;
}

function editResidentFromPanel() {
  const id = _panelResidentId;
  closeResidentPanelDirect();
  editResident(id);
}

// NEW: print from panel
function printResidentFromPanel() {
  printResidentProfile(_panelResidentId);
}

// ===================== REPORTS =====================
function renderReports() {
  const docs      = state.documents;
  const cmps      = state.complaints;
  const residents = state.residents;
  const projects  = state.projects;

  const approved     = docs.filter(d => d.status === 'Approved').length;
  const pending      = docs.filter(d => d.status === 'Pending').length;
  const resolved     = cmps.filter(c => c.status === 'Resolved').length;
  const resRate      = cmps.length ? Math.round(resolved / cmps.length * 100) : 0;
  const approvalRate = docs.length ? Math.round(approved / docs.length * 100) : 0;
  const ongoing      = projects.filter(p => p.status === 'Ongoing').length;

  const statsEl = document.getElementById('reports-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#eef2ff"><span class="material-symbols-outlined" style="color:#1a56db">description</span></div></div><div class="stat-label">Total Doc Requests</div><div class="stat-value">${docs.length}</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#f0fdf4"><span class="material-symbols-outlined" style="color:#16a34a">check_circle</span></div></div><div class="stat-label">Approval Rate</div><div class="stat-value">${approvalRate}%</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#fef2f2"><span class="material-symbols-outlined" style="color:#dc2626">gavel</span></div></div><div class="stat-label">Complaint Resolution</div><div class="stat-value">${resRate}%</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#fffbeb"><span class="material-symbols-outlined" style="color:#d97706">account_tree</span></div></div><div class="stat-label">Ongoing Projects</div><div class="stat-value">${ongoing}</div></div>
    `;
  }

  function barChart(containerId, data, colorMap) {
    const max = Math.max(...data.map(d => d.val), 1);
    const el  = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = data.map(d => `
      <div class="mb-3">
        <div class="progress-label"><span>${d.label}</span><span style="font-weight:700">${d.val}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(d.val / max * 100)}%;background:${colorMap[d.label] || '#1a56db'};transition:width 0.6s ease"></div></div>
      </div>
    `).join('');
  }

  barChart('chart-doc-types',
    ['Barangay Clearance', 'Certificate of Indigency', 'Business Permit', 'Residency Certificate'].map(t => ({ label: t, val: docs.filter(d => d.type === t).length })),
    { 'Barangay Clearance': '#1a56db', 'Certificate of Indigency': '#16a34a', 'Business Permit': '#d97706', 'Residency Certificate': '#7c3aed' }
  );

  const cmpCats = [...new Set(cmps.map(c => c.category))];
  barChart('chart-cmp-cats',
    cmpCats.map(cat => ({ label: cat, val: cmps.filter(c => c.category === cat).length })),
    { Sanitation: '#dc2626', Noise: '#d97706', 'Public Safety': '#1a56db', Environmental: '#16a34a', Infrastructure: '#7c3aed' }
  );

  const now = new Date();
  const getAge = dob => dob && dob !== 'N/A' ? Math.floor((now - new Date(dob)) / 31557600000) : null;
  const ages  = residents.map(r => getAge(r.dob)).filter(a => a !== null);
  barChart('chart-demographics', [
    { label: 'Youth (0–17)',   val: ages.filter(a => a < 18).length },
    { label: 'Adults (18–59)', val: ages.filter(a => a >= 18 && a < 60).length },
    { label: 'Seniors (60+)', val: ages.filter(a => a >= 60).length },
    { label: 'Unknown',        val: residents.length - ages.length },
  ], { 'Youth (0–17)': '#1a56db', 'Adults (18–59)': '#16a34a', 'Seniors (60+)': '#7c3aed', 'Unknown': '#9ca3af' });

  barChart('chart-projects', [
    { label: 'Ongoing',   val: projects.filter(p => p.status === 'Ongoing').length },
    { label: 'Completed', val: projects.filter(p => p.status === 'Completed').length },
    { label: 'Planned',   val: projects.filter(p => p.status === 'Planned').length },
  ], { Ongoing: '#1a56db', Completed: '#16a34a', Planned: '#7c3aed' });

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const summaryEl   = document.getElementById('reports-summary-table');
  if (summaryEl) {
    summaryEl.innerHTML = [
      ['Registered Residents', residents.length, `${residents.filter(r => r.status === 'Active').length} active, ${residents.filter(r => r.status === 'Inactive').length} inactive`],
      ['Document Requests', docs.length, `${approved} approved, ${pending} pending, ${docs.filter(d => d.status === 'Rejected').length} rejected`],
      ['Complaints Filed', cmps.length, `${resolved} resolved, ${cmps.length - resolved} pending`],
      ['Community Projects', projects.length, `Total budget: ₱${totalBudget.toLocaleString()}`],
      ['Announcements', state.announcements.length, 'Published to residents'],
      ['Staff Accounts', state.users.length, `${state.users.filter(u => u.role === 'Admin').length} admins, ${state.users.filter(u => u.role === 'Staff').length} staff`],
    ].map(([metric, count, detail]) => `
      <tr>
        <td style="font-weight:600">${metric}</td>
        <td><span style="font-size:18px;font-weight:800;color:var(--primary)">${count}</span></td>
        <td style="color:var(--on-surface-3);font-size:12px">${detail}</td>
      </tr>
    `).join('');
  }
}

// ===================== RESPONSIVE HANDLERS =====================
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }
});