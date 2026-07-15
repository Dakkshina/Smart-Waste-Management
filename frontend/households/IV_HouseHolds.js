/* ════════════════════════════════════════════════════════════
   SmartWaste Resident App — Phase 4
   Features: Login · Live Tracking · Pickup Status · Feedback
             Complaints · Compliance History · Segregation Guide
   ════════════════════════════════════════════════════════════ */

// ── MOCK DATA ──────────────────────────────────────────────
const RESIDENT = {
  phone: '9001122334', password: 'house123',
  name: 'John Doe', initials: 'JD',
  address: '12 Main Street, Zone A',
  houseNo: 'H-03', qrToken: 'QR-ZONE-A-003',
  lat: 10.9612, lng: 78.0772,
};

const COLLECTOR_LIVE = {
  name: 'Ravi Kumar', initials: 'RK', empId: 'EMP-001',
  rating: 4.8, phone: '+919876543210',
  lat: 10.9595, lng: 78.0758,
};

const HISTORY = [
  { date:'Jul 11', collector:'Ravi Kumar', status:'collected', seg:'pass', segNote:'All bins properly segregated ✅' },
  { date:'Jul 09', collector:'Ravi Kumar', status:'collected', seg:'pass', segNote:'Organic and dry bins correct ✅' },
  { date:'Jul 07', collector:'Ravi Kumar', status:'collected', seg:'fail', segNote:'Mixed plastic in organic bin ⚠️' },
  { date:'Jul 04', collector:'Meena Devi', status:'collected', seg:'pass', segNote:'Excellent segregation ✅' },
  { date:'Jul 02', collector:'Ravi Kumar', status:'missed',   seg:null,   segNote:'Not available / gate locked' },
  { date:'Jun 30', collector:'Ravi Kumar', status:'collected', seg:'pass', segNote:'All bins properly segregated ✅' },
  { date:'Jun 28', collector:'Ravi Kumar', status:'collected', seg:'fail', segNote:'Mixed e-waste found ⚠️' },
  { date:'Jun 25', collector:'Meena Devi', status:'collected', seg:'pass', segNote:'Good job this week ✅' },
];

const COMPLAINTS_DATA = [
  { id:'C001', type:'Garbage not collected', desc:'Collector did not visit our house on Jul 9th morning.', date:'Jul 09', priority:'High',   status:'resolved'    },
  { id:'C002', type:'Collection too early',  desc:'Collection happens at 4:30 AM, waking us up.',         date:'Jul 07', priority:'Medium', status:'in_progress'  },
  { id:'C003', type:'Rude behaviour',        desc:'The collector was impolite and threw waste on road.',   date:'Jun 30', priority:'High',   status:'open'         },
];

const NOTIFICATIONS = [
  { icon:'🚛', dot:'#2ecc71', title:'Collector nearby!',          msg:'Ravi Kumar is 320m away. Expected in 4 minutes.',           time:'9:35 AM', unread:true  },
  { icon:'✅', dot:'#2ecc71', title:'Garbage collected',           msg:'Your waste was successfully collected today. Segregation: PASS ✅', time:'10:05 AM', unread:true },
  { icon:'📋', dot:'#0984e3', title:'Complaint resolved',          msg:'Your complaint C001 has been marked as resolved by Admin.',  time:'Yesterday', unread:true },
  { icon:'⚠️', dot:'#f39c12', title:'Segregation alert',           msg:'Mixed waste was detected in your dry bin last collection.',  time:'Jul 07', unread:false },
  { icon:'💰', dot:'#a29bfe', title:'Monthly summary ready',       msg:'Your July compliance score is 87%. Check your history.',     time:'Jul 05', unread:false },
];

