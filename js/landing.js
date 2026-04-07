/**
 * Payatas Landing — Premium Public Services Logic
 * Handles Navbar, Modals, Dark Mode, and Supabase Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initModals();
  initDarkMode();
  initScrollAnimations();
  initVerifyBtn();
  loadAnnouncements();
  loadProjects();
});

// --- NAVBAR ---
function initNavbar() {
  const nav = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
}

function toggleMobileMenu() {
  const navWrapper = document.getElementById('nav-links-wrapper');
  const overlay = document.getElementById('mobile-menu-overlay');
  const body = document.body;

  if (!navWrapper || !overlay) return;

  if (navWrapper.classList.contains('active')) {
    navWrapper.classList.remove('active');
    overlay.classList.remove('active');
    body.style.overflow = '';
  } else {
    navWrapper.classList.add('active');
    overlay.classList.add('active');
    body.style.overflow = 'hidden';
  }
}

// --- DARK MODE ---
function initDarkMode() {
  const toggle = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');
  const html = document.documentElement;

  // Check saved theme
  const savedTheme = localStorage.getItem('payatas-theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  toggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('payatas-theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    if (icon) {
      icon.textContent = theme === 'light' ? 'light_mode' : 'dark_mode';
    }
  }
}

// --- SCROLL ANIMATIONS ---
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.section, .stat-item, .service-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });

  // Custom reveal class logic
  const style = document.createElement('style');
  style.textContent = `
    .reveal-active { opacity: 1 !important; transform: translateY(0) !important; }
  `;
  document.head.appendChild(style);
}

// --- MODALS ---
function initModals() {
  const overlay = document.querySelector('.modal-overlay');

  if (!overlay) return;

  const closeModal = () => {
    overlay.style.display = 'none';
    document.body.style.overflow = '';

    // Clear forms
    document.querySelectorAll('.form-control').forEach(el => el.value = '');
    const resEl = document.getElementById('modal-result-content');
    if (resEl) resEl.innerHTML = '';
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  window.openModal = (type) => {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const requestForm = document.getElementById('request-form-content');
    const complaintForm = document.getElementById('complaint-form-content');
    const verifyForm = document.getElementById('verify-form-content');
    const title = document.getElementById('modal-title');
    const resEl = document.getElementById('modal-result-content');

    if (resEl) resEl.innerHTML = '';

    if (type === 'apply') {
      title.textContent = 'Clearance Application';
      if (requestForm) requestForm.style.display = 'block';
      if (complaintForm) complaintForm.style.display = 'none';
      if (verifyForm) verifyForm.style.display = 'none';
    } else if (type === 'complaint') {
      title.textContent = 'Submit a Complaint';
      if (requestForm) requestForm.style.display = 'none';
      if (complaintForm) complaintForm.style.display = 'block';
      if (verifyForm) verifyForm.style.display = 'none';
    } else if (type === 'verify') {
      title.textContent = 'Verify Document';
      if (requestForm) requestForm.style.display = 'none';
      if (complaintForm) complaintForm.style.display = 'none';
      if (verifyForm) verifyForm.style.display = 'block';
    }
  };

  window.closeModal = closeModal;
}

// --- VERIFY LOGIC ---
function initVerifyBtn() {
  const btn = document.getElementById('strip-verify-btn');
  const input = document.getElementById('strip-verify-input');

  if (btn && input) {
    btn.addEventListener('click', () => {
      const val = input.value.trim();
      if (!val) return;
      openModal('verify');
      const verifyInput = document.getElementById('verify-query');
      if (verifyInput) {
        verifyInput.value = val;
        doVerify(val);
      }
    });
  }
}

async function doVerify(queryArg) {
  const query = queryArg || document.getElementById('verify-query').value.trim().toUpperCase();
  const resEl = document.getElementById('modal-result-content');
  if (!query || !resEl) return;

  resEl.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">
    <span class="material-symbols-outlined" style="font-size:32px; animation: spin 2s linear infinite;">sync</span>
    <p>Searching records...</p>
  </div>`;

  try {
    const { data: docs, error } = await supabaseClient
      .from('documents')
      .select('*')
      .or(`ref.eq."${query}",id.eq."${query}"`)
      .limit(1);

    if (error) throw error;

    if (!docs || docs.length === 0) {
      resEl.innerHTML = `
        <div style="text-align:center; padding:40px; background:var(--background); border-radius:16px;">
          <span class="material-symbols-outlined" style="font-size:64px; color:#dc2626; margin-bottom:16px;">error</span>
          <h4 style="color:#dc2626; margin-bottom:8px; font-size:20px;">Record Not Found</h4>
          <p style="font-size:14px; color:var(--text-muted);">We couldn't find any documents matching "${query}".</p>
        </div>
      `;
      return;
    }

    const d = docs[0];
    const status = d.status || 'Pending';
    const isApproved = status === 'Approved';
    const isRejected = status === 'Rejected';

    let icon = 'pending';
    let color = 'var(--accent)';
    let title = 'Under Review';
    let border = 'var(--border)';

    if (isApproved) {
      icon = 'verified';
      color = 'var(--primary)';
      title = 'Authentic Record';
      border = 'var(--primary)';
    } else if (isRejected) {
      icon = 'cancel';
      color = '#e11d48';
      title = 'Request Rejected';
      border = '#e11d48';
    }

    resEl.innerHTML = `
      <div style="background:var(--background); border-radius:24px; padding:32px; border: 2px solid ${border}">
        <div style="display:flex; align-items:center; gap:20px; margin-bottom:24px;">
          <div style="width:56px; height:56px; background:${color}; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white;">
            <span class="material-symbols-outlined" style="font-size:32px;">${icon}</span>
          </div>
          <div>
            <h4 style="margin:0; font-size:20px; font-weight:900; color:${color}">${title}</h4>
            <p style="color:var(--text-muted); margin:4px 0 0; font-size:13px;">REF: ${d.ref || d.id}</p>
          </div>
        </div>
        <div style="display:grid; gap:12px; margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between;"><span>Resident Name:</span><strong>${d.resident || d.resident_name}</strong></div>
          <div style="display:flex; justify-content:space-between;"><span>Document Type:</span><strong>${d.type || d.document_type}</strong></div>
          <div style="display:flex; justify-content:space-between;"><span>Date Filed:</span><strong>${new Date(d.date).toLocaleDateString()}</strong></div>
          <div style="display:flex; justify-content:space-between;"><span>Current Status:</span><span style="font-weight:800; color:${color}">${status}</span></div>
        </div>
        ${d.remarks ? `<div style="border-top:1px solid var(--border); padding-top:16px;"><p style="margin:0 0 4px; font-size:12px; color:var(--text-muted);">Remarks:</p><p style="margin:0; font-size:14px;">${d.remarks}</p></div>` : ''}
      </div>
    `;
  } catch (err) {
    resEl.innerHTML = `<div style="color:#dc2626; text-align:center; padding:20px;">System Error: Connection failed.</div>`;
  }
}

// --- ANNOUNCEMENTS ---
async function loadAnnouncements() {
  const listEl = document.getElementById('announcements-list');
  if (!listEl) return;

  try {
    const { data: alerts, error } = await supabaseClient
      .from('announcements')
      .select('*')
      .order('date', { ascending: false })
      .limit(3);

    if (error) throw error;

    if (!alerts || alerts.length === 0) {
      listEl.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-muted);">No current announcements.</p>`;
      return;
    }

    listEl.innerHTML = alerts.map(a => `
      <div class="announcement-card">
        <span class="ann-tag ${a.category?.toLowerCase() || 'general'}">${a.category || 'General'}</span>
        <h4 class="ann-title">${a.title}</h4>
        <p class="ann-content">${a.content}</p>
        <span class="ann-date">Posted — ${new Date(a.date).toLocaleDateString()}</span>
      </div>
    `).join('');
  } catch (err) {
    listEl.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#dc2626;">Network error. Please refresh.</p>`;
  }
}

// --- PROJECTS ---
async function loadProjects() {
  const listEl = document.getElementById('projects-list');
  if (!listEl) return;

  try {
    const { data: projects, error } = await supabaseClient
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    if (!projects || projects.length === 0) {
      listEl.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--text-muted);">No active projects listed.</p>`;
      return;
    }

    listEl.innerHTML = projects.map(p => `
      <div class="project-card">
        <h4 class="proj-title">${p.title}</h4>
        <span class="proj-cat">${p.category}</span>
        <div class="progress-container">
          <div class="progress-meta">
            <span>Progress</span>
            <span>${p.progress}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${p.progress}%"></div>
          </div>
        </div>
        <p style="font-size:14px; color:var(--text-muted);">${p.description || ''}</p>
        <span class="proj-status status-${p.status.toLowerCase()}">${p.status}</span>
      </div>
    `).join('');
  } catch (err) {
    listEl.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#dc2626;">Network error.</p>`;
  }
}

// --- SUBMISSIONS ---
async function submitClearance() {
  const name = document.getElementById('req-name').value.trim();
  const address = document.getElementById('req-address').value.trim();
  const docType = document.getElementById('req-doc-type').value;
  const purpose = document.getElementById('req-purpose').value;
  const btn = document.getElementById('submit-req-btn');
  const resEl = document.getElementById('modal-result-content');

  if (!name || !address || !docType || !purpose) {
    alert('Please complete the form.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Processing Application...';

  try {
    const docId = await dbGenerateId('documents', 'DOC');
    const ref = 'PAY-2026-' + Math.floor(100000 + Math.random() * 900000);

    const row = {
      id: docId,
      resident: name,
      type: docType,
      status: 'Pending',
      ref: ref,
      date: new Date().toISOString().split('T')[0],
      purpose: purpose,
      contact: 'Public Gateway'
    };

    await dbInsert('documents', row);

    document.getElementById('request-form-content').style.display = 'none';
    document.getElementById('modal-title').textContent = 'Submited Successfully';

    resEl.innerHTML = `
      <div style="text-align:center; padding:20px;">
        <div style="font-size:64px; margin-bottom:24px;">🎉</div>
        <h3 style="margin-bottom:12px;">Application Received!</h3>
        <p style="color:var(--text-muted); margin-bottom:24px;">Your request is being processed. Please keep your Control Number for tracking.</p>
        
        <div style="background:var(--primary-glow); padding:32px; border-radius:20px; border: 2px dashed var(--primary);">
          <span style="font-family:monospace; font-size:28px; font-weight:900; color:var(--primary); letter-spacing:2px;">${ref}</span>
        </div>

        <button onclick="closeModal()" class="btn btn-primary" style="margin-top:32px; width:100%; justify-content:center;">Understood</button>
      </div>
    `;
  } catch (err) {
    alert('Submission failed. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Submit Application';
  }
}

async function submitComplaint() {
  const name = document.getElementById('comp-name').value.trim();
  const category = document.getElementById('comp-category').value;
  const desc = document.getElementById('comp-desc').value.trim();
  const btn = document.getElementById('submit-comp-btn');
  const resEl = document.getElementById('modal-result-content');

  if (!name || !category || !desc) {
    alert('Please fill out all fields.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending Report...';

  try {
    const complaintId = await dbGenerateId('complaints', 'CMP');
    const row = {
      id: complaintId,
      complainant: name,
      category: category,
      description: desc,
      priority: 'Medium',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };

    await dbInsert('complaints', row);

    document.getElementById('complaint-form-content').style.display = 'none';
    document.getElementById('modal-title').textContent = 'Complaint Filed';

    resEl.innerHTML = `
      <div style="text-align:center; padding:20px;">
        <div style="font-size:64px; margin-bottom:24px;">📥</div>
        <h3 style="margin-bottom:12px;">Report Logged</h3>
        <p style="color:var(--text-muted); margin-bottom:24px;">Thank you for your feedback. We will investigate this concern immediately.</p>
        <div style="background:var(--background); padding:24px; border-radius:16px; font-family:monospace; font-size:18px; font-weight:800; border:1px solid var(--border);">
          ID: ${complaintId}
        </div>
        <button onclick="closeModal()" class="btn btn-primary" style="margin-top:32px; width:100%; justify-content:center;">Finsh</button>
      </div>
    `;
  } catch (err) {
    alert('Error submitting report.');
    btn.disabled = false;
    btn.textContent = 'Submit Complaint';
  }
}

// Global exports
window.openModal = openModal;
window.closeModal = closeModal;
window.doVerify = doVerify;
window.submitClearance = submitClearance;
window.submitComplaint = submitComplaint;
window.toggleMobileMenu = toggleMobileMenu;
