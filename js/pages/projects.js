// ══════════════════════════════════════════════════════════════
// PROJECTS PAGE FUNCTIONS
// ══════════════════════════════════════════════════════════════

// Projects button handlers
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

// Render projects table/grid
function renderProjectsTable() {
  // If there's a proj-grid, render cards
  var projGrid = document.querySelector('#page-projects .proj-grid');
  if (projGrid && projects.length > 0) {
    projGrid.innerHTML = projects.map(function(p) {
      var statusColors = {
        'Ongoing': { bg: 'rgba(0,74,198,0.9)', gradient: '#1e3a8a,#2563eb' },
        'Completed': { bg: 'rgba(5,150,105,0.9)', gradient: '#064e3b,#10b981' },
        'Planned': { bg: 'rgba(148,55,0,0.9)', gradient: '#7c2d12,#ea580c' }
      };
      var colors = statusColors[p.status] || statusColors['Planned'];
      
      return '<div class="proj-card">' +
        '<div class="proj-img" style="background:linear-gradient(135deg,' + colors.gradient + ')">' +
          '<div class="proj-img-bg" style="display:flex;align-items:center;justify-content:center"><span class="material-symbols-outlined" style="font-size:64px;color:rgba(255,255,255,0.2)">account_tree</span></div>' +
          '<div class="proj-status-tag" style="background:' + colors.bg + '">' + p.status + '</div>' +
        '</div>' +
        '<div class="proj-body">' +
          '<div class="proj-title">' + p.title + '</div>' +
          '<div class="proj-desc">' + (p.description || 'No description available') + '</div>' +
          '<div class="proj-footer">' +
            '<div class="proj-progress-label"><span>Progress</span><span>' + p.progress + '%</span></div>' +
            '<div class="progress-bar"><div class="progress-fill" style="width:' + p.progress + '%"></div></div>' +
            '<div class="proj-meta">' +
              '<div class="proj-meta-item"><span class="mkey">Budget</span><span class="mval">₱' + p.budget.toLocaleString() + '</span></div>' +
              '<div class="proj-meta-item"><span class="mkey">Timeline</span><span class="mval">' + (p.target_date || 'N/A') + '</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }
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