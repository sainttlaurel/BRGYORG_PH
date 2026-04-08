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
  loadSuggestions();
  loadPolls();
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

// Hoist to module scope so all functions can reference them
let _openModal = null;
let _closeModal = null;

function openModal(type) { if (_openModal) _openModal(type); }
function closeModal() { if (_closeModal) _closeModal(); }

function initModals() {
  const overlay = document.querySelector('.modal-overlay');
  if (!overlay) return;

  _closeModal = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset modal state
    const modal = document.querySelector('.modal');
    if (modal) modal.classList.remove('active');

    // Clear and Hide Forms
    const reqForm = document.getElementById('request-form-content');
    const compForm = document.getElementById('complaint-form-content');
    const volForm = document.getElementById('volunteer-form-content');
    const resContent = document.getElementById('modal-result-content');
    
    if (reqForm) reqForm.style.display = 'none';
    if (compForm) compForm.style.display = 'none';
    if (volForm) volForm.style.display = 'none';
    if (resContent) {
      resContent.style.display = 'none';
      resContent.innerHTML = '';
    }
  };

  _openModal = (type) => {
    const modal = document.querySelector('.modal');
    const title = document.getElementById('modal-title');
    
    const reqForm = document.getElementById('request-form-content');
    const compForm = document.getElementById('complaint-form-content');
    const volForm = document.getElementById('volunteer-form-content');
    const resContent = document.getElementById('modal-result-content');

    // Clear previous
    if (reqForm) reqForm.style.display = 'none';
    if (compForm) compForm.style.display = 'none';
    if (volForm) volForm.style.display = 'none';
    if (resContent) resContent.style.display = 'none';

    if (type === 'clearance' || type === 'apply') {
      title.textContent = 'Document Application';
      if (reqForm) reqForm.style.display = 'block';
    } else if (type === 'complaint') {
      title.textContent = 'File a Complaint';
      if (compForm) compForm.style.display = 'block';
    } else if (type === 'volunteer') {
      title.textContent = 'Volunteer Registry';
      if (volForm) volForm.style.display = 'block';
    } else if (type === 'verify') {
      title.textContent = 'Verification Results';
      if (resContent) resContent.style.display = 'block';
    }

    overlay.classList.add('active');
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  window.openModal = openModal;
  window.closeModal = closeModal;
}

// --- VERIFY & TABS LOGIC ---
function initVerifyBtn() {
  const stripBtn = document.getElementById('strip-verify-btn');
  if (stripBtn) {
    stripBtn.addEventListener('click', () => {
      const val = document.getElementById('strip-verify-input').value;
      if (!val) return;
      doVerify(val);
    });
  }

  const resBtn = document.getElementById('resident-verify-btn');
  if (resBtn) {
    resBtn.addEventListener('click', () => {
      doResidentVerify();
    });
  }
}

function switchVerifyTab(tabId) {
  document.querySelectorAll('.verify-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.verify-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === 'tab-' + tabId);
  });
}