const GUIDE_DATA = [
  {
    color:'#e8f5e9', iconBg:'#c8e6c9', icon:'🟢', emoji:'🥕',
    title:'Organic / Wet Waste', sub:'Food scraps, vegetable peels, garden waste',
    items:[
      { type:'do',   text:'Vegetable & fruit peels' },
      { type:'do',   text:'Leftover cooked food' },
      { type:'do',   text:'Tea leaves, coffee grounds' },
      { type:'do',   text:'Flowers and garden trimmings' },
      { type:'dont', text:'Plastic bags (even bio-labelled)' },
      { type:'dont', text:'Diapers or sanitary products' },
    ]
  },
  {
    color:'#e3f2fd', iconBg:'#bbdefb', icon:'🔵', emoji:'🧴',
    title:'Dry / Recyclable Waste', sub:'Paper, plastic, metal, glass',
    items:[
      { type:'do',   text:'Newspapers, cardboard, notebooks' },
      { type:'do',   text:'Plastic bottles and containers (clean)' },
      { type:'do',   text:'Metal cans and aluminium foil' },
      { type:'do',   text:'Glass bottles and jars' },
      { type:'dont', text:'Soiled / wet paper or plastic' },
      { type:'dont', text:'Bubble wrap or laminated paper' },
    ]
  },
  {
    color:'#fff3e0', iconBg:'#ffe0b2', icon:'🟡', emoji:'💡',
    title:'E-Waste', sub:'Electronics, batteries, bulbs',
    items:[
      { type:'do',   text:'Old mobile phones and chargers' },
      { type:'do',   text:'Batteries (AA, car, button cell)' },
      { type:'do',   text:'CFL and LED bulbs' },
      { type:'do',   text:'Keyboards, mice, wires' },
      { type:'dont', text:'Mix e-waste with organic or dry bins' },
      { type:'dont', text:'Throw in regular trash bags' },
    ]
  },
  {
    color:'#fce4ec', iconBg:'#f8bbd0', icon:'🔴', emoji:'💉',
    title:'Hazardous Waste', sub:'Medicines, chemicals, sharp objects',
    items:[
      { type:'do',   text:'Store separately in sealed bags' },
      { type:'do',   text:'Give expired medicines to pharmacy' },
      { type:'do',   text:'Label sharp objects before disposal' },
      { type:'dont', text:'Mix with regular household waste' },
      { type:'dont', text:'Pour chemicals down the drain' },
    ]
  },
  {
    color:'#f3e5f5', iconBg:'#e1bee7', icon:'🟣', emoji:'👗',
    title:'Sanitary / Rejects', sub:'Diapers, sanitary pads, used tissues',
    items:[
      { type:'do',   text:'Wrap in newspaper before disposal' },
      { type:'do',   text:'Use the red "reject waste" bag if given' },
      { type:'dont', text:'Put in dry or organic bins' },
      { type:'dont', text:'Flush down toilet' },
    ]
  },
];

// ── STATE ──────────────────────────────────────────────────
const ST = {
  pickupStatus:  localStorage.getItem('swm_pickup') || 'pending',
  complaints:    JSON.parse(localStorage.getItem('swm_complaints') || 'null') || JSON.parse(JSON.stringify(COMPLAINTS_DATA)),
  starRating:    0,
  complaintPri:  'Medium',
  map:           null,
  collectorMarker: null,
  myMarker:      null,
  etaInterval:   null,
  simulatedDist: 320,
  simulatedETA:  4,
  compChart:     null,
};

// ── AUTH ───────────────────────────────────────────────────
function handleLogin() {
  const phone = document.getElementById('lPhone').value.trim();
  const pass  = document.getElementById('lPass').value;
  const err   = document.getElementById('lErr');
  if (phone !== RESIDENT.phone || pass !== RESIDENT.password) {
    err.textContent = '❌ Invalid credentials.'; err.style.display = 'block'; return;
  }
  err.style.display = 'none';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  initApp();
}

// ── INIT ───────────────────────────────────────────────────
function initApp() {
  setNetworkStatus();
  setPickupDate();
  renderHome();
  renderHistory();
  renderComplaints('all');
  renderGuide();
  renderNotifications();
  startNearbySimulation();
  startEtaSimulation();
  window.addEventListener('online',  () => setNetworkStatus());
  window.addEventListener('offline', () => setNetworkStatus());
}

