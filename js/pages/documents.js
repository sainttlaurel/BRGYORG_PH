// ══════════════════════════════════════════════════════════════
// DOCUMENTS PAGE FUNCTIONS
// ══════════════════════════════════════════════════════════════

// Documents button handlers
var docBtns = document.querySelectorAll('#page-documents .pg-actions button, #page-documents .btn-primary, #page-documents .btn-secondary');
document.querySelectorAll('#page-documents button').forEach(function(btn){
  if (btn.textContent.trim()==='Clear Filters') btn.addEventListener('click', function(){
    document.querySelectorAll('#page-documents .filter-select').forEach(function(s){ s.selectedIndex=0; });
    renderDocumentsTable(); showToast('Filters cleared.','info');
  });
  if (btn.textContent.trim()==='Apply View') btn.addEventListener('click', function(){ renderDocumentsTable(); showToast('View updated.','info'); });
});

var docAddBtn = document.querySelector('#page-documents .btn-primary');
if (docAddBtn && docAddBtn.textContent.includes('New')) docAddBtn.addEventListener('click', function(){ openNewRequestModal(); });

function openNewRequestModal(){
  openModal('New Document Request',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#dbeafe;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:4px;">'+
        '<span class="material-symbols-outlined" style="color:#1e3a8a;font-size:20px;">description</span>'+
        '<span style="font-size:12px;font-weight:700;color:#1e3a8a;">New Document Request</span></div>'+
      field('Resident Name','doc-name','text','Full name of resident')+
      field('Document Type','doc-type','select','',['Barangay Clearance','Certificate of Indigency','Business Permit','Residency Certificate','Good Moral Certificate'])+
      field('Purpose','doc-purpose','text','Reason for request')+
      field('Priority','doc-prio','select','',['Standard','Urgent'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Submit Request','saveDocRequest()')
  );
}

function saveDocRequest(){
  var name=val('doc-name'), type=val('doc-type');
  if (!name){ showToast('Please enter a resident name.','error'); return; }
  var initials=name.split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
  var newId='DOC-'+Math.floor(Math.random()*900+100);
  var now=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  documents.unshift({ id:newId, initials:initials, color:'#dbeafe', tcolor:'#1e3a8a', name:name, type:type, date:now, status:'Pending', rejectReason:'' });
  renderDocumentsTable(); closeModal(); showToast('Document request for '+name+' submitted!','success');
}

function renderDocumentsTable(){
  var tbody=document.getElementById('documents-table-body') || document.querySelector('#page-documents tbody');
  if (!tbody) return;
  tbody.innerHTML=documents.map(function(d){
    var badge='', actions='';
    if (d.status==='Pending'){
      badge='<span class="badge badge-pending"><span class="badge-dot"></span>Pending</span>';
      actions='<button class="tbl-action-btn" onclick="viewDoc(\''+d.id+'\')"><span class="material-symbols-outlined">visibility</span></button>'+
              '<button class="tbl-action-btn" style="color:#16a34a" onclick="approveDoc(\''+d.id+'\')"><span class="material-symbols-outlined">check_circle</span></button>'+
              '<button class="tbl-action-btn danger" onclick="rejectDoc(\''+d.id+'\')"><span class="material-symbols-outlined">cancel</span></button>';
    } else if (d.status==='Approved'){
      badge='<span class="badge badge-approved"><span class="badge-dot"></span>Approved</span>';
      actions='<button class="tbl-action-btn" style="display:flex;align-items:center;gap:5px;padding:6px 10px;color:var(--primary);background:rgba(0,74,198,0.08);border-radius:8px;font-size:11.5px;font-weight:700;" onclick="generateDoc(\''+d.id+'\')">'+
              '<span class="material-symbols-outlined" style="font-size:15px">picture_as_pdf</span>Generate</button>';
    } else if (d.status==='Ready for Pickup'){
      badge='<span class="badge badge-pickup"><span class="badge-dot"></span>Ready for Pickup</span>';
      actions='<button class="tbl-action-btn" onclick="viewDoc(\''+d.id+'\')"><span class="material-symbols-outlined">visibility</span></button>'+
              '<button class="tbl-action-btn" onclick="printDoc(\''+d.id+'\')"><span class="material-symbols-outlined">print</span></button>';
    } else if (d.status==='Rejected'){
      badge='<span class="badge badge-rejected"><span class="badge-dot"></span>Rejected</span>';
      actions='<button class="tbl-action-btn" style="font-size:11.5px;font-weight:700;padding:6px 10px;" onclick="viewRejectReason(\''+d.id+'\')">View Reason</button>';
    }
    return '<tr><td><div class="flex-center gap-3"><div class="av" style="background:'+d.color+';color:'+d.tcolor+'">'+d.initials+'</div><span class="font-bold">'+d.name+'</span></div></td>'+
      '<td class="text-muted">'+d.type+'</td><td class="text-muted text-sm">'+d.date+'</td>'+
      '<td>'+badge+'</td><td><div class="tbl-actions" style="opacity:1">'+actions+'</div></td></tr>';
  }).join('');
}

function viewDoc(id){
  var d=documents.find(function(x){ return x.id===id; }); if (!d) return;
  
  var statusInfo = '';
  if (d.status === 'Rejected' && d.rejectReason){
    statusInfo = '<div style="background:#fee2e2;padding:12px;border-radius:8px;margin-top:10px;"><strong>Rejection Reason:</strong><br>'+d.rejectReason+'</div>';
  }
  
  openModal('Document Request — '+d.id,
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">'+
      kv('Resident Name', d.name)+
      kv('Document Type', d.type)+
      kv('Request Date', d.date)+
      kv('Status', d.status)+
      kv('Initials', d.initials)+
      kv('Color', d.color)+
    '</div>' + statusInfo +
    '<div style="margin-top:20px;display:flex;gap:10px;">'+
      btnPrim('Print', 'printDoc(\''+d.id+'\')') +
      btnSec('Close', 'closeModal()') +
    '</div>'
  );
}

function approveDoc(id){
  var d=documents.find(function(x){ return x.id===id; }); if (!d) return;
  openModal('Approve Request',
    '<p style="font-size:13.5px;color:var(--on-surface-variant);line-height:1.6;">Approve <strong>'+d.type+'</strong> for <strong>'+d.name+'</strong>? This will notify the resident.</p>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Approve','confirmApproveDoc(\''+id+'\')')
  );
}

function confirmApproveDoc(id){
  var d=documents.find(function(x){ return x.id===id; });
  if (d) d.status='Approved';
  renderDocumentsTable(); closeModal(); showToast('Request approved for '+(d?d.name:'resident')+'!','success');
}

function rejectDoc(id){
  var d=documents.find(function(x){ return x.id===id; }); if (!d) return;
  openModal('Reject Request',
    '<p style="font-size:13.5px;color:var(--on-surface-variant);line-height:1.6;margin-bottom:14px;">Provide a reason for rejecting <strong>'+d.type+'</strong> from <strong>'+d.name+'</strong>.</p>'+
    '<textarea id="reject-reason" rows="3" placeholder="e.g. Incomplete supporting documents..." style="width:100%;padding:10px 12px;border-radius:9px;border:1.5px solid rgba(195,198,215,0.4);font-size:13px;font-family:Inter,sans-serif;outline:none;resize:none;"></textarea>',
    btnSec('Cancel','closeModal()')+' <button onclick="confirmRejectDoc(\''+id+'\')" style="'+btnPrimStyle()+'background:linear-gradient(135deg,#dc2626,#ef4444);">Reject</button>'
  );
}

function confirmRejectDoc(id){
  var d=documents.find(function(x){ return x.id===id; });
  if (d){ d.status='Rejected'; d.rejectReason=(document.getElementById('reject-reason')||{}).value||'No reason provided.'; }
  renderDocumentsTable(); closeModal(); showToast('Request from '+(d?d.name:'resident')+' rejected.','info');
}

function viewRejectReason(id){
  var d=documents.find(function(x){ return x.id===id; });
  openModal('Rejection Reason','<p style="font-size:14px;line-height:1.6;color:var(--on-surface-variant);">'+(d&&d.rejectReason?d.rejectReason:'No reason was recorded.')+'</p>');
}

function generateDoc(id){
  var d=documents.find(function(x){ return x.id===id; });
  if (d){ d.status='Ready for Pickup'; }
  showToast('Generating PDF for '+(d?d.name:'resident')+'… Ready for download!','success');
  setTimeout(function(){ renderDocumentsTable(); },600);
}

function printDoc(id){
  var d=documents.find(function(x){ return x.id===id; });
  showToast('Sending '+(d?d.type:'document')+' to printer…','info');
}

function printDocumentRequest(id) {
  var d = documents.find(function(x){ return x.id===id; });
  if (!d) return;
  var badgeClass = d.status === 'Approved' ? 'badge-approved' : (d.status === 'Rejected' ? 'badge-rejected' : 'badge-pending');
  var content = '<h1>Barangay Payatas</h1><p class="meta">Document Request Certificate</p>';
  content += '<div class="section"><div class="row"><span class="label">Request ID</span><span class="value">' + d.id + '</span></div>';
  content += '<div class="row"><span class="label">Resident Name</span><span class="value">' + d.name + '</span></div>';
  content += '<div class="row"><span class="label">Document Type</span><span class="value">' + d.type + '</span></div>';
  content += '<div class="row"><span class="label">Request Date</span><span class="value">' + d.date + '</span></div>';
  content += '<div class="row"><span class="label">Status</span><span class="value"><span class="badge ' + badgeClass + '">' + d.status + '</span></span></div></div>';
  content += '<div style="margin-top:20px;"><h2>Certification</h2><p>This certifies that the above document request has been processed by the Barangay Payatas Administration. For verification, please contact the barangay office.</p></div>';
  printContent(content, 'Document Request - ' + d.id);
  showToast('Printing document request for ' + d.name, 'info');
}

function exportDocumentsCSV() {
  var headers = ['ID', 'Resident Name', 'Document Type', 'Date', 'Status'];
  var data = documents.map(function(d) {
    return [d.id, '"' + d.name + '"', d.type, d.date, d.status];
  });
  exportToCSV(data, 'payatas_documents', headers);
  showToast('Documents data exported to CSV!', 'success');
}