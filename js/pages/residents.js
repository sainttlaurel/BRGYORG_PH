// ══════════════════════════════════════════════════════════════
// RESIDENTS PAGE FUNCTIONS
// ══════════════════════════════════════════════════════════════

// Resident page button handlers
var resBtns = document.querySelectorAll('#page-residents .pg-actions button');
if (resBtns[0]) resBtns[0].addEventListener('click', function(){
  var csv=['ID,Name,Address,Purok,Phone,Email,Status'].concat(residents.map(function(r){
    return r.id+',"'+r.name+'","'+r.address+'",'+r.purok+','+r.phone+','+r.email+','+r.status;
  })).join('\n');
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='payatas_residents.csv'; a.click();
  showToast('Residents exported as CSV!','success');
});
if (resBtns[1]) resBtns[1].addEventListener('click', function(){ openAddResidentModal(); });

function openAddResidentModal(){
  openModal('Add New Resident',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Full Name','res-name','text','e.g. Juan dela Cruz')+
      field('Address','res-address','text','Street, Block, Lot')+
      field('Purok','res-purok','select','',['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7','Purok 8','Purok 9'])+
      field('Phone','res-phone','tel','+63 9XX XXX XXXX')+
      field('Email','res-email','email','email@example.com')+
      field('Status','res-status','select','',['Active','Inactive'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Save Resident','saveResident()')
  );
}

function saveResident(){
  var name=val('res-name'), address=val('res-address'), purok=val('res-purok'), phone=val('res-phone'), email=val('res-email'), status=val('res-status');
  if (!name||!address||!phone){ showToast('Please fill in all required fields.','error'); return; }
  var initials=name.split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
  var newId='PAY-2023-'+Math.floor(Math.random()*9000+1000);
  residents.push({ id:newId, initials:initials, color:'#dbeafe', tcolor:'#1e3a8a', name:name, address:address, purok:purok, phone:phone, email:email, status:status });
  renderResidentTable();
  closeModal();
  showToast(name+' added to the resident directory!','success');
}

function renderResidentTable(){
  // Try multiple possible tbody IDs
  var tbody = document.querySelector('#page-residents-tbody') || document.querySelector('#page-residents tbody');
  if (!tbody) {
    console.warn('Resident table tbody not found');
    return;
  }
  tbody.innerHTML=residents.map(function(r){
    return '<tr>'+
      '<td><div class="flex-center gap-3"><div class="av" style="background:'+r.color+';color:'+r.tcolor+'">'+r.initials+'</div>'+
        '<div><div class="font-bold">'+r.name+'</div><div class="text-xs text-muted">ID: '+r.id+'</div></div></div></td>'+
      '<td><div class="font-bold text-sm">'+r.address+'</div><div class="text-xs text-muted">'+r.purok+'</div></td>'+
      '<td><div><div class="flex-center gap-2 text-sm"><span class="material-symbols-outlined" style="font-size:14px;color:var(--on-surface-variant)">phone</span>'+r.phone+'</div>'+
        '<div class="flex-center gap-2 text-xs text-muted" style="margin-top:3px"><span class="material-symbols-outlined" style="font-size:13px">mail</span>'+r.email+'</div></div></td>'+
      '<td><span class="badge '+(r.status==='Active'?'res-status-active':'res-status-inactive')+'">'+r.status+'</span></td>'+
      '<td><div class="tbl-actions" style="opacity:1">'+
        '<button class="tbl-action-btn" onclick="editResident(\''+r.id+'\')"><span class="material-symbols-outlined">edit</span></button>'+
        '<button class="tbl-action-btn danger" onclick="deleteResident(\''+r.id+'\')"><span class="material-symbols-outlined">delete</span></button>'+
      '</div></td></tr>';
  }).join('');
  // Resident inline search
  var resSearch=document.querySelector('#page-residents input[type=text]');
  if (resSearch) {
    resSearch.oninput=function(){
      var q=this.value.toLowerCase();
      tbody.querySelectorAll('tr').forEach(function(tr){ tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none'; });
    };
  }
  // Status filter
  var resSel=document.querySelector('#page-residents select');
  if (resSel) {
    resSel.onchange=function(){
      var v=this.value;
      tbody.querySelectorAll('tr').forEach(function(tr){ tr.style.display=(!v||v==='All Statuses'||tr.textContent.includes(v))?'':'none'; });
    };
  }
}

function editResident(id){
  var r=residents.find(function(x){ return x.id===id; });
  if (!r) return;
  openModal('Edit Resident — '+r.name,
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      fieldVal('Full Name','res-name-e','text',r.name)+
      fieldVal('Address','res-address-e','text',r.address)+
      field('Purok','res-purok-e','select','',['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7','Purok 8','Purok 9'])+
      fieldVal('Phone','res-phone-e','tel',r.phone)+
      fieldVal('Email','res-email-e','email',r.email)+
      field('Status','res-status-e','select','',['Active','Inactive'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Save Changes','updateResident(\''+id+'\')')
  );
  setTimeout(function(){
    var ps=document.getElementById('res-purok-e'); if(ps){ Array.from(ps.options).forEach(function(o){ if(o.value===r.purok)o.selected=true; }); }
    var ss=document.getElementById('res-status-e'); if(ss){ Array.from(ss.options).forEach(function(o){ if(o.value===r.status)o.selected=true; }); }
  },50);
}

function updateResident(id){
  var r=residents.find(function(x){ return x.id===id; }); if (!r) return;
  r.name=val('res-name-e')||r.name; r.address=val('res-address-e')||r.address; r.purok=val('res-purok-e')||r.purok;
  r.phone=val('res-phone-e')||r.phone; r.email=val('res-email-e')||r.email; r.status=val('res-status-e')||r.status;
  renderResidentTable(); closeModal(); showToast('Resident record updated!','success');
}

function deleteResident(id){
  var r=residents.find(function(x){ return x.id===id; }); if (!r) return;
  openModal('Confirm Delete',
    '<div style="text-align:center;padding:16px 0;"><div style="width:56px;height:56px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">'+
      '<span class="material-symbols-outlined" style="font-size:28px;color:#dc2626">delete</span></div>'+
      '<p style="font-size:14px;color:var(--on-surface-variant);line-height:1.6;">Remove <strong>'+r.name+'</strong> from the resident directory? This cannot be undone.</p></div>',
    btnSec('Cancel','closeModal()')+' <button onclick="confirmDeleteResident(\''+id+'\')" style="'+btnPrimStyle()+'background:linear-gradient(135deg,#dc2626,#ef4444);">Delete Resident</button>'
  );
}

function confirmDeleteResident(id){
  var name=residents.find(function(x){ return x.id===id; })?.name;
  residents=residents.filter(function(x){ return x.id!==id; });
  renderResidentTable(); closeModal(); showToast((name||'Resident')+' removed from directory.','info');
}

function generateResidentPDF(id) {
  var r = residents.find(function(x){ return x.id===id; });
  if (!r) return;
  var content = '<h1>Barangay Payatas</h1><p class="meta">Resident Certificate</p>';
  content += '<div class="section"><div class="row"><span class="label">Resident ID</span><span class="value">' + r.id + '</span></div>';
  content += '<div class="row"><span class="label">Name</span><span class="value">' + r.name + '</span></div>';
  content += '<div class="row"><span class="label">Address</span><span class="value">' + r.address + '</span></div>';
  content += '<div class="row"><span class="label">Purok</span><span class="value">' + r.purok + '</span></div>';
  content += '<div class="row"><span class="label">Status</span><span class="value">' + r.status + '</span></div></div>';
  content += '<div style="margin-top:20px;"><p style="font-size:14px;">This is to certify that the above individual is a registered resident of Barangay Payatas.</p>';
  content += '<p style="font-size:12px;color:#64748b;margin-top:10px;">Document ID: CERT-' + Math.floor(Math.random()*90000+10000) + '</p></div>';
  exportToPDF(content, 'Resident Certificate - ' + r.name);
  showToast('Generating resident certificate for ' + r.name, 'success');
}

function exportResidentsCSV() {
  var headers = ['ID', 'Name', 'Address', 'Purok', 'Phone', 'Email', 'Status'];
  var data = residents.map(function(r) {
    return [r.id, '"' + r.name + '"', '"' + r.address + '"', r.purok, r.phone, r.email, r.status];
  });
  exportToCSV(data, 'payatas_residents', headers);
  showToast('Residents data exported to CSV!', 'success');
}