function setPickupDate() {
  const d = new Date();
  document.getElementById('pickupDate').textContent =
    d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

function setNetworkStatus() {
  const dot = document.getElementById('netDot');
  dot.className = 'net-dot ' + (navigator.onLine ? 'online' : 'offline');
}

// ── SCREENS ────────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.sc').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bn').forEach(b => b.classList.remove('active'));
  const sc = document.getElementById('sc-' + name);
  const bn = document.getElementById('bn-' + name);
  if (sc) sc.classList.add('active');
  if (bn) bn.classList.add('active');
  if (name === 'track') initTrackMap();
  if (name === 'history' && !ST.compChart) renderComplianceChart();
}

// ── HOME ───────────────────────────────────────────────────
function renderHome() {
  updateStatusCard();
  renderComplianceRing(87);
  renderNotifPreview();
}

function updateStatusCard() {
  const card   = document.getElementById('statusCard');
  const label  = document.getElementById('pickupStatusLabel');
  const icon   = document.getElementById('statusIcon');
  const bPicked   = document.getElementById('btnPicked');
  const bNotPicked = document.getElementById('btnNotPicked');

  const configs = {
    pending:   { label:'Scheduled for Today', icon:'⏳', bg:'linear-gradient(135deg,#0d6e6e,#0a5555)', pBtnActive:false, npBtnActive:false },
    picked:    { label:'✅ Collected!',         icon:'✅', bg:'linear-gradient(135deg,#27ae60,#1a7a44)', pBtnActive:true,  npBtnActive:false },
    not_picked:{ label:'❌ Missed Pickup',      icon:'❌', bg:'linear-gradient(135deg,#e17055,#c0392b)', pBtnActive:false, npBtnActive:true  },
  };
  const cfg = configs[ST.pickupStatus] || configs.pending;
  label.textContent = cfg.label;
  icon.textContent  = cfg.icon;
  card.style.background = cfg.bg;
  bPicked.classList.toggle('active',    cfg.pBtnActive);
  bNotPicked.classList.toggle('active', cfg.npBtnActive);
}

function renderComplianceRing(pct) {
  const circumference = 201;
  const offset = circumference - (circumference * pct / 100);
  const fill = document.getElementById('compRingFill');
  if (fill) setTimeout(() => { fill.style.strokeDashoffset = offset; }, 200);
  const pctEl = document.getElementById('compPct');
  if (pctEl) pctEl.textContent = pct + '%';
}

function renderNotifPreview() {
  const container = document.getElementById('notifPreview');
  container.innerHTML = NOTIFICATIONS.slice(0,3).map(n => `
    <div class="np-item">
      <div class="np-icon">${n.icon}</div>
      <div class="np-body">
        <div class="np-title">${n.title}</div>
        <div class="np-sub">${n.msg.substring(0,60)}…</div>
      </div>
      <div class="np-time">${n.time}</div>
    </div>`).join('');
}

// ── GARBAGE STATUS ─────────────────────────────────────────
function markGarbage(status) {
  if (ST.pickupStatus === status) return;
  ST.pickupStatus = status;
  localStorage.setItem('swm_pickup', status);
  updateStatusCard();
  const msgs = {
    picked:     '✅ Marked as Picked Up!',
    not_picked: '❌ Marked as Not Picked — Admin notified',
  };
  showToast(msgs[status], status === 'picked' ? 'green' : 'red');
  if (status === 'not_picked') {
    setTimeout(() => showToast('📋 Complaint auto-filed for missed pickup', 'orange'), 1500);
  }
}

// ── NEARBY SIMULATION ──────────────────────────────────────
function startNearbySimulation() {
  setTimeout(() => {
    document.getElementById('nearbyBanner').style.display = 'flex';
  }, 2000);
}

