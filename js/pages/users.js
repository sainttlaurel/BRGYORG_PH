// ══════════════════════════════════════════════════════════════
// USERS PAGE FUNCTIONS (Admin Only)
// ══════════════════════════════════════════════════════════════

// Users button handlers
document.querySelectorAll('#page-users .pg-actions button').forEach(function(btn){
  if (btn.textContent.trim().includes('Export')){
    btn.addEventListener('click', function(){ exportUsersCSV(); });
  }
  if (btn.textContent.trim().includes('Add')){
    btn.addEventListener('click', function(){ openAddUserModal(); });
  }
});

function exportUsersCSV(){
  var headers = ['ID', 'Username', 'Name', 'Email', 'Role', 'Status', 'Last Login'];
  var data = users.map(function(u){
    return [u.id, u.username, '"'+u.name+'"', u.email, u.role, u.status, u.lastLogin || 'Never'];
  });
  exportToCSV(data, 'payatas_users', headers);
  showToast('Users data exported to CSV!','success');
}

function openAddUserModal(){
  openModal('Add New User',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Username','new-user-name','text','e.g. juan_dela Cruz')+
      field('Full Name','new-user-fullname','text','e.g. Juan dela Cruz')+
      field('Email','new-user-email','email','e.g. juan@payatas.gov.ph')+
      field('Role','new-user-role','select','',['Super Administrator','Administrator','Staff','Reader'])+
      field('Status','new-user-status','select','',['Active','Inactive'])+
      field('Password','new-user-pass','password','Initial password')+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Create User','createNewUser()')
  );
}

function createNewUser(){
  var username = val('new-user-name');
  var fullname = val('new-user-fullname');
  var email = val('new-user-email');
  var role = val('new-user-role') || 'Staff';
  var status = val('new-user-status') || 'Active';
  var pass = val('new-user-pass');
  
  if (!username || !fullname || !email){
    showToast('Please fill in all required fields.','error');
    return;
  }
  
  var initials = getInitials(fullname);
  var newId = 'USR-' + Math.floor(Math.random()*900+100);
  
  var newUser = {
    id: newId,
    username: username,
    name: fullname,
    email: email,
    role: role,
    status: status,
    password: pass || 'password123',
    lastLogin: 'Never'
  };
  
  users.push(newUser);
  localStorage.setItem('payatas_users', JSON.stringify(users));
  
  renderUsersTable();
  updateUserStats();
  closeModal();
  showToast('New user "' + fullname + '" created successfully!','success');
}

function renderUsersTable(){
  var tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = users.map(function(u){
    var statusBadge = u.status === 'Active' ? 
      '<span class="badge res-status-active">Active</span>' : 
      '<span class="badge res-status-inactive">Inactive</span>';
    var roleBadge = u.role === 'Super Administrator' || u.role === 'Administrator' ?
      '<span style="background:#dbeafe;color:#1e3a8a;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;">'+u.role+'</span>' :
      '<span style="background:#f1f5f9;color:#475569;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;">'+u.role+'</span>';
    
    return '<tr>'+
      '<td><div class="flex-center gap-3"><div class="av" style="background:#dbeafe;color:#1e3a8a">'+getInitials(u.name)+'</div>'+
        '<div><div class="font-bold">'+u.name+'</div><div class="text-xs text-muted">'+u.username+'</div></div></div></td>'+
      '<td>'+roleBadge+'</td>'+
      '<td class="text-muted">'+u.email+'</td>'+
      '<td class="text-muted text-sm">'+u.lastLogin+'</td>'+
      '<td>'+statusBadge+'</td>'+
      '<td><div class="tbl-actions" style="opacity:1">'+
        '<button class="tbl-action-btn" onclick="editUser(\''+u.id+'\')"><span class="material-symbols-outlined">edit</span></button>'+
        '<button class="tbl-action-btn danger" onclick="deleteUserAccount(\''+u.id+'\')"><span class="material-symbols-outlined">delete</span></button>'+
      '</div></td></tr>';
  }).join('');
  
  // Add search functionality
  var searchInput = document.querySelector('#page-users input[type="text"]');
  if (searchInput) {
    searchInput.oninput = function() {
      var q = this.value.toLowerCase();
      tbody.querySelectorAll('tr').forEach(function(tr) {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    };
  }
}

function editUser(id){
  var u = users.find(function(x){ return x.id === id; });
  if (!u) return;
  
  openModal('Edit User — '+u.name,
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      fieldVal('Username','edit-user-name',u.username)+
      fieldVal('Full Name','edit-user-fullname',u.name)+
      fieldVal('Email','edit-user-email',u.email)+
      field('Role','edit-user-role','select','',['Super Administrator','Administrator','Staff','Reader'])+
      field('Status','edit-user-status','select','',['Active','Inactive'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Save Changes','updateUserRecord(\''+id+'\')')
  );
  
  setTimeout(function(){
    var roleSel = document.getElementById('edit-user-role');
    if (roleSel){
      Array.from(roleSel.options).forEach(function(o){ if (o.value === u.role) o.selected = true; });
    }
    var statusSel = document.getElementById('edit-user-status');
    if (statusSel){
      Array.from(statusSel.options).forEach(function(o){ if (o.value === u.status) o.selected = true; });
    }
  },50);
}

function updateUserRecord(id){
  var u = users.find(function(x){ return x.id === id; });
  if (!u) return;
  
  u.username = val('edit-user-name') || u.username;
  u.name = val('edit-user-fullname') || u.name;
  u.email = val('edit-user-email') || u.email;
  u.role = val('edit-user-role') || u.role;
  u.status = val('edit-user-status') || u.status;
  
  localStorage.setItem('payatas_users', JSON.stringify(users));
  renderUsersTable();
  updateUserStats();
  closeModal();
  showToast('User record updated!','success');
}

function deleteUserAccount(id){
  var u = users.find(function(x){ return x.id === id; });
  if (!u) return;
  
  openModal('Confirm Delete',
    '<div style="text-align:center;padding:16px 0;"><div style="width:56px;height:56px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">'+
      '<span class="material-symbols-outlined" style="font-size:28px;color:#dc2626">delete</span></div>'+
      '<p style="font-size:14px;color:var(--on-surface-variant);line-height:1.6;">Remove user <strong>'+u.name+'</strong> from the system? This cannot be undone.</p></div>',
    btnSec('Cancel','closeModal()')+' <button onclick="confirmDeleteUser(\''+id+'\')" style="'+btnPrimStyle()+'background:linear-gradient(135deg,#dc2626,#ef4444);">Delete User</button>'
  );
}

function confirmDeleteUser(id){
  var name = users.find(function(x){ return x.id === id; })?.name;
  users = users.filter(function(x){ return x.id !== id; });
  localStorage.setItem('payatas_users', JSON.stringify(users));
  renderUsersTable();
  updateUserStats();
  closeModal();
  showToast((name || 'User') + ' removed from system.','info');
}

function updateUserStats(){
  var total = users.length;
  var admins = users.filter(function(u){ return u.role === 'Super Administrator' || u.role === 'Administrator'; }).length;
  var staff = users.filter(function(u){ return u.role === 'Staff'; }).length;
  
  var totalEl = document.getElementById('total-users');
  var adminEl = document.getElementById('admin-count');
  var staffEl = document.getElementById('staff-count');
  
  if (totalEl) totalEl.textContent = total;
  if (adminEl) adminEl.textContent = admins;
  if (staffEl) staffEl.textContent = staff;
}