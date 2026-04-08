// ===================== STATE =====================
const SESSION_KEY = 'pl_session';

let state = {
    session: null,
    residents: [],
    documents: [],
    complaints: [],
    projects: [],
    announcements: [],
    users: [],
    suggestions: [],
    volunteers: [],
    polls: [],
    complaintFilter: 'all',
    annFilter: 'all',
    annSort: 'newest',
    communityTab: 'suggestions',
    confirmCallback: null,
    pagination: { residents: 1, documents: 1, complaints: 1, suggestions: 1, volunteers: 1 },
    perPage: 8,
    selectedDocuments: new Set(),
    selectedComplaints: new Set(),
    sessionTimeout: null,
    docDateFrom: '',
    docDateTo: '',
};

// ===================== SUPABASE DB HELPERS =====================
// These call the functions defined in supabase-config.js (dbFetch, dbInsert, dbUpdate, dbDelete)

async function sbLoadAll() {
    try {
        const [users, residents, documents, complaints, projects, announcements, suggestions, volunteers, polls] = await Promise.all([
            dbFetch('users'),
            dbFetch('residents'),
            dbFetch('documents'),
            dbFetch('complaints'),
            dbFetch('projects'),
            dbFetch('announcements'),
            dbFetch('suggestions'),
            dbFetch('volunteer_signups'),
            dbFetch('polls'),
        ]);
        state.users = users || [];
        state.residents = residents || [];
        state.documents = documents || [];
        state.complaints = complaints || [];
        state.projects = projects || [];
        state.announcements = announcements || [];
        state.suggestions = suggestions || [];
        state.volunteers = volunteers || [];
        state.polls = polls || [];
        console.log('✅ All data loaded from Supabase');
    } catch (err) {
        console.warn('⚠️ Supabase load failed, offline mode:', err.message);
        throw new Error('offline');
    }
}

// ===================== AUTH =====================
async function login() {
    const loginInput = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    if (!loginInput || !password) {
        errorEl.textContent = 'Please enter your username/email and password.';
        return;
    }

    // Show loading state
    const btn = document.getElementById('login-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

    try {
        const authData = await sbAuthenticateUser(loginInput, password);
        const user = authData.user;

        if (user.status === 'Suspended') {
            errorEl.textContent = 'Your account has been suspended. Contact the administrator.';
            if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
            return;
        }

        // Load all data from Supabase before showing the app
        try {
            await sbLoadAll();
        } catch (e) {
            // offline fallback — continue with empty state, user still logged in
            console.warn('Offline: proceeding with empty state');
        }

        state.session = { ...user };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session));

        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        initApp();
        startSessionTimeout();
    } catch (error) {
        errorEl.textContent = error.message || 'Invalid username or password.';
        if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
    }
}

function logout() {
    clearSessionTimeout();
    sessionStorage.removeItem(SESSION_KEY);
    state.session = null;
    state.users = [];
    state.residents = [];
    state.documents = [];
    state.complaints = [];
    state.projects = [];
    state.announcements = [];
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    const emailEl = document.getElementById('login-email');
    const pwEl = document.getElementById('login-password');
    if (emailEl) emailEl.value = '';
    if (pwEl) pwEl.value = '';
}

function togglePw() {
    const inp = document.getElementById('login-password');
    const eye = document.getElementById('pw-eye');
    if (inp.type === 'password') { inp.type = 'text'; eye.textContent = 'visibility_off'; }
    else { inp.type = 'password'; eye.textContent = 'visibility'; }
}

// ===================== SESSION TIMEOUT =====================
const SESSION_DURATION_MS = 30 * 60 * 1000;
const SESSION_WARNING_MS = 25 * 60 * 1000;
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
    // Community Badges
    const pendingSug = state.suggestions.filter(s => s.status === 'pending').length;
    const pendingVol = state.volunteers.filter(v => v.status === 'pending').length;
    const totalCom = pendingSug + pendingVol;

    const bd = document.getElementById('badge-documents');
    const bc = document.getElementById('badge-complaints');
    const br = document.getElementById('badge-residents');
    const bcom = document.getElementById('badge-community');

    if (bd) { bd.textContent = pending || ''; bd.style.display = pending ? 'inline' : 'none'; }
    if (bc) { bc.textContent = activeCmp || ''; bc.style.display = activeCmp ? 'inline' : 'none'; }
    if (br) { br.style.display = 'none'; }
    if (bcom) { bcom.textContent = totalCom || ''; bcom.style.display = totalCom ? 'inline' : 'none'; }
}