function startEtaSimulation() {
  ST.etaInterval = setInterval(() => {
    if (ST.simulatedDist > 20) {
      ST.simulatedDist = Math.max(0, ST.simulatedDist - Math.floor(Math.random() * 30 + 10));
      ST.simulatedETA  = Math.max(0, Math.ceil(ST.simulatedDist / 80));
      document.getElementById('nearbyText').textContent =
        `🚛 Collector is ${ST.simulatedDist}m away · ETA ${ST.simulatedETA} min`;
      document.getElementById('etaVal').textContent  = ST.simulatedETA;
      document.getElementById('distLabel').textContent = `🚛 ${ST.simulatedDist} m away from your house`;
      const houses = Math.max(0, Math.ceil(ST.simulatedDist / 50));
      document.getElementById('houseCount').textContent = `🏠 ${houses} houses before yours`;

      // Simulate collector moving on map
      if (ST.collectorMarker) {
        const dlat = (RESIDENT.lat - COLLECTOR_LIVE.lat) * 0.05;
        const dlng = (RESIDENT.lng - COLLECTOR_LIVE.lng) * 0.05;
        COLLECTOR_LIVE.lat += dlat + (Math.random()-0.5)*0.0002;
        COLLECTOR_LIVE.lng += dlng + (Math.random()-0.5)*0.0002;
        ST.collectorMarker.setLatLng([COLLECTOR_LIVE.lat, COLLECTOR_LIVE.lng]);
      }
    } else {
      clearInterval(ST.etaInterval);
      document.getElementById('nearbyBanner').style.display = 'none';
      showToast('🚛 Collector has arrived at your street!', 'teal');
    }
  }, 4000);
}

// ── TRACKING MAP ───────────────────────────────────────────
function initTrackMap() {
  if (ST.map) { ST.map.invalidateSize(); return; }
  const mid = {
    lat: (RESIDENT.lat + COLLECTOR_LIVE.lat) / 2,
    lng: (RESIDENT.lng + COLLECTOR_LIVE.lng) / 2,
  };
  ST.map = L.map('trackMap').setView([mid.lat, mid.lng], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'&copy; OpenStreetMap', maxZoom:19,
  }).addTo(ST.map);

  // My house marker
  const houseIcon = L.divIcon({
    html:`<div style="width:38px;height:38px;background:linear-gradient(135deg,#0d6e6e,#0a5555);border-radius:50%;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:18px">🏠</div>`,
    iconSize:[38,38], iconAnchor:[19,19],
  });
  ST.myMarker = L.marker([RESIDENT.lat, RESIDENT.lng], { icon:houseIcon })
    .addTo(ST.map)
    .bindPopup(`<b>Your House</b><br>${RESIDENT.address}`);

  // Collector marker
  const colIcon = L.divIcon({
    html:`<div style="width:38px;height:38px;background:linear-gradient(135deg,#e17055,#c0392b);border-radius:50%;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:18px">🚛</div>`,
    iconSize:[38,38], iconAnchor:[19,19],
  });
  ST.collectorMarker = L.marker([COLLECTOR_LIVE.lat, COLLECTOR_LIVE.lng], { icon:colIcon })
    .addTo(ST.map)
    .bindPopup(`<b>${COLLECTOR_LIVE.name}</b><br>EMP-001 · ⭐ ${COLLECTOR_LIVE.rating}`);

  // Draw dotted route line
  const routeLine = L.polyline([
    [COLLECTOR_LIVE.lat, COLLECTOR_LIVE.lng],
    [RESIDENT.lat, RESIDENT.lng]
  ], { color:'#0d6e6e', weight:3, dashArray:'8,6', opacity:.6 }).addTo(ST.map);

  // Nearby houses on route
  [
    [10.9598, 78.0761],
    [10.9603, 78.0765],
    [10.9607, 78.0769],
  ].forEach((pos, i) => {
    L.circleMarker(pos, {
      radius:7, fillColor:'#bbdefb', color:'#2980b9', weight:2, fillOpacity:1,
    }).addTo(ST.map).bindPopup(`House ${i+1} on route (Pending)`);
  });
}

