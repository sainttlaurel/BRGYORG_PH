// ══════════════════════════════════════════════════════════════
// REPORTS PAGE FUNCTIONS
// ══════════════════════════════════════════════════════════════

// Reports button handlers
var repBtns=document.querySelectorAll('#page-reports .pg-actions button');
if (repBtns[0]) repBtns[0].addEventListener('click', function(){
  openModal('Select Date Range',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('From Date','dr-from','text','e.g. Oct 1, 2023')+
      field('To Date','dr-to','text','e.g. Oct 31, 2023')+
      field('Preset','dr-preset','select','',['This Month','Last Month','Last 3 Months','Last 6 Months','Year to Date'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Apply Range','applyDateRange()')
  );
});
if (repBtns[1]) repBtns[1].addEventListener('click', function(){
  showToast('Compiling all reports…','info');
  setTimeout(function(){ showToast('All reports exported!','success'); },2000);
});

function openDateRangeModal(){
  openModal('Select Date Range',
    '<div style="display:flex;flex-direction:column;gap:14px;">'+
      field('From Date','dr-from','date','')+
      field('To Date','dr-to','date','')+
      field('Preset','dr-preset','select','',['Custom','This Month','Last Month','Last 3 Months','Last 6 Months','Year to Date'])+
    '</div>',
    btnSec('Cancel','closeModal()')+' '+btnPrim('Apply','applyDateRange()')
  );
}

function applyDateRange(){
  var from=val('dr-from')||'Start', to=val('dr-to')||'End';
  var dval=document.querySelector('.drb-val');
  if (dval) dval.textContent=from+' – '+to;
  closeModal(); showToast('Date range updated.','info');
}

function exportAllReports(){
  showToast('Compiling all reports...','info');
  setTimeout(function(){
    var content = '<h1>Barangay Payatas</h1><p class="meta">All Reports Export - ' + new Date().toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'}) + '</p>';
    content += '<div class="section"><h2>Summary</h2>';
    content += '<div class="row"><span class="label">Total Residents</span><span class="value">42,305</span></div>';
    content += '<div class="row"><span class="label">Pending Requests</span><span class="value">18</span></div>';
    content += '<div class="row"><span class="label">Active Complaints</span><span class="value">5</span></div>';
    content += '<div class="row"><span class="label">Ongoing Projects</span><span class="value">3</span></div></div>';
    exportToPDF(content, 'All Reports');
    showToast('All reports exported successfully!','success');
  },1500);
}

function showHistoricalData(){
  openModal('Historical Performance Data',
    '<table style="width:100%;border-collapse:collapse;">'+
      '<thead><tr style="background:#f8f9fa;">'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Month</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Requests</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Revenue</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Complaints</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Resolution</th>'+
      '</tr></thead><tbody>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">October 2023</td><td style="padding:12px 14px">2,410</td><td style="padding:12px 14px">₱142,850</td><td style="padding:12px 14px">42</td><td style="padding:12px 14px"><span class="badge badge-approved">94%</span></td></tr>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">September 2023</td><td style="padding:12px 14px">2,150</td><td style="padding:12px 14px">₱128,400</td><td style="padding:12px 14px">58</td><td style="padding:12px 14px"><span class="badge badge-pending">88%</span></td></tr>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">August 2023</td><td style="padding:12px 14px">2,890</td><td style="padding:12px 14px">₱156,200</td><td style="padding:12px 14px">35</td><td style="padding:12px 14px"><span class="badge badge-approved">97%</span></td></tr>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">July 2023</td><td style="padding:12px 14px">2,100</td><td style="padding:12px 14px">₱119,300</td><td style="padding:12px 14px">61</td><td style="padding:12px 14px"><span class="badge badge-pending">82%</span></td></tr>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">June 2023</td><td style="padding:12px 14px">3,120</td><td style="padding:12px 14px">₱174,600</td><td style="padding:12px 14px">28</td><td style="padding:12px 14px"><span class="badge badge-approved">98%</span></td></tr>'+
      '</tbody></table>'
  );
}

// Chart toggle handlers
document.querySelectorAll('.chart-toggle button').forEach(function(btn){
  btn.addEventListener('click', function(){
    var parent=this.parentElement;
    parent.querySelectorAll('button').forEach(function(b){ b.className='ctb-inactive'; });
    this.className='ctb-active';
    showToast('Chart view: '+this.textContent,'info');
  });
});

// View Historical Data link
var histLink=document.querySelector('.mt-head a');
if (histLink) histLink.addEventListener('click', function(e){
  e.preventDefault();
  openModal('Historical Performance Data',
    '<table style="width:100%;border-collapse:collapse;">'+
      '<thead><tr style="background:#f8f9fa;">'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Month</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Requests</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Revenue</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Complaints</th>'+
        '<th style="padding:10px 14px;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;text-align:left;">Resolution</th>'+
      '</tr></thead><tbody>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">October 2023</td><td style="padding:12px 14px">2,410</td><td style="padding:12px 14px">₱142,850</td><td style="padding:12px 14px">42</td><td style="padding:12px 14px"><span class="badge badge-approved">94%</span></td></tr>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">September 2023</td><td style="padding:12px 14px">2,150</td><td style="padding:12px 14px">₱128,400</td><td style="padding:12px 14px">58</td><td style="padding:12px 14px"><span class="badge badge-pending">88%</span></td></tr>'+
        '<tr style="border-top:1px solid rgba(195,198,215,0.15)"><td style="padding:12px 14px">August 2023</td><td style="padding:12px 14px">2,890</td><td style="padding:12px 14px">₱156,200</td><td style="padding:12px 14px">35</td><td style="padding:12px 14px"><span class="badge badge-approved">97%</span></td></tr>'+
      '</tbody></table>'
  );
});