async function doResidentVerify() {
  const input = document.getElementById('resident-verify-input');
  const query = input ? input.value.trim() : '';
  if (!query) return;

  if (window.openModal) window.openModal('verify');
  const title = document.getElementById('modal-title');
  if (title) title.textContent = 'Resident Verification';

  const resEl = document.getElementById('modal-result-content');
  if (!resEl) return;

  resEl.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">
    <span class="material-symbols-outlined" style="font-size:32px; animation: spin 2s linear infinite;">sync</span>
    <p>Verifying resident record...</p>
  </div>`;

  try {
    const isId = query.startsWith('PAY-');
    let dbQuery = supabaseClient.from('residents').select('*');
    if (isId) {
      dbQuery = dbQuery.eq('id', query);
    } else {
      dbQuery = dbQuery.ilike('fname', `%${query}%`).or(`lname.ilike.%${query}%`);
    }

    const { data: res, error } = await dbQuery.limit(1);
    if (error) throw error;

    if (!res || res.length === 0) {
      resEl.innerHTML = `
        <div style="text-align:center; padding:40px; background:var(--background); border-radius:16px;">
          <span class="material-symbols-outlined" style="font-size:64px; color:#dc2626; margin-bottom:16px;">person_off</span>
          <h4 style="color:#dc2626; margin-bottom:8px; font-size:20px;">No Record Found</h4>
          <p style="font-size:14px; color:var(--text-muted);">"${query}" is not in our official resident directory.</p>
        </div>
      `;
      return;
    }

    const r = res[0];
    const status = r.status || 'Inactive';
    const isActive = status === 'Active';
    const color = isActive ? 'var(--primary)' : '#f59e0b';
    const border = isActive ? 'var(--primary)' : '#f59e0b';

    resEl.innerHTML = `
      <div class="modal-result-card" style="border-left: 4px solid ${border}">
        <div class="modal-result-header">
          <div style="width:48px; height:48px; background:${color}; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white;">
            <span class="material-symbols-outlined">${isActive ? 'person_check' : 'person_search'}</span>
          </div>
          <div>
            <h4 style="margin:0; font-size:18px; font-weight:900; color:${color}">${isActive ? 'Verified Resident' : 'Special Status'}</h4>
            <p style="color:var(--text-muted); margin:2px 0 0; font-size:12px; font-family:'DM Mono',monospace;">ID: ${r.id}</p>
          </div>
        </div>

        <div style="display:grid; gap:16px;">
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:8px;">
            <span style="color:var(--text-muted); font-size:13px;">Full Legal Name</span>
            <span style="font-weight:700;">${r.fname} ${r.lname}</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:8px;">
            <span style="color:var(--text-muted); font-size:13px;">Assigned Purok</span>
            <span style="font-weight:700;">${r.purok}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted); font-size:13px;">Current Standing</span>
            <span style="font-weight:900; color:${color}">${status}</span>
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    resEl.innerHTML = `<div style="color:#dc2626; text-align:center; padding:20px;">System Error: Connection failed.</div>`;
    console.error('Resident Verify Error:', err.message);
  }
}