// ── HISTORY ────────────────────────────────────────────────
function renderHistory() {
  document.getElementById('historyList').innerHTML = HISTORY.map(h => `
    <div class="hist-item">
      <div class="hist-date">${h.date}</div>
      <div class="hist-body">
        <div class="hist-col">👷 ${h.collector}</div>
        <div class="hist-seg">${h.segNote}</div>
      </div>
      <div class="hist-status">
        ${h.status === 'collected'
          ? `<span class="hbadge hb-ok">Collected</span>`
          : `<span class="hbadge hb-miss">Missed</span>`}
        ${h.seg ? `<span class="hbadge ${h.seg==='pass'?'hb-pass':'hb-fail'}" style="display:block;margin-top:4px">${h.seg.toUpperCase()}</span>` : ''}
      </div>
    </div>`).join('');
}

function renderComplianceChart() {
  const ctx = document.getElementById('compChart').getContext('2d');
  ST.compChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul'],
      datasets: [{
        label: 'Segregation %',
        data: [72, 78, 85, 80, 88, 83, 87],
        backgroundColor: 'rgba(0,184,148,.7)',
        borderColor: '#00b894',
        borderWidth: 2, borderRadius: 6,
      }]
    },
    options: {
      plugins: { legend:{ display:false } },
      scales: {
        y: { min:60, max:100, ticks:{ callback: v => v+'%' }, grid:{ color:'#f0f6f5' } },
        x: { grid:{ display:false } }
      },
      responsive:true, maintainAspectRatio:false,
    }
  });
}

// ── COMPLAINTS ─────────────────────────────────────────────
function renderComplaints(filter) {
  const list = filter === 'all'
    ? ST.complaints
    : ST.complaints.filter(c => c.status === filter);

  document.getElementById('complaintList').innerHTML = list.length === 0
    ? `<div style="text-align:center;padding:40px;color:var(--muted);background:var(--card);border-radius:14px">No complaints in this category</div>`
    : list.map(c => `
      <div class="cmp-card">
        <div class="cmp-bar bar-${c.priority.toLowerCase()}"></div>
        <div class="cmp-body">
          <div class="cmp-title">${c.type}</div>
          <div class="cmp-desc">${c.desc}</div>
          <div class="cmp-meta">
            <span class="cmp-date">📅 ${c.date}</span>
            <span class="cstatus cs-${c.status}">${c.status.replace('_',' ').toUpperCase()}</span>
            <span style="font-size:10px;font-weight:700;background:var(--bg);padding:2px 6px;border-radius:6px">${c.priority}</span>
          </div>
        </div>
      </div>`).join('');
}

function filterComplaints(filter, btn) {
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderComplaints(filter);
}

// ── GUIDE ──────────────────────────────────────────────────
function renderGuide() {
  document.getElementById('guideCards').innerHTML = GUIDE_DATA.map((g, i) => `
    <div class="guide-card">
      <div class="gc-header" onclick="toggleGuide(${i})">
        <div class="gc-icon" style="background:${g.iconBg}">${g.emoji}</div>
        <div style="flex:1">
          <div class="gc-title">${g.title}</div>
          <div class="gc-sub">${g.sub}</div>
        </div>
        <div class="gc-toggle" id="gt-${i}">›</div>
      </div>
      <div class="gc-body" id="gb-${i}">
        <ul class="gc-list">
          ${g.items.map(item => `
            <li>
              <span class="${item.type==='do'?'gc-do':'gc-dont'}">${item.type==='do'?'✓':'✗'}</span>
              <span>${item.text}</span>
            </li>`).join('')}
        </ul>
      </div>
    </div>`).join('');
}

function toggleGuide(i) {
  const body   = document.getElementById('gb-' + i);
  const toggle = document.getElementById('gt-' + i);
  body.classList.toggle('open');
  toggle.classList.toggle('open');
}

