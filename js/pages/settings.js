// ══════════════════════════════════════════════════════════════
// SETTINGS PAGE FUNCTIONS
// ══════════════════════════════════════════════════════════════

// Settings page button handler
var settingsSaveBtn=document.querySelector('#page-settings .btn-primary');
if (settingsSaveBtn) settingsSaveBtn.addEventListener('click', function(){ saveSettings(); });

function loadSettings() {
  var settings = JSON.parse(localStorage.getItem('barangay_settings')) || {};
  
  // Get all input fields in settings page and restore values
  var settingsPage = document.getElementById('page-settings');
  if (settingsPage) {
    var inputs = settingsPage.querySelectorAll('input[type="text"], input[type="email"]');
    inputs.forEach(function(input) {
      if (settings.name && input.value === 'Barangay Payatas') {
        input.value = settings.name || input.value;
      }
      if (settings.district && input.value.includes('Quezon City')) {
        input.value = settings.district || input.value;
      }
      if (settings.contact && input.value.includes('8123')) {
        input.value = settings.contact || input.value;
      }
      if (settings.email && input.type === 'email') {
        input.value = settings.email || input.value;
      }
    });
  }
  
  if (settings.notifications) {
    notifToggles = settings.notifications;
    // Update toggle visuals
    Object.keys(notifToggles).forEach(function(key) {
      var toggle = document.querySelector('[data-notif-label="' + key + '"]');
      if (toggle) {
        toggle.style.background = notifToggles[key] ? 'var(--primary)' : 'var(--surface-container-highest)';
        var dot = toggle.querySelector('div');
        if (dot) {
          dot.style.left = notifToggles[key] ? '21px' : '3px';
        }
      }
    });
  }
}

function saveSettings() {
  // Save barangay information
  var settingsPage = document.getElementById('page-settings');
  if (!settingsPage) {
    showToast('Settings page not found', 'error');
    return;
  }
  
  var inputs = settingsPage.querySelectorAll('input[type="text"], input[type="email"]');
  var barangayName = '', district = '', contact = '', email = '';
  
  inputs.forEach(function(input) {
    if (input.value === 'Barangay Payatas' || input.value.includes('Payatas')) {
      barangayName = input.value;
    } else if (input.value.includes('Quezon City')) {
      district = input.value;
    } else if (input.value.includes('8123') || input.value.startsWith('+63')) {
      contact = input.value;
    } else if (input.type === 'email') {
      email = input.value;
    }
  });
  
  // Save to localStorage
  localStorage.setItem('barangay_settings', JSON.stringify({
    name: barangayName,
    district: district,
    contact: contact,
    email: email,
    notifications: notifToggles
  }));
  
  showToast('Settings saved successfully!', 'success');
}

// Notification toggles in settings
document.querySelectorAll('#page-settings [style*="border-radius:99px"][style*="cursor:pointer"]').forEach(function(toggle, i){
  var labels=Object.keys(notifToggles);
  var label=labels[i];
  if (!label) return;
  toggle.setAttribute('data-notif-label', label);
  toggle.addEventListener('click', function(){
    notifToggles[label]=!notifToggles[label];
    var isOn=notifToggles[label];
    this.style.background=isOn?'var(--primary)':'var(--surface-container-highest)';
    var knob=this.querySelector('div');
    if (knob){ knob.style.left=isOn?'':'3px'; knob.style.right=isOn?'3px':''; }
    showToast(label+' notifications '+(isOn?'enabled':'disabled'), isOn?'success':'info');
  });
});