// ===================== NAVIGATION =====================
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.textContent.trim().toLowerCase().startsWith(page === 'dashboard' ? 'dash' : page.slice(0, 4)))
            btn.classList.add('active');
    });
    closeAllDropdowns();
    state.selectedDocuments.clear();
    state.selectedComplaints.clear();
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
        case 'community': renderCommunityHub(); break;
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
    if (!recent.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:24px;color:var(--on-surface-3)">No recent requests</td></tr>';
        return;
    }
    tbody.innerHTML = recent.map(d => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="av av-sm" style="background:${avatarColor(d.resident)};color:white">${initials(d.resident)}</div><span>${d.resident}</span></div></td>
      <td><span style="font-size:12px">${d.type}</span></td>
      <td style="color:var(--on-surface-3);font-size:12px">${formatDate(d.date)}</td>
      <td>${statusBadge(d.status)}</td>
      <td><div class="tbl-actions">${d.status === 'Pending'
            ? `<button class="tbl-btn" onclick="approveDoc('${d.id}')" title="Approve"><span class="material-symbols-outlined">check_circle</span></button>
           <button class="tbl-btn danger" onclick="rejectDoc('${d.id}')" title="Reject"><span class="material-symbols-outlined">cancel</span></button>`
            : ''}</div></td>
    </tr>
  `).join('');
}

// ===================== RESIDENTS =====================
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
        <td><div style="display:flex;align-items:center;gap:10px">
          <div class="av" style="background:${avatarColor(`${r.fname} ${r.lname}`)};color:white;font-size:11px">${initials(`${r.fname} ${r.lname}`)}</div>
          <div><div style="font-weight:700;font-size:13px">${r.lname}, ${r.fname}</div><div style="font-size:11px;color:var(--on-surface-3)">Since ${r.registered}</div></div>
        </div></td>
        <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--on-surface-3)">${r.id}</td>
        <td>${r.purok}</td>
        <td style="font-size:12px;color:var(--on-surface-3)">${r.contact}</td>
        <td>${r.status === 'Active'
                ? '<span class="badge badge-active"><span class="badge-dot"></span>Active</span>'
                : '<span class="badge badge-inactive"><span class="badge-dot"></span>Inactive</span>'}</td>
        <td style="font-size:12px;color:var(--on-surface-3)">${r.registered}</td>
        <td><div class="tbl-actions">
          <button class="tbl-btn view"   onclick="openResidentPanel('${r.id}')"  title="View Profile"><span class="material-symbols-outlined">person</span></button>
          <button class="tbl-btn"        onclick="printResidentProfile('${r.id}')" title="Print"><span class="material-symbols-outlined">print</span></button>
          <button class="tbl-btn"        onclick="editResident('${r.id}')"        title="Edit"><span class="material-symbols-outlined">edit</span></button>
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
        ${['Male', 'Female', 'Other', 'N/A'].map(g => `<option ${r.gender === g ? 'selected' : ''}>${g}</option>`).join('')}
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
    document.getElementById('edit-modal-save').onclick = async () => {
        const updated = {
            fname: val('er-fname'),
            lname: val('er-lname'),
            contact: val('er-contact'),
            purok: val('er-purok'),
            status: val('er-status'),
            address: val('er-address'),
            gender: val('er-gender'),
            dob: val('er-dob') || 'N/A',
            notes: val('er-notes'),
        };
        try {
            await dbUpdate('residents', id, updated);
            Object.assign(r, updated);
            closeModal('edit-modal');
            renderResidents();
            toast('Resident updated successfully', 'success');
        } catch (err) {
            toast('Failed to update resident: ' + err.message, 'error');
        }
    };
    openModal('edit-modal');
}

async function deleteResident(id) {
    try {
        await dbDelete('residents', id);
        state.residents = state.residents.filter(r => r.id !== id);
        renderResidents();
        closeModal('confirm-modal');
        toast('Resident deleted', 'info');
    } catch (err) {
        toast('Failed to delete resident: ' + err.message, 'error');
    }
}

async function submitResident() {
    const fname = val('res-fname'), lname = val('res-lname'), purok = val('res-purok');
    if (!fname || !lname || !purok) { toast('Please fill required fields', 'error'); return; }
    try {
        const id = await dbGenerateId('residents', 'PAY');
        // PAY prefix needs 6-digit padding
        const paddedId = 'PAY-' + String(parseInt(id.split('-').pop(), 10)).padStart(6, '0');
        const row = {
            id: paddedId, fname, lname, purok,
            contact: val('res-contact') || 'N/A',
            status: 'Active',
            registered: new Date().getFullYear().toString(),
            address: val('res-address') || 'Barangay Payatas',
            gender: val('res-gender') || 'N/A',
            dob: val('res-dob') || 'N/A',
            notes: val('res-notes'),
        };
        const inserted = await dbInsert('residents', row);
        state.residents.push(inserted[0] || row);
        closeModal('add-resident-modal');
        ['res-fname', 'res-lname', 'res-contact', 'res-purok', 'res-address', 'res-notes', 'res-dob'].forEach(clearField);
        toast(`Resident ${fname} ${lname} added!`, 'success');
        addNotification('New Resident Added', `${fname} ${lname} registered in ${purok}`, 'person');
        updateBadges(); updateDashboard();
        if (document.getElementById('page-residents').classList.contains('active')) renderResidents();
    } catch (err) {
        toast('Failed to add resident: ' + err.message, 'error');
    }
}

function printResidentProfile(id) {
    const r = state.residents.find(x => x.id === id);
    if (!r) return;
    const fullName = `${r.fname} ${r.lname}`;
    const age = r.dob && r.dob !== 'N/A' ? Math.floor((new Date() - new Date(r.dob)) / 31557600000) + ' years old' : 'N/A';
    const docs = state.documents.filter(d => d.resident.toLowerCase().includes(r.fname.toLowerCase()) || d.resident.toLowerCase().includes(r.lname.toLowerCase()));
    const cmps = state.complaints.filter(c => c.complainant.toLowerCase().includes(r.fname.toLowerCase()) || c.complainant.toLowerCase().includes(r.lname.toLowerCase()));
    const w = window.open('', '_blank', 'width=750,height=1000');
    w.document.write(`<!DOCTYPE html><html><head>
    <title>Resident Profile — ${fullName}</title>
    <style>
      body{font-family:Georgia,serif;margin:0;padding:40px;color:#111;font-size:13px}
      .header{text-align:center;border-bottom:3px double #1a56db;padding-bottom:20px;margin-bottom:24px}
      .header h1{font-size:20px;color:#1a56db;margin:0 0 4px}.header p{font-size:11px;color:#555;margin:0}
      h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin:20px 0 12px;color:#1a56db}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
      .field{background:#f9fafb;border-radius:6px;padding:8px 12px}
      .field .lbl{font-size:10px;font-weight:bold;text-transform:uppercase;color:#888;margin-bottom:2px}
      .field .v{font-size:13px;font-weight:600}
      .doc-row,.cmp-row{display:flex;justify-content:space-between;padding:7px 10px;background:#f9fafb;border-radius:6px;margin-bottom:5px;font-size:12px}
      .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700}
      .b-active{background:#f0fdf4;color:#16a34a}.b-inactive{background:#f1f5f9;color:#64748b}
      .b-approved{background:#f0fdf4;color:#16a34a}.b-pending{background:#fffbeb;color:#d97706}.b-rejected{background:#fef2f2;color:#dc2626}
      .footer{margin-top:60px;display:flex;justify-content:space-between;font-size:11px}
      .sig{text-align:center}.sig-line{width:180px;border-top:1px solid #111;margin:40px auto 4px}
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
    ${docs.length ? docs.map(d => `<div class="doc-row"><div><strong>${d.type}</strong><span style="color:#888;margin-left:8px;font-family:monospace;font-size:11px">${d.ref}</span></div><div style="display:flex;gap:8px;align-items:center"><span style="color:#888">${formatDate(d.date)}</span><span class="badge ${d.status === 'Approved' ? 'b-approved' : d.status === 'Pending' ? 'b-pending' : 'b-rejected'}">${d.status}</span></div></div>`).join('') : '<p style="color:#888;font-size:12px">No document requests on record.</p>'}
    <h2>Complaint History (${cmps.length})</h2>
    ${cmps.length ? cmps.map(c => `<div class="cmp-row"><div><strong>${c.category}</strong> — <span style="color:#888">${c.id}</span><div style="color:#888;font-size:11px">${c.desc.slice(0, 80)}...</div></div><span class="badge ${c.status === 'Resolved' ? 'b-approved' : 'b-pending'}">${c.status}</span></div>`).join('') : '<p style="color:#888;font-size:12px">No complaints on record.</p>'}
    <div class="footer">
      <div class="sig"><div class="sig-line"></div><div>Barangay Captain</div></div>
      <div class="sig"><div class="sig-line"></div><div>Secretary / Records Officer</div></div>
    </div>
    <div class="watermark">OFFICIAL DOCUMENT — BARANGAY PAYATAS · PAYATAS LEDGER v3.0.0 · Printed: ${new Date().toLocaleString('en-PH')}</div>
  </body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 500);
}

// ===================== DOCUMENTS =====================
function injectDocDateFilters() {
    if (document.getElementById('docs-date-from')) return;
    // Find the filter bar on the documents page
    const docPage = document.getElementById('page-documents');
    if (!docPage) return;
    const filterBar = docPage.querySelector('.filter-bar');
    if (!filterBar) return;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
    wrap.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--on-surface-3)">
      <span>From</span>
      <input type="date" id="docs-date-from" style="font-size:12px;padding:4px 8px;border:1px solid var(--outline);border-radius:6px;background:var(--surface)" oninput="onDocDateFilter()"/>
      <span>To</span>
      <input type="date" id="docs-date-to" style="font-size:12px;padding:4px 8px;border:1px solid var(--outline);border-radius:6px;background:var(--surface)" oninput="onDocDateFilter()"/>
      <button class="tbl-btn" onclick="clearDocDateFilter()" style="padding:4px 8px;font-size:11px">Clear</button>
    </div>
  `;
    filterBar.appendChild(wrap);
}

function onDocDateFilter() {
    state.docDateFrom = val('docs-date-from');
    state.docDateTo = val('docs-date-to');
    state.pagination.documents = 1;
    renderDocuments();
}

function clearDocDateFilter() {
    state.docDateFrom = ''; state.docDateTo = '';
    const f = document.getElementById('docs-date-from');
    const t = document.getElementById('docs-date-to');
    if (f) f.value = ''; if (t) t.value = '';
    state.pagination.documents = 1;
    renderDocuments();
}

function renderDocuments() {
    injectDocDateFilters();
    const search = val('docs-search').toLowerCase();
    const typeF = val('docs-type');
    const statusF = val('docs-status');
    let data = state.documents.filter(d => {
        if (search && !d.resident.toLowerCase().includes(search) && !d.ref.toLowerCase().includes(search)) return false;
        if (typeF && d.type !== typeF) return false;
        if (statusF && d.status !== statusF) return false;
        if (state.docDateFrom && d.date < state.docDateFrom) return false;
        if (state.docDateTo && d.date > state.docDateTo) return false;
        return true;
    });
    renderDocBulkBar(data);
    const page = state.pagination.documents;
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
          <button class="tbl-btn view"   onclick="openDocPanel('${d.id}')" title="View & Edit"><span class="material-symbols-outlined">open_in_new</span></button>
          ${d.status === 'Pending'
                ? `<button class="tbl-btn" onclick="approveDoc('${d.id}')" title="Approve"><span class="material-symbols-outlined">check_circle</span></button>
               <button class="tbl-btn danger" onclick="rejectDoc('${d.id}')" title="Reject"><span class="material-symbols-outlined">cancel</span></button>`
                : ''}
          <button class="tbl-btn danger" onclick="confirmDelete('Document Request','Delete this document request?',()=>deleteDoc('${d.id}'))" title="Delete"><span class="material-symbols-outlined">delete</span></button>
        </div></td>
      </tr>
    `).join('');
    }
    renderPagination('documents', total, page, 'renderDocuments');
}

function toggleDocSelection(id, checked) {
    if (checked) state.selectedDocuments.add(id);
    else state.selectedDocuments.delete(id);
    renderDocBulkBar();
}

function renderDocBulkBar() {
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
    <button class="tbl-btn bulk" onclick="bulkApproveDocuments()" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;"><span class="material-symbols-outlined" style="font-size:15px">check_circle</span> Approve All</button>
    <button class="tbl-btn bulk danger" onclick="bulkRejectDocuments()" style="background:#fef2f2;"><span class="material-symbols-outlined" style="font-size:15px">cancel</span> Reject All</button>
    <button class="tbl-btn bulk danger" onclick="bulkDeleteDocuments()"><span class="material-symbols-outlined" style="font-size:15px">delete</span> Delete</button>
    <button class="tbl-btn bulk" onclick="clearDocSelection()">Clear</button>
  `;
}

function clearDocSelection() { state.selectedDocuments.clear(); renderDocuments(); }

async function bulkApproveDocuments() {
    const ids = [...state.selectedDocuments];
    for (const id of ids) {
        const d = state.documents.find(x => x.id === id);
        if (d && d.status === 'Pending') {
            try {
                const remarks = 'please proceed to the main office claim it the clearance.';
                await dbUpdate('documents', id, { status: 'Approved', remarks });
                d.status = 'Approved';
                d.remarks = remarks;
                addNotification('Document Approved', `${d.type} for ${d.resident} approved`, 'success');
            } catch (err) { console.warn('Bulk approve error:', err.message); }
        }
    }
    state.selectedDocuments.clear();
    updateBadges(); updateDashboard(); renderDocuments(); renderDashboardDocs();
    toast('Selected documents approved!', 'success');
}

async function bulkRejectDocuments() {
    const ids = [...state.selectedDocuments];
    for (const id of ids) {
        const d = state.documents.find(x => x.id === id);
        if (d && d.status === 'Pending') {
            try {
                const remarks = 'please proceed to the main office for assist for concerns.';
                await dbUpdate('documents', id, { status: 'Rejected', remarks });
                d.status = 'Rejected';
                d.remarks = remarks;
                addNotification('Document Rejected', `${d.type} for ${d.resident} rejected`, 'warning');
            } catch (err) { console.warn('Bulk reject error:', err.message); }
        }
    }
    state.selectedDocuments.clear();
    updateBadges(); updateDashboard(); renderDocuments(); renderDashboardDocs();
    toast('Selected documents rejected', 'info');
}

async function bulkDeleteDocuments() {
    const count = state.selectedDocuments.size;
    confirmDelete('Selected Documents', `Delete ${count} document request(s)? This cannot be undone.`, async () => {
        const ids = [...state.selectedDocuments];
        for (const id of ids) {
            try {
                await dbDelete('documents', id);
                state.documents = state.documents.filter(d => d.id !== id);
            } catch (err) { console.warn('Bulk delete doc error:', err.message); }
        }
        state.selectedDocuments.clear();
        closeModal('confirm-modal');
        updateBadges(); updateDashboard(); renderDocuments(); renderDashboardDocs();
        toast(`${count} document(s) deleted`, 'info');
    });
}

async function approveDoc(id) {
    const d = state.documents.find(x => x.id === id);
    if (!d) return;
    try {
        const remarks = 'please proceed to the main office claim it the clearance';
        await dbUpdate('documents', id, { status: 'Approved', remarks });
        d.status = 'Approved';
        d.remarks = remarks;
        updateBadges(); updateDashboard(); renderDocuments(); renderDashboardDocs();
        toast('Request approved!', 'success');
        addNotification('Document Approved', `${d.type} for ${d.resident} has been approved`, 'success');
    } catch (err) { toast('Failed to approve: ' + err.message, 'error'); }
}

async function rejectDoc(id) {
    const d = state.documents.find(x => x.id === id);
    if (!d) return;
    try {
        const remarks = 'please proceed to the main office for assist for concerns.';
        await dbUpdate('documents', id, { status: 'Rejected', remarks });
        d.status = 'Rejected';
        d.remarks = remarks;
        updateBadges(); updateDashboard(); renderDocuments(); renderDashboardDocs();
        toast('Request rejected', 'info');
        addNotification('Document Rejected', `${d.type} for ${d.resident} was rejected`, 'warning');
    } catch (err) { toast('Failed to reject: ' + err.message, 'error'); }
}

async function deleteDoc(id) {
    try {
        await dbDelete('documents', id);
        state.documents = state.documents.filter(d => d.id !== id);
        closeModal('confirm-modal');
        renderDocuments(); renderDashboardDocs(); updateBadges(); updateDashboard();
        toast('Request deleted', 'info');
    } catch (err) { toast('Failed to delete: ' + err.message, 'error'); }
}

async function submitRequest() {
    const name = val('req-name'), type = val('req-type');
    if (!name || !type) { toast('Please fill required fields', 'error'); return; }
    try {
        const id = await dbGenerateId('documents', 'DOC');
        const num = id.split('-').pop();
        const ref = 'PAY-' + new Date().getFullYear() + '-' + num;
        const row = { id, resident: name, type, date: today(), status: 'Pending', ref, purpose: val('req-purpose'), contact: val('req-contact') };
        const inserted = await dbInsert('documents', row);
        state.documents.push(inserted[0] || row);
        closeModal('new-request-modal');
        ['req-name', 'req-contact', 'req-type', 'req-purpose'].forEach(clearField);
        toast(`Document request submitted for ${name}`, 'success');
        addNotification('New Document Request', `${name} requested a ${type}`, 'doc');
        updateBadges(); updateDashboard();
        if (document.getElementById('page-documents').classList.contains('active')) renderDocuments();
    } catch (err) { toast('Failed to submit request: ' + err.message, 'error'); }
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
        const total = state.complaints.length;
        const urgent = state.complaints.filter(c => c.priority === 'High' && c.status === 'Pending').length;
        const resolved = state.complaints.filter(c => c.status === 'Resolved').length;
        const rate = total ? Math.round(resolved / total * 100) : 0;
        statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-top"><div class="stat-icon" style="background:#eef2ff"><span class="material-symbols-outlined" style="color:#1a56db">inbox</span></div></div><div class="stat-label">Total Cases</div><div class="stat-value">${total}</div></div>
      <div class="stat-card" style="border-left:3px solid var(--error)"><div class="stat-top"><div class="stat-icon" style="background:var(--error-light)"><span class="material-symbols-outlined" style="color:var(--error)">priority_high</span></div></div><div class="stat-label" style="color:var(--error)">Urgent</div><div class="stat-value">${urgent}</div></div>
      <div class="stat-card" style="border-left:3px solid var(--success)"><div class="stat-top"><div class="stat-icon" style="background:var(--success-light)"><span class="material-symbols-outlined" style="color:var(--success)">analytics</span></div></div><div class="stat-label">Resolution Rate</div><div class="stat-value">${rate}%</div></div>
    `;
    }
    renderComplaintBulkBar();
    const page = state.pagination.complaints;
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
        <td>${c.status === 'Resolved'
                ? '<span class="badge badge-approved"><span class="badge-dot"></span>Resolved</span>'
                : '<span class="badge badge-urgent"><span class="badge-dot"></span>Pending</span>'}</td>
        <td><div class="tbl-actions">
          ${c.status !== 'Resolved' ? `<button class="tbl-btn" onclick="resolveComplaint('${c.id}')" title="Mark Resolved"><span class="material-symbols-outlined">check_circle</span></button>` : ''}
          <button class="tbl-btn"        onclick="viewComplaint('${c.id}')"   title="View"><span class="material-symbols-outlined">open_in_new</span></button>
          <button class="tbl-btn"        onclick="editComplaint('${c.id}')"   title="Edit"><span class="material-symbols-outlined">edit</span></button>
          <button class="tbl-btn danger" onclick="confirmDelete('Complaint','Delete this complaint record?',()=>deleteComplaint('${c.id}'))" title="Delete"><span class="material-symbols-outlined">delete</span></button>
        </div></td>
      </tr>
    `).join('');
    }
    renderPagination('complaints', total, page, 'renderComplaints');
}

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
    <button class="tbl-btn bulk" onclick="bulkResolveComplaints()" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;"><span class="material-symbols-outlined" style="font-size:15px">check_circle</span> Resolve All</button>
    <button class="tbl-btn bulk danger" onclick="bulkDeleteComplaints()"><span class="material-symbols-outlined" style="font-size:15px">delete</span> Delete</button>
    <button class="tbl-btn bulk" onclick="clearComplaintSelection()">Clear</button>
  `;
}

function clearComplaintSelection() { state.selectedComplaints.clear(); renderComplaints(); }

async function bulkResolveComplaints() {
    const ids = [...state.selectedComplaints];
    for (const id of ids) {
        const c = state.complaints.find(x => x.id === id);
        if (c && c.status !== 'Resolved') {
            try {
                await dbUpdate('complaints', id, { status: 'Resolved' });
                c.status = 'Resolved';
                addNotification('Complaint Resolved', `${c.category} complaint by ${c.complainant} marked resolved`, 'success');
            } catch (err) { console.warn('Bulk resolve error:', err.message); }
        }
    }
    state.selectedComplaints.clear();
    renderComplaints(); updateBadges(); updateDashboard();
    toast('Selected complaints resolved!', 'success');
}

async function bulkDeleteComplaints() {
    const count = state.selectedComplaints.size;
    confirmDelete('Selected Complaints', `Delete ${count} complaint(s)? This cannot be undone.`, async () => {
        const ids = [...state.selectedComplaints];
        for (const id of ids) {
            try {
                await dbDelete('complaints', id);
                state.complaints = state.complaints.filter(c => c.id !== id);
            } catch (err) { console.warn('Bulk delete complaint error:', err.message); }
        }
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

async function resolveComplaint(id) {
    const c = state.complaints.find(x => x.id === id);
    if (!c) return;
    try {
        await dbUpdate('complaints', id, { status: 'Resolved' });
        c.status = 'Resolved';
        renderComplaints(); updateBadges(); updateDashboard();
        toast('Complaint marked as resolved', 'success');
        addNotification('Complaint Resolved', `${c.category} complaint by ${c.complainant} marked resolved`, 'success');
    } catch (err) { toast('Failed to resolve: ' + err.message, 'error'); }
}

function viewComplaint(id) {
    const c = state.complaints.find(x => x.id === id);
    if (!c) return;
    document.getElementById('edit-modal-title').textContent = `Complaint ${c.id}`;
    document.getElementById('edit-modal-body').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;gap:8px">${priorityBadge(c.priority)}${c.status === 'Resolved'
            ? '<span class="badge badge-approved"><span class="badge-dot"></span>Resolved</span>'
            : '<span class="badge badge-urgent"><span class="badge-dot"></span>Pending</span>'}</div>
      <div><div class="text-sm text-muted">Complainant</div><div class="font-bold">${c.complainant}</div></div>
      <div><div class="text-sm text-muted">Category</div><div>${c.category}</div></div>
      <div><div class="text-sm text-muted">Date Filed</div><div>${formatDate(c.date)}</div></div>
      <div><div class="text-sm text-muted">Description</div><div style="background:var(--surface);border-radius:8px;padding:12px;font-size:13px;line-height:1.6">${c.desc}</div></div>
    </div>
  `;
    document.getElementById('edit-modal-save').textContent = c.status !== 'Resolved' ? 'Mark as Resolved' : 'Close';
    document.getElementById('edit-modal-save').onclick = c.status !== 'Resolved'
        ? () => { resolveComplaint(c.id); closeModal('edit-modal'); }
        : () => closeModal('edit-modal');
    openModal('edit-modal');
}

function editComplaint(id) {
    const c = state.complaints.find(x => x.id === id);
    if (!c) return;
    document.getElementById('edit-modal-title').textContent = `Edit Complaint ${c.id}`;
    document.getElementById('edit-modal-body').innerHTML = `
    <div class="form-group"><label>Complainant Name</label><input id="ec-name" value="${c.complainant}"/></div>
    <div class="form-grid-2">
      <div class="form-group"><label>Category</label><select id="ec-cat">
        ${['Sanitation', 'Noise', 'Public Safety', 'Infrastructure', 'Environmental', 'Other'].map(ct => `<option ${c.category === ct ? 'selected' : ''}>${ct}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Priority</label><select id="ec-priority">
        ${['High', 'Medium', 'Low'].map(p => `<option ${c.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Status</label><select id="ec-status">
        <option ${c.status === 'Pending' ? 'selected' : ''}>Pending</option>
        <option ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
      </select></div>
    </div>
    <div class="form-group"><label>Description</label><textarea id="ec-desc" style="min-height:90px">${c.desc}</textarea></div>
  `;
    document.getElementById('edit-modal-save').textContent = 'Save Changes';
    document.getElementById('edit-modal-save').onclick = async () => {
        const updated = {
            complainant: val('ec-name') || c.complainant,
            category: val('ec-cat'),
            priority: val('ec-priority'),
            status: val('ec-status'),
            description: val('ec-desc') || c.desc,
        };
        try {
            await dbUpdate('complaints', id, updated);
            Object.assign(c, { ...updated, desc: updated.description });
            closeModal('edit-modal');
            renderComplaints(); updateBadges(); updateDashboard();
            toast('Complaint updated!', 'success');
        } catch (err) { toast('Failed to update: ' + err.message, 'error'); }
    };
    openModal('edit-modal');
}

async function deleteComplaint(id) {
    try {
        await dbDelete('complaints', id);
        state.complaints = state.complaints.filter(c => c.id !== id);
        closeModal('confirm-modal');
        renderComplaints(); updateBadges(); updateDashboard();
        toast('Complaint deleted', 'info');
    } catch (err) { toast('Failed to delete: ' + err.message, 'error'); }
}

async function submitComplaint() {
    const name = val('cmp-name'), cat = val('cmp-cat'), desc = val('cmp-desc');
    if (!name || !cat || !desc) { toast('Please fill required fields', 'error'); return; }
    try {
        const id = await dbGenerateId('complaints', 'CMP');
        const row = { id, complainant: name, category: cat, priority: val('cmp-priority') || 'Medium', status: 'Pending', date: today(), description: desc };
        const inserted = await dbInsert('complaints', row);
        // dbInsert already maps description -> desc for complaints
        const local = { ...(inserted[0] || row), desc: desc };
        state.complaints.push(local);
        closeModal('new-complaint-modal');
        ['cmp-name', 'cmp-cat', 'cmp-desc'].forEach(clearField);
        toast('Complaint filed successfully!', 'success');
        addNotification('New Complaint Filed', `${name} filed a ${cat} complaint`, 'complaint');
        updateBadges(); updateDashboard();
        if (document.getElementById('page-complaints').classList.contains('active')) renderComplaints();
    } catch (err) { toast('Failed to submit complaint: ' + err.message, 'error'); }
}

// ===================== PROJECTS =====================
const catColors = { Infrastructure: '#1a56db', Healthcare: '#16a34a', Education: '#7c3aed', Environment: '#0891b2', 'Public Safety': '#d97706', Sanitation: '#dc2626' };
const catBg = { Infrastructure: '#eef2ff', Healthcare: '#f0fdf4', Education: '#f5f3ff', Environment: '#ecfeff', 'Public Safety': '#fffbeb', Sanitation: '#fef2f2' };

function renderProjects() {
    const statsEl = document.getElementById('projects-stats');
    if (statsEl) {
        const budget = state.projects.reduce((s, p) => s + p.budget, 0);
        const ongoing = state.projects.filter(p => p.status === 'Ongoing').length;
        const completed = state.projects.filter(p => p.status === 'Completed').length;
        const planned = state.projects.filter(p => p.status === 'Planned').length;
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
        const color = catColors[p.category] || '#1a56db';
        const bg = catBg[p.category] || '#eef2ff';
        const pct = Math.min(100, Math.max(0, p.progress));
        const fillClass = p.status === 'Completed' ? 'fill-success' : pct < 40 ? 'fill-error' : 'fill-primary';
        const statusColor = p.status === 'Completed' ? '#16a34a' : p.status === 'Ongoing' ? '#1a56db' : '#7c3aed';
        const desc = p.desc || p.description || '';
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
            <span style="font-size:11px;color:var(--on-surface-3)">${desc.slice(0, 50)}...</span>
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
    const desc = p.desc || p.description || '';
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
    <div class="form-group"><label>Description</label><textarea id="ep-desc">${desc}</textarea></div>
  `;
    document.getElementById('edit-modal-save').onclick = async () => {
        const updated = {
            title: val('ep-title'),
            category: val('ep-cat'),
            status: val('ep-status'),
            budget: Number(val('ep-budget')),
            progress: Number(val('ep-progress')),
            description: val('ep-desc'),
        };
        try {
            await dbUpdate('projects', id, updated);
            Object.assign(p, { ...updated, desc: updated.description });
            closeModal('edit-modal');
            renderProjects();
            toast('Project updated!', 'success');
        } catch (err) { toast('Failed to update project: ' + err.message, 'error'); }
    };
    openModal('edit-modal');
}

async function deleteProject(id) {
    try {
        await dbDelete('projects', id);
        state.projects = state.projects.filter(p => p.id !== id);
        closeModal('confirm-modal');
        renderProjects(); updateDashboard();
        toast('Project deleted', 'info');
    } catch (err) { toast('Failed to delete project: ' + err.message, 'error'); }
}

async function submitProject() {
    const title = val('proj-title'), cat = val('proj-cat');
    if (!title || !cat) { toast('Please fill required fields', 'error'); return; }
    try {
        const id = await dbGenerateId('projects', 'PRJ');
        const row = { id, title, category: cat, status: val('proj-status'), budget: Number(val('proj-budget')) || 0, progress: Number(val('proj-progress')) || 0, description: val('proj-desc') || '' };
        const inserted = await dbInsert('projects', row);
        const local = { ...(inserted[0] || row), desc: row.description };
        state.projects.push(local);
        closeModal('new-project-modal');
        ['proj-title', 'proj-cat', 'proj-budget', 'proj-progress', 'proj-desc'].forEach(clearField);
        toast(`Project "${title}" created!`, 'success');
        addNotification('New Project Created', `"${title}" added to community projects`, 'info');
        updateDashboard();
        if (document.getElementById('page-projects').classList.contains('active')) renderProjects();
    } catch (err) { toast('Failed to create project: ' + err.message, 'error'); }
}

// ===================== ANNOUNCEMENTS =====================
function setAnnSort(sort, btn) {
    state.annSort = sort;
    document.querySelectorAll('#ann-sort-bar .chip').forEach(b => { b.className = b === btn ? 'chip chip-active' : 'chip chip-inactive'; });
    renderAnnouncements();
}

function renderAnnouncements() {
    const grid = document.getElementById('announcements-grid');
    if (!grid) return;
    let filtered = state.annFilter === 'all' ? [...state.announcements] : state.announcements.filter(a => a.category === state.annFilter);
    filtered.sort((a, b) => state.annSort === 'oldest' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date));
    if (!filtered.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon"><span class="material-symbols-outlined">campaign</span></div><h4>No announcements</h4><p>Publish your first announcement</p></div>`;
        return;
    }
    const catColors2 = { meeting: '#1a56db', health: '#dc2626', holiday: '#7c3aed', infrastructure: '#d97706', general: '#16a34a' };
    const catLabels = { meeting: 'Meeting', health: 'Health', holiday: 'Holiday', infrastructure: 'Infrastructure', general: 'General' };
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
    document.getElementById('edit-modal-save').onclick = async () => {
        const updated = { title: val('ea-title'), category: val('ea-cat'), content: val('ea-content'), date: val('ea-date') || a.date };
        try {
            await dbUpdate('announcements', id, updated);
            Object.assign(a, updated);
            closeModal('edit-modal');
            renderAnnouncements();
            toast('Announcement updated!', 'success');
        } catch (err) { toast('Failed to update: ' + err.message, 'error'); }
    };
    openModal('edit-modal');
}

async function deleteAnnouncement(id) {
    try {
        await dbDelete('announcements', id);
        state.announcements = state.announcements.filter(a => a.id !== id);
        closeModal('confirm-modal');
        renderAnnouncements();
        toast('Announcement deleted', 'info');
    } catch (err) { toast('Failed to delete: ' + err.message, 'error'); }
}

async function submitAnnouncement() {
    const title = val('ann-title'), content = val('ann-content');
    if (!title || !content) { toast('Please fill required fields', 'error'); return; }
    try {
        const id = await dbGenerateId('announcements', 'ANN');
        const row = { id, title, category: val('ann-cat') || 'general', content, date: today() };
        const inserted = await dbInsert('announcements', row);
        state.announcements.unshift(inserted[0] || row);
        closeModal('new-announcement-modal');
        ['ann-title', 'ann-cat', 'ann-content'].forEach(clearField);
        toast('Announcement published!', 'success');
        addNotification('New Announcement', `"${title}" published`, 'info');
        if (document.getElementById('page-announcements').classList.contains('active')) renderAnnouncements();
    } catch (err) { toast('Failed to publish: ' + err.message, 'error'); }
}

// ===================== USERS =====================
function renderUsers() {
    const statsEl = document.getElementById('users-stats');
    if (statsEl) {
        const admins = state.users.filter(u => u.role === 'Admin').length;
        const staff = state.users.filter(u => u.role === 'Staff').length;
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
      <td><div style="display:flex;align-items:center;gap:10px">
        <div class="av" style="background:${avatarColor(u.name)};color:white;font-size:11px">${u.initials || initials(u.name)}</div>
        <div><div style="font-weight:700">${u.name}</div><div style="font-size:11px;color:var(--on-surface-3)">@${u.username}</div></div>
      </div></td>
      <td>${u.role === 'Admin' ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge badge-staff">Staff</span>'}</td>
      <td style="font-size:12px;color:var(--on-surface-3)">${u.email}</td>
      <td>${u.status === 'Active'
            ? '<span class="badge badge-active"><span class="badge-dot"></span>Active</span>'
            : '<span class="badge badge-suspended"><span class="badge-dot"></span>Suspended</span>'}</td>
      <td style="font-size:12px;color:var(--on-surface-3)">${u.last_active || u.lastActive || 'N/A'}</td>
      <td><div class="tbl-actions">
        <button class="tbl-btn" onclick="editUser(${u.id})" title="Edit"><span class="material-symbols-outlined">edit</span></button>
        <button class="tbl-btn" onclick="toggleUserStatus(${u.id})" title="Toggle Status"><span class="material-symbols-outlined">${u.status === 'Active' ? 'block' : 'check_circle'}</span></button>
        ${u.id !== state.session?.id ? `<button class="tbl-btn danger" onclick="confirmDelete('User','Delete user ${u.name}?',()=>deleteUser(${u.id}))" title="Delete"><span class="material-symbols-outlined">delete</span></button>` : ''}
      </div></td>
    </tr>
  `).join('');
}

async function toggleUserStatus(id) {
    const u = state.users.find(x => x.id === id);
    if (!u) return;
    const newStatus = u.status === 'Active' ? 'Suspended' : 'Active';
    try {
        await dbUpdate('users', id, { status: newStatus });
        u.status = newStatus;
        renderUsers();
        toast(`User ${newStatus === 'Active' ? 'activated' : 'suspended'}`, 'info');
    } catch (err) { toast('Failed to update user status: ' + err.message, 'error'); }
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
    document.getElementById('edit-modal-save').onclick = async () => {
        const updated = {
            name: val('eu-name'),
            username: val('eu-username'),
            email: val('eu-email'),
            role: val('eu-role'),
            initials: initials(val('eu-name')),
        };
        try {
            await dbUpdate('users', id, updated);
            Object.assign(u, updated);
            if (state.session && state.session.id === u.id) {
                Object.assign(state.session, updated);
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
                initApp();
            }
            closeModal('edit-modal');
            renderUsers();
            toast('User updated!', 'success');
        } catch (err) { toast('Failed to update user: ' + err.message, 'error'); }
    };
    openModal('edit-modal');
}

async function deleteUser(id) {
    try {
        await dbDelete('users', id);
        state.users = state.users.filter(u => u.id !== id);
        closeModal('confirm-modal');
        renderUsers();
        toast('User deleted', 'info');
    } catch (err) { toast('Failed to delete user: ' + err.message, 'error'); }
}

async function submitUser() {
    const name = val('usr-name'), username = val('usr-username'), email = val('usr-email'), password = val('usr-password');
    if (!name || !username || !email || !password) { toast('Please fill all fields', 'error'); return; }
    if (state.users.find(u => u.username === username)) { toast('Username already exists', 'error'); return; }
    const id = Math.max(...state.users.map(u => u.id), 0) + 1;
    const row = { id, name, username, email, password, role: val('usr-role') || 'Staff', status: 'Active', last_active: 'Just now', initials: initials(name) };
    try {
        const inserted = await dbInsert('users', row);
        state.users.push(inserted[0] || row);
        closeModal('add-user-modal');
        ['usr-name', 'usr-username', 'usr-email', 'usr-password'].forEach(clearField);
        toast(`User ${name} created!`, 'success');
        renderUsers();
    } catch (err) { toast('Failed to create user: ' + err.message, 'error'); }
}

// ===================== SETTINGS =====================
function saveSettings() {
    toast('Settings saved successfully!', 'success');
}

async function changePassword() {
    const cur = val('s-cur-pw'), nw = val('s-new-pw'), conf = val('s-conf-pw');
    if (!cur || !nw || !conf) { toast('Please fill all password fields', 'error'); return; }
    if (nw !== conf) { toast('New passwords do not match', 'error'); return; }
    const user = state.users.find(u => u.id === state.session?.id);
    if (user && user.password !== cur) { toast('Current password is incorrect', 'error'); return; }
    try {
        await dbUpdate('users', user.id, { password: nw });
        user.password = nw;
        state.session.password = nw;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
        ['s-cur-pw', 's-new-pw', 's-conf-pw'].forEach(clearField);
        toast('Password updated successfully!', 'success');
    } catch (err) { toast('Failed to update password: ' + err.message, 'error'); }
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
function renderPagination(key, total, current, renderFn) {
    const el = document.getElementById(`${key}-pagination`);
    if (!el) return;
    const pages = Math.ceil(total / state.perPage);
    if (pages <= 1) { el.innerHTML = `<span class="pg-info">Showing ${total} of ${total}</span>`; return; }
    const start = (current - 1) * state.perPage + 1;
    const end = Math.min(current * state.perPage, total);
    let btns = `<button class="pg-btn" onclick="changePage('${key}','${renderFn}',${current - 1})" ${current === 1 ? 'disabled style="opacity:0.4"' : ''}><span class="material-symbols-outlined">chevron_left</span></button>`;
    let leftDone = false, rightDone = false;
    for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= current - 1 && i <= current + 1)) {
            btns += `<button class="pg-btn ${i === current ? 'active-pg' : ''}" onclick="changePage('${key}','${renderFn}',${i})">${i}</button>`;
            leftDone = false; rightDone = false;
        } else if (i < current - 1 && !leftDone) { btns += `<button class="pg-btn" disabled style="opacity:0.4">…</button>`; leftDone = true; }
        else if (i > current + 1 && !rightDone) { btns += `<button class="pg-btn" disabled style="opacity:0.4">…</button>`; rightDone = true; }
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
function openModal(id) { const el = document.getElementById(id); if (el) { el.style.display = 'flex'; document.body.style.overflow = 'hidden'; } }
function closeModal(id) { const el = document.getElementById(id); if (el) { el.style.display = 'none'; document.body.style.overflow = ''; } }
function closeOnOverlay(e, id) { if (e.target.classList.contains('modal-overlay')) closeModal(id); }

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
        warning: { color: 'var(--error-light)', iconColor: 'var(--error)', icon: 'warning' },
        success: { color: 'var(--success-light)', iconColor: 'var(--success)', icon: 'check_circle' },
        info: { color: '#eef2ff', iconColor: 'var(--primary)', icon: 'info' },
        doc: { color: '#fffbeb', iconColor: '#d97706', icon: 'description' },
        person: { color: '#f5f3ff', iconColor: '#7c3aed', icon: 'person' },
        complaint: { color: 'var(--error-light)', iconColor: 'var(--error)', icon: 'gavel' },
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
    else panel.style.display = 'none';
}

// ===================== PROFILE MENU =====================
function showProfileMenu() {
    const menu = document.getElementById('profile-menu');
    const notifPanel = document.getElementById('notif-panel');
    if (notifPanel) notifPanel.style.display = 'none';
    menu.style.display = (menu.style.display === 'none' || !menu.style.display) ? 'block' : 'none';
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
function globalSearch(query) {
    if (!query) return;
    const q = query.toLowerCase();
    ['residents-search', 'docs-search', 'complaints-search'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const hasRes = state.residents.some(r => `${r.fname} ${r.lname}`.toLowerCase().includes(q) || r.purok.toLowerCase().includes(q));
    const hasDocs = state.documents.some(d => d.resident.toLowerCase().includes(q));
    const hasCmp = state.complaints.some(c => c.complainant.toLowerCase().includes(q));
    if (hasRes) { document.getElementById('residents-search').value = query; showPage('residents'); }
    else if (hasDocs) { document.getElementById('docs-search').value = query; showPage('documents'); }
    else if (hasCmp) { document.getElementById('complaints-search').value = query; showPage('complaints'); }
    else { toast('No results found for "' + query + '"', 'info'); }
}

// ===================== EXPORT =====================
function exportCSV(type) {
    let rows = [], headers = [];
    if (type === 'residents') { headers = ['ID', 'First Name', 'Last Name', 'Purok', 'Contact', 'Status', 'Registered']; rows = state.residents.map(r => [r.id, r.fname, r.lname, r.purok, r.contact, r.status, r.registered]); }
    else if (type === 'documents') { headers = ['Reference', 'Resident', 'Type', 'Date', 'Status', 'Purpose']; rows = state.documents.map(d => [d.ref, d.resident, d.type, d.date, d.status, d.purpose || '']); }
    else if (type === 'complaints') { headers = ['ID', 'Complainant', 'Category', 'Priority', 'Status', 'Date']; rows = state.complaints.map(c => [c.id, c.complainant, c.category, c.priority, c.status, c.date]); }
    else if (type === 'projects') { headers = ['ID', 'Title', 'Category', 'Status', 'Budget', 'Progress']; rows = state.projects.map(p => [p.id, p.title, p.category, p.status, p.budget, p.progress + '%']); }
    else if (type === 'users') { headers = ['ID', 'Name', 'Username', 'Email', 'Role', 'Status']; rows = state.users.map(u => [u.id, u.name, u.username, u.email, u.role, u.status]); }
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadFile(csv, `payatas-${type}-${today()}.csv`, 'text/csv');
    toast(`Exported ${type} to CSV`, 'success');
}

function exportReport(type) {
    toast('Generating report...', 'info');
    setTimeout(() => {
        if (type !== 'monthly' && type !== 'summary') { exportCSV(type === 'complaints' ? 'complaints' : 'documents'); return; }
        const now = new Date().toLocaleString('en-PH');
        const docs = state.documents, cmps = state.complaints, residents = state.residents, projects = state.projects;
        const approved = docs.filter(d => d.status === 'Approved').length;
        const pending = docs.filter(d => d.status === 'Pending').length;
        const rejected = docs.filter(d => d.status === 'Rejected').length;
        const resolved = cmps.filter(c => c.status === 'Resolved').length;
        const budget = projects.reduce((s, p) => s + p.budget, 0);
        const csv = [
            [`Barangay Payatas — ${type === 'monthly' ? 'Monthly' : 'Summary'} Report`], [`Generated: ${now}`], [],
            ['=== RESIDENTS ==='], ['Total Registered', residents.length], ['Active', residents.filter(r => r.status === 'Active').length], ['Inactive', residents.filter(r => r.status === 'Inactive').length], [],
            ['=== DOCUMENTS ==='], ['Total Requests', docs.length], ['Approved', approved], ['Pending', pending], ['Rejected', rejected], ['Approval Rate', docs.length ? Math.round(approved / docs.length * 100) + '%' : 'N/A'], [],
            ['=== COMPLAINTS ==='], ['Total Filed', cmps.length], ['Resolved', resolved], ['Pending', cmps.length - resolved], ['Resolution Rate', cmps.length ? Math.round(resolved / cmps.length * 100) + '%' : 'N/A'], [],
            ['=== PROJECTS ==='], ['Total Projects', projects.length], ['Ongoing', projects.filter(p => p.status === 'Ongoing').length], ['Completed', projects.filter(p => p.status === 'Completed').length], ['Planned', projects.filter(p => p.status === 'Planned').length], ['Total Budget', '₱' + budget.toLocaleString()],
        ].map(r => r.map(c => `"${String(c === undefined ? '' : c).replace(/"/g, '""')}"`).join(',')).join('\n');
        downloadFile(csv, `payatas-report-${type}-${today()}.csv`, 'text/csv');
        toast('Report downloaded!', 'success');
    }, 800);
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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
function formatDate(d) { if (!d) return 'N/A'; return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); }
function initials(name) { if (!name) return '??'; return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase(); }

const COLORS = ['#1a56db', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#db2777'];
function avatarColor(name) {
    if (!name) return COLORS[0];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
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
// NO seedData() — all data comes from Supabase
(async () => {
    state.session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (state.session) {
        try {
            await sbLoadAll();
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-app').style.display = 'flex';
            initApp();
            startSessionTimeout();
        } catch (err) {
            // Supabase down — clear session and show login
            sessionStorage.removeItem(SESSION_KEY);
            state.session = null;
            toast('Could not connect to database. Please log in again.', 'error');
        }
    }
})();

const REMARK_OPTIONS = {
    Approved: [
        "Approved. Please proceed to the barangay office to claim your clearance.",
        "Your request has been approved. Kindly visit the main office for release of your clearance.",
        "Application approved. Please proceed to the barangay hall for claiming.",
        "Approved. You may now claim your barangay clearance at the office.",
        "Request approved. Kindly proceed to the main office during office hours to claim your document.",
        "Your barangay clearance is ready for release. Please claim it at the barangay office.",
        "Approved. Please present a valid ID when claiming your clearance at the office.",
        "Application approved. Kindly proceed to the barangay office for document release."
    ],
    Rejected: [
        "Request not approved. Please visit the barangay office for further assistance.",
        "Application requires clarification. Kindly proceed to the main office for assistance.",
        "Your request cannot be processed at this time. Please visit the barangay office for support.",
        "Request denied due to incomplete requirements. Please proceed to the office for assistance.",
        "Application not approved. Kindly coordinate with the barangay office for further details.",
        "Your request needs verification. Please proceed to the main office for assistance.",
        "Request on hold. Please visit the barangay office to resolve the concern.",
        "Application rejected. Kindly proceed to the barangay office for proper assistance and guidance."
    ]
};

function updateQuickRemarks(status) {
    const select = document.getElementById('dp-quick-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Choose a predefined message --</option>';
    const options = REMARK_OPTIONS[status] || [];
    options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt;
        el.textContent = opt.length > 60 ? opt.slice(0, 60) + '...' : opt;
        select.appendChild(el);
    });
}

function applyQuickRemark(val) {
    if (!val) return;
    const textarea = document.getElementById('dp-edit-remarks');
    if (textarea) textarea.value = val;
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
    document.getElementById('dp-edit-name').value = d.resident;
    document.getElementById('dp-edit-contact').value = d.contact || '';
    document.getElementById('dp-edit-type').value = d.type;
    document.getElementById('dp-edit-purpose').value = d.purpose || '';
    document.getElementById('dp-edit-status').value = d.status;
    document.getElementById('dp-edit-remarks').value = d.remarks || '';
    updateQuickRemarks(d.status);
    document.getElementById('doc-panel-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function buildTimeline(status) {
    const steps = [
        { label: 'Request Submitted', desc: 'Resident filed the document request', icon: 'upload_file' },
        { label: 'Under Review', desc: 'Staff is verifying the details', icon: 'manage_search' },
        {
            label: status === 'Rejected' ? 'Request Rejected' : 'Request Approved',
            desc: status === 'Rejected' ? 'Document request was declined' : 'Document has been approved',
            icon: status === 'Rejected' ? 'cancel' : 'check_circle'
        },
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

function closeDocPanel(e) { if (e && !e.target.classList.contains('doc-panel-overlay')) return; closeDocPanelDirect(); }
function closeDocPanelDirect() { document.getElementById('doc-panel-overlay').classList.remove('open'); document.body.style.overflow = ''; _panelDocId = null; }

async function saveDocPanel() {
    const d = state.documents.find(x => x.id === _panelDocId);
    if (!d) return;
    const updated = {
        resident: document.getElementById('dp-edit-name').value.trim() || d.resident,
        contact: document.getElementById('dp-edit-contact').value.trim(),
        type: document.getElementById('dp-edit-type').value,
        purpose: document.getElementById('dp-edit-purpose').value.trim(),
        status: document.getElementById('dp-edit-status').value,
        remarks: document.getElementById('dp-edit-remarks').value.trim(),
    };
    try {
        await dbUpdate('documents', _panelDocId, updated);
        Object.assign(d, updated);
        openDocPanel(_panelDocId);
        renderDocuments(); renderDashboardDocs(); updateBadges(); updateDashboard();
        toast('Document updated successfully!', 'success');
    } catch (err) { toast('Failed to save document: ' + err.message, 'error'); }
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
      .header h1{font-size:22px;color:#1a56db;margin:0 0 4px}.header p{font-size:12px;color:#555;margin:0}
      .doc-title{text-align:center;font-size:18px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin:20px 0 28px}
      .field{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px}
      .field .lbl{width:160px;font-weight:bold;flex-shrink:0;color:#444}
      .footer{margin-top:60px;display:flex;justify-content:space-between;font-size:12px}
      .sig{text-align:center}.sig-line{width:180px;border-top:1px solid #111;margin:40px auto 4px}
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
    <div class="watermark">OFFICIAL DOCUMENT — BARANGAY PAYATAS · PAYATAS LEDGER v3.0.0</div>
  </body></html>`);
    w.document.close(); w.focus();
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
    ${r.status === 'Active'
            ? '<span class="badge badge-active"><span class="badge-dot"></span>Active</span>'
            : '<span class="badge badge-inactive"><span class="badge-dot"></span>Inactive</span>'}
    <span class="badge" style="background:var(--surface);color:var(--on-surface-2)">${r.purok}</span>
    <span class="badge" style="background:var(--surface);color:var(--on-surface-2)">Since ${r.registered}</span>
  `;
    const age = r.dob && r.dob !== 'N/A' ? Math.floor((new Date() - new Date(r.dob)) / 31557600000) + ' yrs' : 'N/A';
    document.getElementById('rp-info-grid').innerHTML = [
        { label: 'First Name', val: r.fname },
        { label: 'Last Name', val: r.lname },
        { label: 'Date of Birth', val: r.dob !== 'N/A' ? formatDate(r.dob) : 'N/A' },
        { label: 'Age', val: age },
        { label: 'Gender', val: r.gender || 'N/A' },
        { label: 'Contact', val: r.contact },
        { label: 'Purok', val: r.purok },
        { label: 'Year Registered', val: r.registered },
        { label: 'Address', val: r.address, full: true },
        { label: 'Notes', val: r.notes || '—', full: true },
    ].map(f => `
    <div style="${f.full ? 'grid-column:1/-1;' : ''}background:var(--surface);border-radius:8px;padding:10px 12px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--on-surface-3);margin-bottom:3px">${f.label}</div>
      <div style="font-size:13px;font-weight:600;color:var(--on-surface-1)">${f.val}</div>
    </div>
  `).join('');
    const docs = state.documents.filter(d => d.resident.toLowerCase().includes(r.fname.toLowerCase()) || d.resident.toLowerCase().includes(r.lname.toLowerCase()));
    document.getElementById('rp-doc-history').innerHTML = docs.length
        ? docs.map(d => `<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--surface);border-radius:8px;margin-bottom:6px;font-size:12px"><div><div style="font-weight:600">${d.type}</div><div style="color:var(--on-surface-3);font-family:'DM Mono',monospace;font-size:10px">${d.ref} · ${formatDate(d.date)}</div></div>${statusBadge(d.status)}</div>`).join('')
        : '<div style="font-size:13px;color:var(--on-surface-3);padding:10px 0">No document requests found.</div>';
    const cmps = state.complaints.filter(c => c.complainant.toLowerCase().includes(r.fname.toLowerCase()) || c.complainant.toLowerCase().includes(r.lname.toLowerCase()));
    document.getElementById('rp-complaints').innerHTML = cmps.length
        ? cmps.map(c => `<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--surface);border-radius:8px;margin-bottom:6px;font-size:12px"><div><div style="font-weight:600">${c.category} — ${c.id}</div><div style="color:var(--on-surface-3)">${c.desc.slice(0, 60)}...</div></div>${priorityBadge(c.priority)}</div>`).join('')
        : '<div style="font-size:13px;color:var(--on-surface-3);padding:10px 0">No linked complaints found.</div>';
    document.getElementById('resident-panel-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeResidentPanel(e) { if (e && !e.target.classList.contains('resident-panel-overlay')) return; closeResidentPanelDirect(); }
function closeResidentPanelDirect() { document.getElementById('resident-panel-overlay').classList.remove('open'); document.body.style.overflow = ''; _panelResidentId = null; }
function editResidentFromPanel() { const id = _panelResidentId; closeResidentPanelDirect(); editResident(id); }
function printResidentFromPanel() { printResidentProfile(_panelResidentId); }

// ===================== REPORTS =====================
function renderReports() {
    const docs = state.documents, cmps = state.complaints, residents = state.residents, projects = state.projects;
    const approved = docs.filter(d => d.status === 'Approved').length;
    const pending = docs.filter(d => d.status === 'Pending').length;
    const resolved = cmps.filter(c => c.status === 'Resolved').length;
    const resRate = cmps.length ? Math.round(resolved / cmps.length * 100) : 0;
    const approvalRate = docs.length ? Math.round(approved / docs.length * 100) : 0;
    const ongoing = projects.filter(p => p.status === 'Ongoing').length;
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
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = data.map(d => `
      <div class="mb-3">
        <div class="progress-label"><span>${d.label}</span><span style="font-weight:700">${d.val}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(d.val / max * 100)}%;background:${colorMap[d.label] || '#1a56db'};transition:width 0.6s ease"></div></div>
      </div>
    `).join('');
    }
    barChart('chart-doc-types',
        ['Barangay Clearance', 'Barangay Certificate of Residency', 'Barangay Certificate of Indigency', 'Barangay Business Clearance', 'Certificate of Good Moral Character', 'Barangay Permit'].map(t => ({ label: t, val: docs.filter(d => d.type === t).length })),
        {
            'Barangay Clearance': '#1a56db',
            'Barangay Certificate of Residency': '#16a34a',
            'Barangay Certificate of Indigency': '#d97706',
            'Barangay Business Clearance': '#7c3aed',
            'Certificate of Good Moral Character': '#db2777',
            'Barangay Permit': '#0891b2'
        }
    );
    barChart('chart-cmp-cats',
        [...new Set(cmps.map(c => c.category))].map(cat => ({ label: cat, val: cmps.filter(c => c.category === cat).length })),
        { Sanitation: '#dc2626', Noise: '#d97706', 'Public Safety': '#1a56db', Environmental: '#16a34a', Infrastructure: '#7c3aed' }
    );
    const now2 = new Date();
    const getAge = dob => dob && dob !== 'N/A' ? Math.floor((now2 - new Date(dob)) / 31557600000) : null;
    const ages = residents.map(r => getAge(r.dob)).filter(a => a !== null);
    barChart('chart-demographics', [
        { label: 'Youth (0–17)', val: ages.filter(a => a < 18).length },
        { label: 'Adults (18–59)', val: ages.filter(a => a >= 18 && a < 60).length },
        { label: 'Seniors (60+)', val: ages.filter(a => a >= 60).length },
        { label: 'Unknown', val: residents.length - ages.length },
    ], { 'Youth (0–17)': '#1a56db', 'Adults (18–59)': '#16a34a', 'Seniors (60+)': '#7c3aed', 'Unknown': '#9ca3af' });
    barChart('chart-projects', [
        { label: 'Ongoing', val: projects.filter(p => p.status === 'Ongoing').length },
        { label: 'Completed', val: projects.filter(p => p.status === 'Completed').length },
        { label: 'Planned', val: projects.filter(p => p.status === 'Planned').length },
    ], { Ongoing: '#1a56db', Completed: '#16a34a', Planned: '#7c3aed' });
    const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
    const summaryEl = document.getElementById('reports-summary-table');
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

// ===================== COMMUNITY HUB =====================
function switchCommunityTab(tab, btn) {
    state.communityTab = tab;
    document.querySelectorAll('#community-tabs .chip').forEach(c => {
        c.classList.remove('chip-active');
        c.classList.add('chip-inactive');
    });
    btn.classList.remove('chip-inactive');
    btn.classList.add('chip-active');

    const tabs = document.querySelectorAll('.com-tab-content');
    tabs.forEach(t => t.style.display = 'none');
    const target = document.getElementById('com-tab-' + tab);
    if (target) target.style.display = 'block';

    // Context-sensitive action buttons
    const actionsEl = document.getElementById('community-pg-actions');
    if (actionsEl) {
        if (tab === 'volunteers') {
            actionsEl.innerHTML = `<button class="btn-secondary" onclick="exportVolunteers()"><span class="material-symbols-outlined" style="font-size:16px">download</span> Export Volunteers</button>`;
        } else if (tab === 'polls') {
            actionsEl.innerHTML = `<button class="btn-primary" onclick="openModal('new-poll-modal')"><span class="material-symbols-outlined" style="font-size:16px">how_to_vote</span> Create New Poll</button>`;
        } else {
            actionsEl.innerHTML = '';
        }
    }

    renderCommunityHub();
}

function renderCommunityHub() {
    const tab = state.communityTab || 'suggestions';
    if (tab === 'suggestions') renderSuggestions();
    else if (tab === 'volunteers') renderVolunteers();
    else if (tab === 'polls') renderAdminPolls();

    // Update badge if any pending suggestions
    const pending = state.suggestions.filter(s => s.status === 'pending').length;
    const b = document.getElementById('badge-tab-suggestions');
    if (b) {
        b.style.display = pending > 0 ? 'inline-block' : 'none';
        b.textContent = pending;
    }
}

function renderSuggestions() {
    const tbody = document.getElementById('suggestions-table');
    if (!tbody) return;

    const data = state.suggestions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No resident suggestions found.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(s => `
    <tr>
      <td><strong>${s.name || 'Anonymous'}</strong><div style="font-size:11px;color:var(--on-surface-3)">${s.resident_id || 'Guest'}</div></td>
      <td style="max-width:300px; white-space:normal;">${s.content}</td>
      <td style="font-size:12px;color:var(--on-surface-3)">${formatDate(s.created_at)}</td>
      <td>${statusBadge(s.status)}</td>
      <td><div class="tbl-actions">
        ${s.status === 'pending' ? `<button class="tbl-btn" onclick="publishSuggestionUI('${s.id}')" title="Reply & Publish"><span class="material-symbols-outlined">publish</span></button>` : ''}
        <button class="tbl-btn danger" onclick="confirmDelete('Suggestion','Remove this suggestion?',()=>deleteSuggestion('${s.id}'))" title="Delete"><span class="material-symbols-outlined">delete</span></button>
      </div></td>
    </tr>
  `).join('');
}

function renderVolunteers() {
    const tbody = document.getElementById('volunteers-table');
    if (!tbody) return;

    const data = state.volunteers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No volunteer applications yet.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(v => `
    <tr>
      <td><strong>${v.full_name}</strong></td>
      <td>${v.contact}<div style="font-size:11px;color:var(--on-surface-3)">${v.email || 'No email'}</div></td>
      <td style="font-size:12px;max-width:200px;">${v.body_conditions || 'None stated'}</td>
      <td>${statusBadge(v.status || 'pending')}</td>
      <td style="font-size:12px;">${formatDate(v.created_at)}</td>
      <td><div class="tbl-actions">
        <button class="tbl-btn" onclick="confirmUpdateVolunteer('${v.id}', 'accepted')" title="Accept"><span class="material-symbols-outlined">check_circle</span></button>
        <button class="tbl-btn danger" onclick="confirmDelete('Volunteer','Remove application?',()=>deleteVolunteer('${v.id}'))" title="Delete"><span class="material-symbols-outlined">delete</span></button>
      </div></td>
    </tr>
  `).join('');
}

function renderAdminPolls() {
    const grid = document.getElementById('polls-admin-grid');
    if (!grid) return;

    if (state.polls.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--on-surface-3);">No active polls. Create one to start gathering feedback.</div>';
        return;
    }

    grid.innerHTML = state.polls.map(p => `
    <div class="card">
      <div class="card-header"><span class="card-title">${p.question}</span></div>
      <div class="card-body">
        <div style="display:grid; gap:10px;">
          ${p.options.map((opt, i) => {
        const votes = p.votes?.[i] || 0;
        const total = Object.values(p.votes || {}).reduce((a, b) => a + b, 0) || 1;
        const perc = Math.round((votes / total) * 100);
        return `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                  <span>${opt}</span>
                  <strong>${votes} votes (${perc}%)</strong>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${perc}%"></div></div>
              </div>
            `;
    }).join('')}
        </div>
        <div style="margin-top:20px; display:flex; gap:10px;">
          <button class="btn-secondary" style="font-size:11px; padding:6px 12px;" onclick="closePoll('${p.id}')">Close Poll</button>
          <button class="btn-secondary danger" style="font-size:11px; padding:6px 12px;" onclick="deletePoll('${p.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// --- COMMUNITY ACTIONS ---
async function publishSuggestionUI(id) {
    const s = state.suggestions.find(x => x.id === id);
    if (!s) return;
    const reply = prompt(`Reply to: "${s.content}"\n\nEnter official response to publish:`, "Thank you for your suggestion. We will look into this.");
    if (reply === null) return;

    try {
        const updated = await dbUpdate('suggestions', id, { admin_reply: reply, status: 'published' });
        state.suggestions = state.suggestions.map(x => x.id === id ? updated[0] : x);
        renderSuggestions();
        toast('Suggestion published to public hub!', 'success');
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function deleteSuggestion(id) {
    try {
        await dbDelete('suggestions', id);
        state.suggestions = state.suggestions.filter(x => x.id !== id);
        renderSuggestions();
        closeModal('confirm-modal');
        updateBadges();
        toast('Suggestion removed', 'info');
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function confirmUpdateVolunteer(id, status) {
    try {
        const updated = await dbUpdate('volunteer_signups', id, { status });
        state.volunteers = state.volunteers.map(v => v.id === id ? updated[0] : v);
        renderVolunteers();
        updateBadges();
        toast(`Volunteer application ${status}`, 'success');
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function deleteVolunteer(id) {
    try {
        await dbDelete('volunteer_signups', id);
        state.volunteers = state.volunteers.filter(v => v.id !== id);
        renderVolunteers();
        updateBadges();
        closeModal('confirm-modal');
        toast('Application removed', 'info');
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function submitPoll() {
    const question = val('poll-question');
    const optionsRaw = val('poll-options').split('\n').map(o => o.trim()).filter(o => o);
    const expiry = val('poll-expiry');

    if (!question || optionsRaw.length < 2) {
        toast('Question and at least 2 options are required', 'error');
        return;
    }

    try {
        const poll = {
            question,
            options: optionsRaw,
            votes: {},
            status: 'active',
            expires_at: expiry || null
        };
        const results = await dbInsert('polls', poll);
        state.polls.push(results[0]);
        renderAdminPolls();
        closeModal('new-poll-modal');
        ['poll-question', 'poll-options', 'poll-expiry'].forEach(clearField);
        toast('Poll launched successfully!', 'success');
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function closePoll(id) {
    try {
        await dbUpdate('polls', id, { status: 'closed' });
        const p = state.polls.find(x => x.id === id);
        if (p) p.status = 'closed';
        renderAdminPolls();
        toast('Poll closed for voting', 'info');
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function deletePoll(id) {
    confirmDelete('Poll', 'Permanently remove this poll and all its results?', async () => {
        try {
            await dbDelete('polls', id);
            state.polls = state.polls.filter(x => x.id !== id);
            renderAdminPolls();
            closeModal('confirm-modal');
            toast('Poll deleted', 'info');
        } catch (err) {
            toast('Error: ' + err.message, 'error');
        }
    });
}

// Export functions to window
window.switchCommunityTab = switchCommunityTab;
window.publishSuggestionUI = publishSuggestionUI;
window.deleteSuggestion = deleteSuggestion;
window.confirmUpdateVolunteer = confirmUpdateVolunteer;
window.deleteVolunteer = deleteVolunteer;
window.submitPoll = submitPoll;
window.closePoll = closePoll;
window.deletePoll = deletePoll;
window.exportVolunteers = exportVolunteers;
window.renderCommunityHub = renderCommunityHub;

// ===================== RESPONSIVE =====================
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    }
});