// ── NOTIFICATIONS ──────────────────────────────────────────
function renderNotifications() {
  document.getElementById('notifList').innerHTML = NOTIFICATIONS.map(n => `
    <div class="nl-item ${n.unread ? 'nl-unread' : ''}">
      <div class="nl-dot" style="background:${n.dot}"></div>
      <div class="nl-body">
        <div class="nl-title">${n.icon} ${n.title}</div>
        <div class="nl-msg">${n.msg}</div>
        <div class="nl-time">${n.time}</div>
      </div>
    </div>`).join('');
  const unread = NOTIFICATIONS.filter(n => n.unread).length;
  const badge  = document.getElementById('notifBadge');
  badge.textContent = unread;
  badge.style.display = unread > 0 ? 'flex' : 'none';
}

// ── FEEDBACK MODAL ─────────────────────────────────────────
function openFeedbackModal() {
  ST.starRating = 0;
  renderStars(0);
  document.getElementById('fbComment').value = '';
  document.querySelectorAll('.qr-btn').forEach(b => b.classList.remove('on'));
  document.getElementById('feedbackModal').style.display = 'flex';
}
function closeFeedbackModal() { document.getElementById('feedbackModal').style.display = 'none'; }

function setStar(n) {
  ST.starRating = n;
  renderStars(n);
}
function renderStars(n) {
  document.querySelectorAll('.star').forEach((s, i) => {
    s.classList.toggle('on', i < n);
  });
}
function toggleQR(btn) { btn.classList.toggle('on'); }

function submitFeedback() {
  if (ST.starRating === 0) { showToast('Please select a star rating', 'red'); return; }
  const tags    = [...document.querySelectorAll('.qr-btn.on')].map(b => b.textContent.trim()).join(', ');
  const comment = document.getElementById('fbComment').value.trim();
  closeFeedbackModal();
  showToast(`⭐ Feedback submitted — ${ST.starRating} stars. Thank you!`, 'green');
  NOTIFICATIONS.unshift({
    icon:'⭐', dot:'#f1c40f', unread:false,
    title:'Feedback submitted',
    msg:`You rated Ravi Kumar ${ST.starRating}/5 stars.${tags ? ' Tags: '+tags : ''}${comment ? ' "'+comment+'"' : ''}`,
    time:'Just now',
  });
}

// ── COMPLAINT MODAL ────────────────────────────────────────
function openComplaintModal() {
  ST.complaintPri = 'Medium';
  document.querySelectorAll('.pri-btn').forEach((b,i) => b.classList.toggle('active', i===1));
  document.getElementById('cmpDesc').value = '';
  document.getElementById('cmpPhotoPreview').style.display = 'none';
  document.getElementById('complaintModal').style.display = 'flex';
}
function closeComplaintModal() { document.getElementById('complaintModal').style.display = 'none'; }

function setPriority(p, btn) {
  ST.complaintPri = p;
  document.querySelectorAll('.pri-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function triggerComplaintPhoto() { document.getElementById('cmpPhoto').click(); }
function previewComplaintPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const preview = document.getElementById('cmpPhotoPreview');
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';
}

function submitComplaint() {
  const type = document.getElementById('cmpType').value;
  const desc = document.getElementById('cmpDesc').value.trim();
  if (!desc) { showToast('Please describe the issue', 'red'); return; }

  const newC = {
    id: 'C00' + (ST.complaints.length + 1),
    type, desc, date: 'Today', priority: ST.complaintPri, status: 'open',
  };
  ST.complaints.unshift(newC);
  localStorage.setItem('swm_complaints', JSON.stringify(ST.complaints));

  closeComplaintModal();
  renderComplaints('all');
  document.querySelectorAll('.ftab').forEach((b,i) => b.classList.toggle('active', i===0));

  showToast('🚨 Complaint filed and sent to Admin', 'teal');
  setTimeout(() => showToast('📧 You will be notified when it is resolved', 'orange'), 2000);
}

// ── EMERGENCY ──────────────────────────────────────────────
function emergencyCall() {
  if (confirm('Call Smart Waste Helpline: +91 1800-123-4567?')) {
    window.location.href = 'tel:+911800123456';
  }
}

// ── TOAST ──────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'teal') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── SERVICE WORKER ─────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
