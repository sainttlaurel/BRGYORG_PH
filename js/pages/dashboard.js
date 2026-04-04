// ══════════════════════════════════════════════════════════════
// DASHBOARD PAGE FUNCTIONS
// ══════════════════════════════════════════════════════════════

// Dashboard button handlers
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