async function doVerify(queryArg) {
  // If no arg, check the main strip input OR the modal input
  const inputMain = document.getElementById('strip-verify-input');
  const inputModal = document.getElementById('verify-query');

  const query = queryArg || (inputModal ? inputModal.value.trim() : '') || (inputMain ? inputMain.value.trim() : '');
  if (!query) return;

  if (window.openModal) window.openModal('verify');

  // Also sync the modal input field if it's not the source
  if (inputModal && inputModal.value.trim().toUpperCase() !== query.toUpperCase()) {
    inputModal.value = query;
  }
  const resEl = document.getElementById('modal-result-content');
  if (!resEl) return;

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
    let border = 'var(--border)';

    if (isApproved) {
      icon = 'verified';
      color = '#10b981';
      border = '#10b981';
    } else if (isRejected) {
      icon = 'cancel';
      color = '#ef4444';
      border = '#ef4444';
    }

    resEl.innerHTML = `
      <div class="modal-result-card" style="border-left: 4px solid ${border}">
        <div class="modal-result-header">
          <div style="width:48px; height:48px; background:${color}; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white;">
            <span class="material-symbols-outlined">${icon}</span>
          </div>
          <div>
            <h4 style="margin:0; font-size:18px; font-weight:900; color:${color}">${isApproved ? 'Authentic Record' : isRejected ? 'Invalid / Cancelled' : 'Record Pending'}</h4>
            <p style="color:var(--text-muted); margin:2px 0 0; font-size:12px; font-family:'DM Mono',monospace;">REF: ${d.ref || d.id}</p>
          </div>
        </div>

        <div style="display:grid; gap:16px;">
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:8px;">
            <span style="color:var(--text-muted); font-size:13px;">Document Type</span>
            <span style="font-weight:700;">${d.type || d.document_type}</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:8px;">
            <span style="color:var(--text-muted); font-size:13px;">Issued To</span>
            <span style="font-weight:700;">${d.resident || d.resident_name}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted); font-size:13px;">Status</span>
            <span style="font-weight:900; color:${color}">${status.toUpperCase()}</span>
          </div>
          ${d.remarks ? `
          <div style="background:var(--background); padding:12px; border-radius:12px; font-size:13px; font-style:italic; border-top: 1px dashed var(--border);">
            " ${d.remarks} "
          </div>` : ''}
        </div>
      </div>
    `;
  } catch (err) {
    resEl.innerHTML = `<div style="color:#dc2626; text-align:center; padding:20px;">System Error: Connection failed.</div>`;
    console.error('Verify Error:', err.message);
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

    listEl.innerHTML = alerts.map(a => {
      const reactions = a.reactions || { likes: 0, hearts: 0 };
      const hasLiked = localStorage.getItem(`reacted_announcement_${a.id}_like`);
      const hasHearted = localStorage.getItem(`reacted_announcement_${a.id}_heart`);
      
      return `
        <div class="announcement-card" id="ann-${a.id}">
          <span class="ann-tag ${a.category?.toLowerCase() || 'general'}">${a.category || 'General'}</span>
          <h4 class="ann-title">${a.title}</h4>
          <p class="ann-content">${a.content}</p>
          <span class="ann-date">Posted — ${new Date(a.date).toLocaleDateString()}</span>
          
          <div class="card-actions">
            <div class="reactions-group">
              <button class="reaction-btn ${hasLiked ? 'active like' : ''}" onclick="handleReaction('announcement', '${a.id}', 'like')">
                <span class="material-symbols-outlined">thumb_up</span>
                <span class="count">${reactions.likes || 0}</span>
              </button>
              <button class="reaction-btn ${hasHearted ? 'active heart' : ''}" onclick="handleReaction('announcement', '${a.id}', 'heart')">
                <span class="material-symbols-outlined">favorite</span>
                <span class="count">${reactions.hearts || 0}</span>
              </button>
            </div>
            <div class="share-toolbar">
              <button class="share-btn" onclick="shareContent('facebook', '${a.title}', 'ann-${a.id}')" title="Share to Facebook"><span class="material-symbols-outlined">share</span></button>
              <button class="share-btn" onclick="shareContent('instagram', '${a.title}', 'ann-${a.id}')" title="Share to Instagram"><span class="material-symbols-outlined">photo_camera</span></button>
            </div>
          </div>
        </div>
      `;
    }).join('');
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

    listEl.innerHTML = projects.map(p => {
      const reactions = p.reactions || { likes: 0, hearts: 0 };
      const hasLiked = localStorage.getItem(`reacted_project_${p.id}_like`);
      const hasHearted = localStorage.getItem(`reacted_project_${p.id}_heart`);

      return `
        <div class="project-card" id="proj-${p.id}">
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
          <p style="font-size:14px; color:var(--text-muted); margin-bottom:16px;">${p.description || ''}</p>
          <span class="proj-status status-${p.status.toLowerCase()}">${p.status}</span>
          
          <div class="card-actions">
            <div class="reactions-group">
              <button class="reaction-btn ${hasLiked ? 'active like' : ''}" onclick="handleReaction('project', '${p.id}', 'like')">
                <span class="material-symbols-outlined">thumb_up</span>
                <span class="count">${reactions.likes || 0}</span>
              </button>
              <button class="reaction-btn ${hasHearted ? 'active heart' : ''}" onclick="handleReaction('project', '${p.id}', 'heart')">
                <span class="material-symbols-outlined">favorite</span>
                <span class="count">${reactions.hearts || 0}</span>
              </button>
            </div>
            <div class="share-toolbar">
              <button class="share-btn" onclick="shareContent('facebook', '${p.title}', 'proj-${p.id}')" title="Share to Facebook"><span class="material-symbols-outlined">share</span></button>
              <button class="share-btn" onclick="shareContent('tiktok', '${p.title}', 'proj-${p.id}')" title="Share to TikTok"><span class="material-symbols-outlined">play_circle</span></button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    listEl.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#dc2626;">Network error.</p>`;
  }
}

// --- SUBMISSIONS ---
async function submitClearance() {
  const name = document.getElementById('req-name')?.value.trim();
  const address = document.getElementById('req-address')?.value.trim();
  const docType = document.getElementById('req-doc-type')?.value;
  const purpose = document.getElementById('req-purpose')?.value;
  const btn = document.getElementById('submit-req-btn');
  const resEl = document.getElementById('modal-result-content');

  if (!name || !docType || !purpose) {
    alert('Please fill in all required fields.');
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

  try {
    const docId = await dbGenerateId('documents', 'DOC');
    const year = new Date().getFullYear();
    // docId is like "DOC-001" — extract the numeric part
    const numPart = docId.replace(/\D/g, '');
    const ref = `PAY-${year}-${String(numPart).padStart(6, '0')}`;

    const row = {
      id: docId,
      resident: name,
      type: docType,
      purpose: purpose,
      status: 'Pending',
      ref: ref,
      date: new Date().toISOString().split('T')[0],
      contact: 'N/A'
    };

    await dbInsert('documents', row);

    // Hide form, show result
    const reqForm = document.getElementById('request-form-content');
    const title = document.getElementById('modal-title');
    if (reqForm) reqForm.style.display = 'none';
    if (title) title.textContent = 'Application Submitted';
    if (resEl) {
      resEl.style.display = 'block';
      resEl.innerHTML = `
        <div style="text-align:center; padding:20px;">
          <span class="material-symbols-outlined" style="font-size:64px; color:var(--primary); margin-bottom:24px; display:block;">task_alt</span>
          <h3 style="margin-bottom:12px;">Application Submitted!</h3>
          <p style="color:var(--text-muted); margin-bottom:24px;">Your document request has been received. Please save your reference number and visit the Barangay Hall to claim your document.</p>
          <div style="background:var(--background); padding:24px; border-radius:16px; font-family:monospace; font-size:20px; font-weight:800; border:2px solid var(--primary); color:var(--primary); letter-spacing:2px;">
            ${ref}
          </div>
          <p style="font-size:12px; color:var(--text-muted); margin-top:12px;">Processing time: 1–3 business days</p>
          <button onclick="closeModal()" class="btn btn-primary" style="margin-top:28px; width:100%; justify-content:center;">Done</button>
        </div>
      `;
    }
  } catch (err) {
    alert('Error submitting application. Please try again.');
    console.error('Submit Error:', err.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Submit Application'; }
  }
}

async function submitComplaint() {
  const name = document.getElementById('comp-name').value.trim();
  const category = document.getElementById('comp-category').value;
  const desc = document.getElementById('comp-desc').value.trim();
  const btn = document.getElementById('submit-comp-btn');
  const resEl = document.getElementById('modal-result-content');

  if (!name || !category || !desc) {
    alert('Please complete the form.');
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

    // Show the result panel
    if (resEl) resEl.style.display = 'block';

    resEl.innerHTML = `
      <div style="text-align:center; padding:20px;">
        <div style="font-size:64px; margin-bottom:24px;">📥</div>
        <h3 style="margin-bottom:12px;">Report Logged</h3>
        <p style="color:var(--text-muted); margin-bottom:24px;">Thank you for your feedback. We will investigate this concern immediately.</p>
        <div style="background:var(--background); padding:24px; border-radius:16px; font-family:monospace; font-size:18px; font-weight:800; border:1px solid var(--border);">
          ID: ${complaintId}
        </div>
        <button onclick="closeModal()" class="btn btn-primary" style="margin-top:32px; width:100%; justify-content:center;">Finish</button>
      </div>
    `;
  } catch (err) {
    alert('Error submitting report.');
    btn.disabled = false;
    btn.textContent = 'Submit Complaint';
  }
}

// --- SOCIAL HUB: REACTIONS ---
async function handleReaction(targetType, targetId, reactionType) {
  const storageKey = `reacted_${targetType}_${targetId}_${reactionType}`;
  if (localStorage.getItem(storageKey)) {
    alert("You've already reacted to this!");
    return;
  }

  try {
    const table = targetType === 'announcement' ? 'announcements' : 'projects';
    const { data: item, error: fetchErr } = await supabaseClient.from(table).select('reactions').eq('id', targetId).single();
    if (fetchErr) throw fetchErr;

    const reactions = item.reactions || { likes: 0, hearts: 0 };
    if (reactionType === 'like') reactions.likes = (reactions.likes || 0) + 1;
    if (reactionType === 'heart') reactions.hearts = (reactions.hearts || 0) + 1;

    const { error: upErr } = await supabaseClient.from(table).update({ reactions }).eq('id', targetId);
    if (upErr) throw upErr;

    localStorage.setItem(storageKey, 'true');
    
    // UI Feedback (Silent reload or local update)
    if (targetType === 'announcement') loadAnnouncements();
    else loadProjects();
  } catch (err) {
    console.error('Reaction Error:', err.message);
  }
}

function shareContent(platform, title, id) {
  const url = window.location.href + '#' + id;
  const text = `Check out this from Barangay Payatas: ${title}`;
  
  if (platform === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  } else if (platform === 'instagram') {
    // Note: Direct sharing to Feed via web is limited; we'll copy link or suggest mobile share
    navigator.clipboard.writeText(url).then(() => alert('Link copied for Instagram sharing!'));
  } else if (platform === 'tiktok') {
    navigator.clipboard.writeText(url).then(() => alert('Link copied for TikTok sharing!'));
  }
}

// --- CITIZENS' VOICE LOGIC ---
async function loadSuggestions() {
  const list = document.getElementById('suggestions-list');
  if (!list) return;

  try {
    const { data, error } = await supabaseClient.from('suggestions').select('*').eq('status', 'published').order('created_at', { ascending: false });
    if (error) throw error;

    if (data.length === 0) return;

    list.innerHTML = data.map(s => `
      <div class="suggestion-card">
        <div class="suggestion-meta">
          <span class="material-symbols-outlined">person</span>
          <strong>${s.name || 'Anonymous Resident'}</strong>
          <span>• ${new Date(s.created_at).toLocaleDateString()}</span>
        </div>
        <p style="margin:0; font-size:15px; line-height:1.6;">${s.content}</p>
        ${s.admin_reply ? `
        <div class="suggestion-qa">
          <div class="suggestion-meta">
            <span class="admin-badge">Official Reply</span>
          </div>
          <p style="margin:0; font-style:italic; color:var(--text-main);">${s.admin_reply}</p>
        </div>` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error('Suggestions Load Error:', err.message);
  }
}

async function submitSuggestion() {
  const name = document.getElementById('voice-name').value.trim();
  const content = document.getElementById('voice-content').value.trim();
  if (!content) return alert('Please enter your suggestion.');

  // Simplified usage tracking with fingerprint or local session id
  let userId = localStorage.getItem('payatas_voice_id');
  if (!userId) {
    userId = 'anon_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('payatas_voice_id', userId);
  }

  try {
    // Check quota
    const { data: limitData } = await supabaseClient.from('suggestion_limits').select('*').eq('identifier', userId).single();
    const isVerified = limitData?.is_verified || false;
    const count = limitData?.count || 0;
    const max = isVerified ? 5 : 2;

    if (count >= max) {
      alert(`Limit reached! Guests can submit up to 2 items. Verified residents up to 5.`);
      return;
    }

    const { error: subErr } = await supabaseClient.from('suggestions').insert({
      name: name || 'Anonymous',
      content: content,
      status: 'pending'
    });
    if (subErr) throw subErr;

    // Update quota
    if (!limitData) {
      await supabaseClient.from('suggestion_limits').insert({ identifier: userId, count: 1 });
    } else {
      await supabaseClient.from('suggestion_limits').update({ count: count + 1 }).eq('identifier', userId);
    }

    alert('Your suggestion has been submitted for moderation. Thank you for your input!');
    document.getElementById('voice-content').value = '';
    document.getElementById('voice-name').value = '';
  } catch (err) {
    console.error('Submission Error:', err.message);
  }
}

// --- VOLUNTEER LOGIC ---
async function submitVolunteer() {
  const name = document.getElementById('vol-name')?.value.trim();
  const contact = document.getElementById('vol-contact')?.value.trim();
  const conditions = document.getElementById('vol-conditions')?.value.trim();
  const btn = document.getElementById('submit-vol-btn');

  if (!name || !contact) return alert('Please provide your name and contact info.');

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Processing Application...';
  }

  try {
    const { error } = await supabaseClient.from('volunteer_signups').insert({
      full_name: name,
      contact: contact,
      body_conditions: conditions || ''
    });
    if (error) throw error;

    const volForm = document.getElementById('volunteer-form-content');
    if (volForm) {
      volForm.innerHTML = `
        <div style="text-align:center; padding:20px;">
          <span class="material-symbols-outlined" style="font-size:64px; color:var(--primary); margin-bottom:24px; display:block;">volunteer_activism</span>
          <h3 style="margin-bottom:12px;">Application Logged!</h3>
          <p style="color:var(--text-muted); margin-bottom:24px;">Thank you for your willingness to serve! Please proceed to the Barangay Hall for your personal walk-in and physical check-in.</p>
          <button onclick="closeModal()" class="btn btn-primary" style="width:100%; justify-content:center;">Understood</button>
        </div>
      `;
    }
  } catch (err) {
    alert('Error submitting application. Please try again.');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Apply to Volunteer';
    }
  }
}

// --- POLLS LOGIC ---
async function loadPolls() {
  const list = document.getElementById('polls-list');
  if (!list) return;

  try {
    const { data: polls, error } = await supabaseClient
      .from('polls')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) throw error;

    if (!polls || polls.length === 0) {
      list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted);">No active polls at this time. Check back soon!</p>';
      return;
    }

    list.innerHTML = polls.map(p => {
      const hasVoted = localStorage.getItem(`voted_poll_${p.id}`);
      const votes = p.votes || {};
      const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0) || 1;

      return `
        <div class="poll-card" id="poll-${p.id}">
          <h5 style="margin-bottom:16px; font-size:17px; font-weight:700;">${p.question}</h5>
          <div style="display:grid; gap:10px;">
            ${p.options.map((opt, i) => {
              const count = votes[i] || 0;
              const perc = Math.round((count / totalVotes) * 100);
              if (hasVoted) {
                return `
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;">
                      <span>${opt}</span><strong>${perc}%</strong>
                    </div>
                    <div class="progress-bar-bg" style="height:8px; background:var(--border); border-radius:99px;">
                      <div style="width:${perc}%; height:100%; background:var(--primary); border-radius:99px; transition:width 0.5s ease;"></div>
                    </div>
                  </div>`;
              } else {
                return `<button class="btn btn-secondary" style="text-align:left; padding:12px 20px; width:100%;" onclick="votePoll('${p.id}', ${i})">${opt}</button>`;
              }
            }).join('')}
          </div>
          ${hasVoted ? '<p style="margin-top:12px; font-size:11px; color:var(--text-muted); text-align:center;">✓ You already voted in this poll.</p>' : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Polls Load Error:', err.message);
    list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted);">Could not load polls.</p>';
  }
}

async function votePoll(pollId, optionIndex) {
  const storageKey = `voted_poll_${pollId}`;
  if (localStorage.getItem(storageKey)) return;

  try {
    const { data: poll, error: fetchErr } = await supabaseClient
      .from('polls').select('votes').eq('id', pollId).single();
    if (fetchErr) throw fetchErr;

    const votes = poll.votes || {};
    votes[optionIndex] = (votes[optionIndex] || 0) + 1;

    const { error: upErr } = await supabaseClient.from('polls').update({ votes }).eq('id', pollId);
    if (upErr) throw upErr;

    localStorage.setItem(storageKey, 'true');
    loadPolls();
  } catch (err) {
    console.error('Voting Error:', err.message);
  }
}

// ===================== GLOBAL EXPORTS =====================
// openModal and closeModal are already hoisted to module scope above
window.doVerify = doVerify;
window.doResidentVerify = doResidentVerify;
window.switchVerifyTab = switchVerifyTab;
window.submitClearance = submitClearance;
window.submitComplaint = submitComplaint;
window.submitSuggestion = submitSuggestion;
window.submitVolunteer = submitVolunteer;
window.handleReaction = handleReaction;
window.shareContent = shareContent;
window.votePoll = votePoll;
window.toggleMobileMenu = toggleMobileMenu;
window.toggleTheme = () => {
  const html = document.documentElement;
  const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('payatas-theme', newTheme);
};

