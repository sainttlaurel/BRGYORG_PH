/**
 * Payatas Landing - Public Services Logic
 * Handles Navbar, Modals, and Supabase Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initModals();
  initVerifyBtn();
  loadAnnouncements();
  loadProjects();
});

// --- NAVBAR ---
function initNavbar() {
  const nav = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
}

// --- MODALS ---
function initModals() {
  const overlay = document.querySelector('.modal-overlay');
  const closeModal = () => {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    // Clear forms
    document.querySelectorAll('.form-control').forEach(el => el.value = '');
    document.getElementById('modal-result-content').innerHTML = '';
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  window.openModal = (type) => {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Switch content based on type
    const requestForm = document.getElementById('request-form-content');
    const complaintForm = document.getElementById('complaint-form-content');
    const verifyForm = document.getElementById('verify-form-content');
    const title = document.getElementById('modal-title');

    // Reset shared content
    document.getElementById('modal-result-content').innerHTML = '';

    if (type === 'apply') {
      title.textContent = 'Clearance Application';
      requestForm.style.display = 'block';
      complaintForm.style.display = 'none';
      verifyForm.style.display = 'none';
    } else if (type === 'complaint') {
      title.textContent = 'Submit a Complaint';
      requestForm.style.display = 'none';
      complaintForm.style.display = 'block';
      verifyForm.style.display = 'none';
    } else {
      title.textContent = 'Verify Document';
      requestForm.style.display = 'none';
      complaintForm.style.display = 'none';
      verifyForm.style.display = 'block';
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
      document.getElementById('verify-query').value = val;
      doVerify(val);
    });
  }
}

async function doVerify(queryArg) {
  const query = queryArg || document.getElementById('verify-query').value.trim().toUpperCase();
  const resEl = document.getElementById('modal-result-content');
  if (!query) return;

  resEl.innerHTML = `<div class="loading-state">Searching records...</div>`;

  try {
    // We check both ref and verification_code (if exists)
    // Actually, in the clearance system MD, it uses 'ref' or 'verification_code'
    // Based on the schema search: residents(id, name, address, purok, phone, status)
    // and documents(id, resident_name, document_type, status, ref, date)
    
    const { data: docs, error } = await supabaseClient
      .from('documents')
      .select('*')
      .or(`ref.eq."${query}",id.eq."${query}"`)
      .limit(1);

    if (error) throw error;

    if (!docs || docs.length === 0) {
      resEl.innerHTML = `
        <div style="text-align:center;padding:20px;">
          <div style="font-size:40px;margin-bottom:10px;">❌</div>
          <h4 style="color:#dc2626;margin-bottom:5px;">Record Not Found</h4>
          <p style="font-size:13px;color:#64748b;">We couldn't find any clearance matching "${query}". Please check the control number.</p>
        </div>
      `;
      return;
    }

    const d = docs[0];
    const isValid = d.status === 'Approved';

    resEl.innerHTML = `
      <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid ${isValid ? '#22c55e' : '#e2e8f0'}">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:15px;">
          <div style="font-size:24px;">${isValid ? '✅' : '⏳'}</div>
          <div>
            <h4 style="margin:0;font-size:16px;">${isValid ? 'Authentic Document' : 'Pending Review'}</h4>
            <small style="color:#64748b;">Control No: ${d.ref || d.id}</small>
          </div>
        </div>
        <div style="font-size:13px;display:grid;gap:8px;">
          <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Issued To:</span><strong style="color:#0f172a;">${d.resident || d.resident_name}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Type:</span><strong style="color:#0f172a;">${d.type || d.document_type}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Date:</span><strong style="color:#0f172a;">${new Date(d.date).toLocaleDateString()}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#64748b;">Status:</span><span style="font-weight:700;color:${isValid ? '#16a34a' : '#d97706'}">${d.status}</span></div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Verify error:', err);
    resEl.innerHTML = `<div style="color:#dc2626;font-size:13px;text-align:center;">Error connecting to database. Please try again.</div>`;
  }
}

// --- ANNOUNCEMENTS LOGIC ---
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
      listEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);">No current alerts.</div>`;
      return;
    }

    listEl.innerHTML = alerts.map(a => `
      <div class="announcement-card">
        <span class="ann-tag ${a.category || 'general'}">${a.category || 'General'}</span>
        <h4 class="ann-title">${a.title}</h4>
        <p class="ann-content">${a.content}</p>
        <span class="ann-date">Posted on ${new Date(a.date).toLocaleDateString()}</span>
      </div>
    `).join('');
  } catch (err) {
    console.warn('Failed to load announcements:', err);
    listEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#dc2626;">System is temporarily offline.</div>`;
  }
}

// --- PROJECTS LOGIC ---
async function loadProjects() {
  const listEl = document.getElementById('projects-list');
  if (!listEl) return;

  try {
    const { data: projects, error } = await supabaseClient
      .from('projects')
      .select('id, title, category, status, progress, description')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    if (!projects || projects.length === 0) {
      listEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);">No active projects listed.</div>`;
      return;
    }

    listEl.innerHTML = projects.map(p => `
      <div class="project-card">
        <h4 class="proj-title">${p.title}</h4>
        <span class="proj-cat">${p.category}</span>
        <div class="progress-container">
          <div class="progress-meta">
            <span>Overall Progress</span>
            <span>${p.progress}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${p.progress}%"></div>
          </div>
        </div>
        <p style="font-size:13px;color:var(--text-muted);">${p.description || ''}</p>
        <span class="proj-status status-${p.status.toLowerCase()}">${p.status}</span>
      </div>
    `).join('');
  } catch (err) {
    console.warn('Failed to load projects:', err);
    listEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#dc2626;">System is temporarily offline.</div>`;
  }
}

// --- REQUEST LOGIC ---
async function submitClearance() {
  const name = document.getElementById('req-name').value.trim();
  const address = document.getElementById('req-address').value.trim();
  const docType = document.getElementById('req-doc-type').value;
  const purpose = document.getElementById('req-purpose').value;
  const btn = document.getElementById('submit-req-btn');
  const resEl = document.getElementById('modal-result-content');

  if (!name || !address || !docType || !purpose) {
    alert('Please fill out all required fields.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    // Generate document ID and truncate date to 10 chars (YYYY-MM-DD)
    const docId = await dbGenerateId('documents', 'DOC');
    const ref = 'PAY-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
    
    const row = {
      id: docId,
      resident: name,
      type: docType,
      status: 'Pending',
      ref: ref,
      date: new Date().toISOString().split('T')[0],
      purpose: purpose,
      contact: 'Public Link' // Placeholder for public submissions
    };

    const data = await dbInsert('documents', row);

    document.getElementById('request-form-content').style.display = 'none';
    document.getElementById('modal-title').textContent = 'Request Successful';
    
    resEl.innerHTML = `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:50px;margin-bottom:15px;">✅</div>
        <h3 style="margin-bottom:10px;">Request Submitted!</h3>
        <p style="font-size:14px;color:#64748b;margin-bottom:20px;">Your clearance request has been sent to the barangay office for review. Please save your reference number for tracking.</p>
        
        <div style="position:relative;background:#f1f5f9;padding:20px 15px;border-radius:12px;border:1px dashed #cbd5e1;">
          <div style="font-family:monospace;font-size:22px;font-weight:800;color:#1e40af;letter-spacing:1.5px;margin-bottom:10px;">
            ${ref}
          </div>
          <button onclick="copyToClipboard('${ref}', this)" style="background:#1e40af;color:white;border:none;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-weight:600;">
            <span class="material-symbols-outlined" style="font-size:16px">content_copy</span> Copy Number
          </button>
        </div>

        <button onclick="closeModal()" class="btn btn-primary" style="margin-top:25px;width:100%;justify-content:center;">Got it, thank you</button>
      </div>
    `;
  } catch (err) {
    console.error('Submit error:', err);
    alert('Submission failed. Your message: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Submit Request';
  }
}

// --- COMPLAINT LOGIC ---
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
  btn.textContent = 'Sending...';

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
    document.getElementById('modal-title').textContent = 'Report Filed';
    
    resEl.innerHTML = `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:50px;margin-bottom:15px;">📥</div>
        <h3 style="margin-bottom:10px;">Complaint Received</h3>
        <p style="font-size:14px;color:#64748b;margin-bottom:20px;">Thank you for bringing this to our attention. Our team will review the issue and take action as needed.</p>
        <div style="background:#f1f5f9;padding:15px;border-radius:12px;font-family:monospace;font-size:18px;font-weight:700;color:#1e40af;border:1px dashed #cbd5e1;">
          TRACKING ID: ${complaintId}
        </div>
        <button onclick="closeModal()" class="btn btn-primary" style="margin-top:25px;width:100%;justify-content:center;">Understood</button>
      </div>
    `;
  } catch (err) {
    console.error('Complaint error:', err);
    alert('Failed to submit complaint. Please try again later.');
    btn.disabled = false;
    btn.textContent = 'Submit Complaint';
  }
}

// Helper: Copy to Clipboard
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px">check</span> Copied!`;
    btn.style.background = '#16a34a';
    setTimeout(() => {
      btn.innerHTML = originalContent;
      btn.style.background = '#1e40af';
    }, 2000);
  });
}

// Global exports
window.doVerify = doVerify;
window.submitClearance = submitClearance;
window.submitComplaint = submitComplaint;
