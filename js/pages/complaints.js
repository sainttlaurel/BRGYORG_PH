// ══════════════════════════════════════════════════════════════
// COMPLAINTS PAGE FUNCTIONS
// ══════════════════════════════════════════════════════════════

// Complaints button handlers
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
      '<div style="background:#fee2e2;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:4px;">'+
        '<span class="material-symbols-outlined" style="color:#991b1b;font-size:20px;">gavel</span>'+
        '<span style="font-size:12px;font-weight:700;color:#991b1b;">Submit New Complaint</span></div>'+
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

// Render complaints table
function renderComplaintsTable() {
  var tbody = document.querySelector('#page-complaints tbody');
  if (!tbody) return;
  
  tbody.innerHTML = complaints.map(function(c) {
    var priorityColor = c.priority === 'Urgent' ? '#dc2626' : (c.priority === 'Standard' ? '#3b82f6' : '#10b981');
    var statusClass = c.status === 'Resolved' ? 'badge-resolved' : (c.status === 'In Progress' ? 'badge-inprogress' : 'badge-pending');
    
    return '<tr>' +
      '<td><div class="flex-center gap-2"><div style="width:8px;height:8px;border-radius:50%;background:' + priorityColor + ';flex-shrink:0"></div><span class="font-bold">' + c.category + '</span></div></td>' +
      '<td><span class="badge ' + statusClass + '">' + c.status + '</span></td>' +
      '<td class="text-muted">' + c.submitter + '</td>' +
      '<td class="text-muted text-sm">' + c.date + '</td>' +
      '</tr>';
  }).join('');
}

// Filter chips functionality
document.querySelectorAll('#page-complaints .filter-chip').forEach(function(chip){
  chip.addEventListener('click', function(){
    var parent=this.parentElement;
    parent.querySelectorAll('.filter-chip').forEach(function(c){ c.className='filter-chip chip-inactive'; });
    this.className='filter-chip chip-active';
  });
});

// Filter tags functionality
document.querySelectorAll('#page-complaints .filter-tag').forEach(function(tag){
  tag.addEventListener('click', function(){
    this.classList.toggle('active-tag');
    var isActive=this.classList.contains('active-tag');
    this.style.background=isActive?'rgba(0,74,198,0.08)':'';
    this.style.borderColor=isActive?'rgba(0,74,198,0.4)':'';
    this.style.color=isActive?'var(--primary)':'';
  });
});

// Resolution report (click on resolved complaint)
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

// Load more button
document.querySelectorAll('button').forEach(function(btn){
  if (btn.textContent.trim().startsWith('Load 10 more'))
    btn.addEventListener('click', function(){ showToast('Loading more complaints…','info'); });
});

function printComplaintRecord(id) {
  var content = '<h1>Barangay Payatas</h1><p class="meta">Complaint Acknowledgment</p>';
  content += '<div class="section"><div class="row"><span class="label">Case ID</span><span class="value">#CP-' + Math.floor(Math.random()*9000+1000) + '</span></div>';
  content += '<div class="row"><span class="label">Date Filed</span><span class="value">' + new Date().toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) + '</span></div>';
  content += '<div class="row"><span class="label">Status</span><span class="value"><span class="badge badge-pending">Processing</span></span></div></div>';
  content += '<div style="margin-top:20px;"><p>Your complaint has been received and is being processed. Reference case number for follow-ups.</p></div>';
  printContent(content, 'Complaint Acknowledgment');
  showToast('Printing complaint acknowledgment', 'info');
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