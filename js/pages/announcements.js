// ══════════════════════════════════════════════════════════════
// ANNOUNCEMENTS PAGE FUNCTIONS
// ══════════════════════════════════════════════════════════════

// Announcements button handlers
var annFilterBtn=document.querySelector('#page-announcements .pg-actions button');
if (annFilterBtn) annFilterBtn.addEventListener('click', function(){
  openModal('Filter Announcements',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Category','ann-filter-cat','select','',['All Categories','Advisory','Events','Governance','Schedule','Sports','Health'])+
      field('Date Range','ann-filter-date','select','',['All Time','This Week','This Month','Last Month'])+
    '</div>',
    btnSec('Clear','closeModal()')+' '+btnPrim('Apply','closeModal();showToast(\'Filter applied.\',\'info\');')
  );
});

function showFilterAnnouncementsModal(){
  openModal('Filter Announcements',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('Category','ann-filter-cat','select','',['All Categories','Advisory','Events','Governance','Schedule','Sports','Health','General'])+
      field('Date Range','ann-filter-date','select','',['All Time','This Week','This Month','Last Month'])+
    '</div>',
    btnSec('Clear','closeModal();renderAnnouncements();showToast(\'Filters cleared.\',\'info\')')+' '+btnPrim('Apply','applyAnnouncementFilters()')
  );
}

function applyAnnouncementFilters(){
  var cat = val('ann-filter-cat');
  var dateRange = val('ann-filter-date');
  closeModal();
  showToast('Announcement filters applied: '+cat+' | '+dateRange,'info');
}

function openNewAnnouncementModal(){
  openModal('Post New Announcement',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      '<div style="background:#dcfce7;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:4px;">'+
        '<span class="material-symbols-outlined" style="color:#065f46;font-size:20px;">campaign</span>'+
        '<span style="font-size:12px;font-weight:700;color:#065f46;">New Community Announcement</span></div>'+
      field('Title','ann-title-i','text','Announcement headline')+
      field('Category','ann-cat-i','select','',['Advisory','Events','Governance','Schedule','Sports','Health','General'])+
      field('Content','ann-content-i','textarea','Write the full announcement here...')+
      field('Valid Until','ann-date-i','text','e.g. November 30, 2023')+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Post Announcement','saveAnnouncement()')
  );
}

function saveAnnouncement(){
  var title=val('ann-title-i');
  if (!title){ showToast('Please enter an announcement title.','error'); return; }
  closeModal(); showToast('Announcement posted to the community board!','success');
}

// Render announcements
function renderAnnouncements(){
  var annGrid = document.querySelector('#page-announcements .ann-grid');
  if (!annGrid) return;
  
  // If announcements array exists and has data, render from it
  if (typeof announcements !== 'undefined' && announcements.length > 0) {
    annGrid.innerHTML = announcements.map(function(a) {
      var categoryColors = {
        'Advisory': { bg: '#943700', gradient: '#1e293b,#334155' },
        'Events': { bg: '#16a34a', gradient: '#064e3b,#10b981' },
        'Governance': { bg: '#2563eb', gradient: '#1e3a8a,#2563eb' },
        'Health': { bg: '#dc2626', gradient: '#7f1d1d,#b91c1c' },
        'General': { bg: '#7c3aed', gradient: '#4c1d95,#7c3aed' }
      };
      var colors = categoryColors[a.category] || categoryColors['General'];
      
      return '<div class="ann-card">' +
        '<div class="ann-img" style="background:linear-gradient(135deg,' + colors.gradient + ')">' +
          '<div class="ann-img-placeholder"><span class="material-symbols-outlined" style="font-size:56px;color:rgba(255,255,255,0.2)">campaign</span></div>' +
          '<div class="ann-cat" style="background:' + colors.bg + '">' + a.category + '</div>' +
        '</div>' +
        '<div class="ann-body">' +
          '<div class="ann-date"><span class="material-symbols-outlined">calendar_month</span>' + new Date(a.published_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) + '</div>' +
          '<div class="ann-title">' + a.title + '</div>' +
          '<div class="ann-excerpt">' + (a.content || 'No content available') + '</div>' +
          '<div class="ann-footer"><span class="ann-link">Read More</span><span class="material-symbols-outlined" style="color:var(--primary);font-size:18px">arrow_forward</span></div>' +
        '</div>' +
      '</div>';
    }).join('');
  }
  
  // Add click handlers for announcement cards
  document.querySelectorAll('.ann-link').forEach(function(link){
    link.style.cursor='pointer';
    link.addEventListener('click', function(){
      var card=link.closest('.ann-card');
      var title=(card&&card.querySelector('.ann-title'))?card.querySelector('.ann-title').textContent:'Announcement';
      var excerpt=(card&&card.querySelector('.ann-excerpt'))?card.querySelector('.ann-excerpt').textContent:'';
      openModal(title,'<p style="font-size:13.5px;color:var(--on-surface-variant);line-height:1.7;">'+excerpt+'</p>'+
        '<p style="margin-top:14px;font-size:13px;color:#94a3b8;">Full document available at the Barangay Hall.</p>');
    });
  });
  
  showToast('Announcements refreshed.','info');
}

// Featured: Read Full Guidelines
document.querySelectorAll('button').forEach(function(btn){
  if (btn.textContent.trim()==='Read Full Guidelines'){
    btn.addEventListener('click', function(){
      openModal('Vaccination Drive — Full Guidelines',
        '<div style="display:flex;flex-direction:column;gap:14px;font-size:13.5px;color:var(--on-surface-variant);line-height:1.7;">'+
          '<p><strong>Date:</strong> Saturday, October 28, 2023 | <strong>Time:</strong> 8:00 AM – 4:00 PM</p>'+
          '<p><strong>Venue:</strong> Barangay Payatas Multi-Purpose Hall</p>'+
          '<hr style="border:none;border-top:1px solid rgba(195,198,215,0.2);">'+
          '<p><strong>Services:</strong> Flu vaccinations, Pediatric check-ups, Dental screenings, Free medicines</p>'+
          '<p><strong>Who can join:</strong> All Payatas residents. Bring one valid ID and your family health card.</p>'+
          '<p>Walk-ins are welcome. Families with children under 5 and senior citizens get priority lanes.</p>'+
        '</div>'
      );
    });
  }
});

// Add Announcement card click handler
var annAddCard=document.querySelector('.ann-add-card');
if (annAddCard) annAddCard.addEventListener('click', function(){ openNewAnnouncementModal(); });

function printAnnouncement(id) {
  var content = '<h1>Barangay Payatas</h1><p class="meta">Official Announcement</p>';
  content += '<div class="section"><h2>Community Notice</h2><p>This announcement has been posted by the Barangay Administration for community awareness.</p></div>';
  content += '<div style="margin-top:20px;"><p>For inquiries, please contact the Barangay Hall.</p></div>';
  printContent(content, 'Announcement');
  showToast('Printing announcement', 'info');
}