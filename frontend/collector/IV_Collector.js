/* ════════════════════════════════════════════════════════════════
   SmartWaste Collector App — Phase 3
   Features: Login · Duty Toggle · Route · QR Scan · Photo Capture
             AI Analysis · GPS Tracking · Offline Sync · Stats
   ════════════════════════════════════════════════════════════════ */

// ── MOCK DATA ────────────────────────────────────────────────
const COLLECTOR = {
  phone: '9876543210', password: 'ravi123',
  name: 'Ravi Kumar', id: 'EMP-001', zone: 'Zone A',
  route: 'Zone A — North Circuit', vehicle: 'V-101', schedule: 'Mon / Thu',
};

const HOUSES = [
  { id:'H01', seq:1,  name:'House 1',  address:'12 Main Street, Zone A',     phone:'+919876543210', lat:10.9605, lng:78.0768, status:'collected'    },
  { id:'H02', seq:2,  name:'House 2',  address:'15 Main Street, Zone A',     phone:'+918765432109', lat:10.9608, lng:78.0765, status:'collected'    },
  { id:'H03', seq:3,  name:'House 3',  address:'45 Park Avenue, Zone A',     phone:'+917654321098', lat:10.9612, lng:78.0772, status:'pending'      },
  { id:'H04', seq:4,  name:'House 4',  address:'48 Park Avenue, Zone A',     phone:'+916543210987', lat:10.9615, lng:78.0770, status:'pending'      },
  { id:'H05', seq:5,  name:'House 5',  address:'2 Lake Road, Zone A',        phone:'+915432109876', lat:10.9618, lng:78.0758, status:'not_available'},
  { id:'H06', seq:6,  name:'House 6',  address:'78 Lake Road, Zone A',       phone:'+914321098765', lat:10.9595, lng:78.0780, status:'pending'      },
  { id:'H07', seq:7,  name:'House 7',  address:'10 Garden Lane, Zone A',     phone:'+913210987654', lat:10.9588, lng:78.0762, status:'pending'      },
  { id:'H08', seq:8,  name:'House 8',  address:'22 Temple Street, Zone A',   phone:'+912109876543', lat:10.9600, lng:78.0755, status:'pending'      },
  { id:'H09', seq:9,  name:'House 9',  address:'33 Station Road, Zone A',    phone:'+911098765432', lat:10.9622, lng:78.0748, status:'collected'    },
  { id:'H10', seq:10, name:'House 10', address:'100 North Block, Zone A',    phone:'+910987654321', lat:10.9590, lng:78.0790, status:'pending'      },
];

const ALERTS = [
  { icon:'⚠️', title:'Mixed waste detected at House 5', body:'Segregation check failed. Please note this household.',              time:'9:30 AM' },
  { icon:'💬', title:'New feedback from House 2',        body:'"Collector was very punctual and professional. Keep it up!"',        time:'9:15 AM' },
  { icon:'📋', title:'Route update from Admin',          body:'House 11 (55 Park Ave) added to your route for today.',              time:'8:50 AM' },
];

const FEEDBACK_RECEIVED = [
  { stars: 5, comment: 'Very clean collection, always on time!',         from: 'House 9',  date: 'Jul 11' },
  { stars: 4, comment: 'Good service. Could improve waste segregation.', from: 'House 2',  date: 'Jul 10' },
  { stars: 5, comment: 'Excellent behaviour and professionalism.',       from: 'House 1',  date: 'Jul 09' },
];

const ACTIVITY_FEED = [
  { color: '#2ecc71', msg: 'House 9 marked as collected',             time: '9:42 AM' },
  { color: '#2ecc71', msg: 'House 2 — AI: Segregation PASS ✅',      time: '9:28 AM' },
  { color: '#2ecc71', msg: 'House 1 — collected, feedback submitted', time: '9:10 AM' },
  { color: '#fdcb6e', msg: 'House 5 marked as Not Available',         time: '8:58 AM' },
  { color: '#0984e3', msg: 'GPS tracking started',                    time: '8:30 AM' },
];

// ── STATE ────────────────────────────────────────────────────
const ST = {
  houses:      JSON.parse(localStorage.getItem('swm_houses') || 'null') || JSON.parse(JSON.stringify(HOUSES)),
  dutyActive:  JSON.parse(localStorage.getItem('swm_duty')   || 'false'),
  offlineQ:    JSON.parse(localStorage.getItem('swm_offline') || '[]'),
  gpsInterval: null,
  myPos:       null,
  map:         null,
  myMarker:    null,
  houseMarkers:[],
  wizStep:     1,
  wizHouseIdx: -1,
  wizFeedback: '',
  wizPhoto:    null,
};

// ── AUTH ────────────────────────────────────────────────────
function handleLogin() {
  const phone = document.getElementById('lPhone').value.trim();
  const pass  = document.getElementById('lPass').value;
  const err   = document.getElementById('lErr');

  if (phone !== COLLECTOR.phone || pass !== COLLECTOR.password) {
    err.textContent = '❌ Invalid credentials.'; err.style.display = 'block'; return;
  }
  err.style.display = 'none';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  initApp();
}

function logout() {
  if (!confirm('End session and logout?')) return;
  stopGPS();
  localStorage.removeItem('swm_duty');
  document.getElementById('app').style.display   = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

// ── INIT ────────────────────────────────────────────────────
function initApp() {
  setGreeting();
  updateDutyUI();
  renderHome();
  renderRoute();
  renderStats();
  renderAlerts();
  checkOnline();
  if (ST.dutyActive) startGPS();

  window.addEventListener('online',  () => { setSync(true);  syncOfflineQueue(); });
  window.addEventListener('offline', () => setSync(false));
}

function setGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning 👋' : h < 17 ? 'Good afternoon 👋' : 'Good evening 👋';
  document.getElementById('tbGreet').textContent = g;
  document.getElementById('tbName').textContent  = COLLECTOR.name;
}

// ── DUTY TOGGLE ─────────────────────────────────────────────
function toggleDuty() {
  ST.dutyActive = !ST.dutyActive;
  localStorage.setItem('swm_duty', ST.dutyActive);
  updateDutyUI();
  if (ST.dutyActive) {
    startGPS();
    showToast('Duty started — GPS active 📍', 'green');
    pushActivity('#0984e3', 'GPS tracking started', 'Now');
  } else {
    stopGPS();
    showToast('Duty ended. See you tomorrow!', 'blue');
  }
}

function updateDutyUI() {
  const banner = document.getElementById('dutyBanner');
  const label  = document.getElementById('dutyLabel');
  const btn    = document.getElementById('dutyBtn');
  if (ST.dutyActive) {
    banner.className = 'duty-on';
    label.textContent = '🟢 Duty Active — GPS Tracking ON';
    btn.textContent   = 'End Duty';
  } else {
    banner.className = 'duty-off';
    label.textContent = '⏸ Duty Not Started';
    btn.textContent   = 'Start Duty';
  }
}

// ── GPS ──────────────────────────────────────────────────────
function startGPS() {
  if (!navigator.geolocation) { simulateGPS(); return; }
  ST.gpsInterval = navigator.geolocation.watchPosition(
    pos => {
      ST.myPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      updateGPSUI(ST.myPos.lat, ST.myPos.lng);
      pushGPSToServer(ST.myPos.lat, ST.myPos.lng, pos.coords.speed || 0);
      if (ST.map && ST.myMarker) ST.myMarker.setLatLng([ST.myPos.lat, ST.myPos.lng]);
    },
    () => simulateGPS(),
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
}

function simulateGPS() {
  // Simulate movement for demo
  let lat = 10.9601, lng = 78.0766;
  ST.gpsInterval = setInterval(() => {
    lat += (Math.random() - 0.5) * 0.0006;
    lng += (Math.random() - 0.5) * 0.0006;
    ST.myPos = { lat, lng };
    updateGPSUI(lat, lng);
    pushGPSToServer(lat, lng, (Math.random() * 25).toFixed(1));
    if (ST.map && ST.myMarker) ST.myMarker.setLatLng([lat, lng]);
    if (ST.map && ST.myMarker) ST.map.panTo([lat, lng], { animate: true, duration: 0.5 });
  }, 5000);
}

function stopGPS() {
  if (typeof ST.gpsInterval === 'number') clearInterval(ST.gpsInterval);
  else if (ST.gpsInterval) navigator.geolocation.clearWatch(ST.gpsInterval);
  ST.gpsInterval = null;
  document.getElementById('gpsStatus').textContent = '📡 GPS Off';
  document.getElementById('gpsStatus').className   = 'gps-off';
  document.getElementById('gpsCoords').textContent = '—';
}

function updateGPSUI(lat, lng) {
  document.getElementById('gpsStatus').textContent = '📡 GPS Active';
  document.getElementById('gpsStatus').className   = 'gps-on';
  document.getElementById('gpsCoords').textContent =
    `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function pushGPSToServer(lat, lng, speed) {
  if (!navigator.onLine) return;
  try {
    await fetch('/api/v1/collector/me/gps/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('swm_token') || 'demo') },
      body: JSON.stringify({ latitude: lat, longitude: lng, speed_kmph: speed })
    });
  } catch { /* offline — will retry */ }
}

// ── SCREENS ─────────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.sc').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.bn').forEach(b => b.classList.remove('active'));

  const sc = document.getElementById('sc-' + name);
  const bn = document.getElementById('bn-' + name);
  if (sc) sc.classList.add('active');
  if (bn) bn.classList.add('active');

  if (name === 'map') initMap();
}

// ── HOME ─────────────────────────────────────────────────────
function renderHome() {
  const done = ST.houses.filter(h => h.status === 'collected').length;
  const na   = ST.houses.filter(h => h.status === 'not_available').length;
  const pend = ST.houses.filter(h => h.status === 'pending').length;
  const total = ST.houses.length;
  const pct   = total > 0 ? Math.round(done / total * 100) : 0;

  // Ring
  const circumference = 314;
  const offset = circumference - (circumference * pct / 100);
  document.getElementById('ringFill').style.strokeDashoffset = offset;
  document.getElementById('ringPct').textContent = pct + '%';
  document.getElementById('rsDone').textContent  = done;
  document.getElementById('rsPend').textContent  = pend;
  document.getElementById('rsNA').textContent    = na;

  // Route subtitle
  document.getElementById('routeSubtitle').textContent =
    `${done}/${total} collected`;
  document.getElementById('routeNameLabel').textContent = COLLECTOR.route;
  document.getElementById('routeTotalLabel').textContent = total;

  // Activity feed
  const ul = document.getElementById('actFeed');
  ul.innerHTML = ACTIVITY_FEED.map(a =>
    `<li><span class="feed-dot" style="background:${a.color}"></span>
     <span style="flex:1">${a.msg}</span>
     <span class="feed-time">${a.time}</span></li>`
  ).join('');
}

function pushActivity(color, msg, time) {
  ACTIVITY_FEED.unshift({ color, msg, time: time || new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) });
  if (ACTIVITY_FEED.length > 10) ACTIVITY_FEED.pop();
  renderHome();
}

// ── ROUTE ────────────────────────────────────────────────────
function renderRoute(filter = 'all') {
  const list = filter === 'all' ? ST.houses :
               ST.houses.filter(h => h.status === filter);

  const container = document.getElementById('houseList');
  container.innerHTML = list.length === 0
    ? `<div style="text-align:center;padding:40px;color:var(--muted)">No houses in this category</div>`
    : list.map((h, i) => houseCardHTML(h, ST.houses.indexOf(h))).join('');
}

function filterRoute(filter, btn) {
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderRoute(filter);
}

function houseCardHTML(h, idx) {
  const seqClass  = h.status === 'collected' ? 'seq-collected' : h.status === 'not_available' ? 'seq-na' : 'seq-pending';
  const badgeClass = h.status === 'collected' ? 'sb-collected' : h.status === 'not_available' ? 'sb-na' : 'sb-pending';
  const badgeTxt   = h.status === 'collected' ? '✅ Done' : h.status === 'not_available' ? '🚫 N/A' : '⏳ Pending';

  const actions = h.status === 'pending' ? `
    <button class="btn-sm btn-green"  onclick="openCollection(${idx})">📷 Collect</button>
    <button class="btn-sm btn-orange" onclick="markNotAvailable(${idx})">🚫 Not Available</button>
    <button class="btn-sm btn-blue"   onclick="callResident('${h.phone}')">📞 Call</button>
    <button class="btn-sm btn-red"    onclick="openReport(${idx})">📋 Report</button>
  ` : h.status === 'collected' ? `
    <button class="btn-sm btn-blue" onclick="callResident('${h.phone}')">📞 Call</button>
    <span style="font-size:12px;color:var(--muted)">Collection complete</span>
  ` : `
    <button class="btn-sm btn-green" onclick="retryCollection(${idx})">↩ Retry</button>
    <button class="btn-sm btn-blue"  onclick="callResident('${h.phone}')">📞 Call</button>
  `;

  return `
  <div class="house-card" id="hcard-${idx}">
    <div class="house-card-top">
      <div class="house-seq ${seqClass}">${h.seq}</div>
      <div class="house-info">
        <div class="house-name">${h.name}</div>
        <div class="house-addr">${h.address}</div>
      </div>
      <div class="house-status">
        <span class="status-badge ${badgeClass}">${badgeTxt}</span>
      </div>
    </div>
    <div class="house-actions">${actions}</div>
  </div>`;
}

function callResident(phone) {
  window.location.href = 'tel:' + phone;
}

function retryCollection(idx) {
  ST.houses[idx].status = 'pending';
  persistState(); renderRoute(); renderHome();
  showToast('House reset to Pending', 'blue');
}

// ── COLLECTION WIZARD ────────────────────────────────────────
function openCollection(idx) {
  ST.wizHouseIdx = idx;
  ST.wizStep = 1;
  ST.wizPhoto = null;
  ST.wizFeedback = '';
  renderWizard();
  document.getElementById('collectModal').style.display = 'flex';
}

function closeCollection() {
  document.getElementById('collectModal').style.display = 'none';
}

function renderWizard() {
  const h = ST.houses[ST.wizHouseIdx];
  const steps = ['Scan QR', 'Capture Photo', 'AI Analysis', 'Feedback'];
  const progressDots = steps.map((s, i) =>
    `<div class="wiz-dot ${i < ST.wizStep ? 'done' : ''}"></div>`).join('');

  let body = '';
  if (ST.wizStep === 1) {
    body = `
      <div class="wiz-header">
        <div class="wiz-progress">${progressDots}</div>
        <div class="wiz-title">Step 1 — Scan QR Code</div>
        <div class="wiz-sub">${h.name} · ${h.address}</div>
      </div>
      <div class="scan-box" id="scanBox" onclick="simulateScan()">
        <div class="scan-icon">📷</div>
        <p>Tap to scan the QR code at this house</p>
      </div>
      <div id="scanResult" style="display:none;background:rgba(46,204,113,.1);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--green-dk);font-weight:600;margin-bottom:12px">
        ✅ QR scanned — House verified: ${h.name}
      </div>
      <div class="wiz-actions">
        <button class="btn-ghost" onclick="closeCollection()">Cancel</button>
        <button class="btn-main" id="wizNext1" onclick="wizNext()" style="opacity:.4;pointer-events:none">Next →</button>
      </div>`;
  }
  else if (ST.wizStep === 2) {
    body = `
      <div class="wiz-header">
        <div class="wiz-progress">${progressDots}</div>
        <div class="wiz-title">Step 2 — Capture Waste Photo</div>
        <div class="wiz-sub">Take a clear photo of the waste bin</div>
      </div>
      <img id="photoPreview" class="photo-preview" alt="Waste photo">
      <div class="scan-box" id="photoBox" onclick="triggerCamera()">
        <div class="scan-icon">📸</div>
        <p>Tap to open camera</p>
      </div>
      <input type="file" id="cameraInput" accept="image/*" capture="environment" style="display:none" onchange="handlePhotoCapture(event)">
      <div class="wiz-actions">
        <button class="btn-ghost" onclick="wizBack()">← Back</button>
        <button class="btn-main" id="wizNext2" onclick="wizNext()" style="opacity:.4;pointer-events:none">Analyse →</button>
      </div>`;
  }
  else if (ST.wizStep === 3) {
    body = `
      <div class="wiz-header">
        <div class="wiz-progress">${progressDots}</div>
        <div class="wiz-title">Step 3 — AI Analysis</div>
        <div class="wiz-sub">YOLOv8 waste classification result</div>
      </div>
      <div class="ai-result" id="aiResultBox">
        <div id="aiLoading" style="text-align:center;padding:20px">
          <div style="font-size:32px">🤖</div>
          <div style="font-size:13px;color:var(--muted);margin-top:8px">Analysing waste composition…</div>
        </div>
      </div>
      <div class="wiz-actions" id="aiActions" style="display:none">
        <button class="btn-ghost" onclick="wizBack()">← Back</button>
        <button class="btn-main" onclick="wizNext()">Next →</button>
      </div>`;
    setTimeout(() => showAIResult(), 1800);
  }
  else if (ST.wizStep === 4) {
    body = `
      <div class="wiz-header">
        <div class="wiz-progress">${progressDots}</div>
        <div class="wiz-title">Step 4 — Rate This Household</div>
        <div class="wiz-sub">How well was waste segregated?</div>
      </div>
      <div class="feedback-quick">
        <button class="fq-btn" onclick="selectFeedback('Excellent',this)">😊 Excellent</button>
        <button class="fq-btn" onclick="selectFeedback('Good',this)">🙂 Good</button>
        <button class="fq-btn" onclick="selectFeedback('Poor',this)">😞 Poor</button>
      </div>
      <div class="fg"><label>Additional Remarks (optional)</label>
        <textarea id="wizRemarks" rows="2" placeholder="Any notes about waste condition…"></textarea>
      </div>
      <div class="wiz-actions">
        <button class="btn-ghost" onclick="wizBack()">← Back</button>
        <button class="btn-main" onclick="completeCollection()">✅ Mark Complete</button>
      </div>`;
  }

  document.getElementById('collectContent').innerHTML = body;
}

function wizNext() { ST.wizStep = Math.min(4, ST.wizStep + 1); renderWizard(); }
function wizBack() { ST.wizStep = Math.max(1, ST.wizStep - 1); renderWizard(); }

function simulateScan() {
  const box = document.getElementById('scanBox');
  const res = document.getElementById('scanResult');
  const btn = document.getElementById('wizNext1');
  box.classList.add('scanned');
  box.innerHTML = '<div class="scan-icon">✅</div><p>QR code scanned successfully!</p>';
  res.style.display = 'block';
  btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
  showToast('QR verified ✅', 'green');
}

function triggerCamera() {
  document.getElementById('cameraInput').click();
}

function handlePhotoCapture(event) {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  ST.wizPhoto = url;
  const preview = document.getElementById('photoPreview');
  preview.src = url; preview.style.display = 'block';
  document.getElementById('photoBox').style.display = 'none';
  const btn = document.getElementById('wizNext2');
  btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
  showToast('Photo captured ✅', 'green');
}

function showAIResult() {
  const categories = [
    { label:'Organic',  pct: 42, color:'#2ecc71' },
    { label:'Plastic',  pct: 28, color:'#0984e3' },
    { label:'Paper',    pct: 18, color:'#fdcb6e' },
    { label:'Metal',    pct:  8, color:'#a29bfe' },
    { label:'Glass',    pct:  4, color:'#00b894' },
  ];
  const isPass = categories.find(c => c.label === 'Organic').pct > 30;

  document.getElementById('aiResultBox').innerHTML = `
    <div style="font-size:13px;font-weight:700;margin-bottom:10px">Waste Composition Detected</div>
    <div class="ai-bars">
      ${categories.map(c => `
        <div class="ai-bar-row">
          <span class="ai-bar-lbl">${c.label}</span>
          <div class="ai-bar-track"><div class="ai-bar-fill" style="width:${c.pct}%;background:${c.color}"></div></div>
          <span class="ai-pct">${c.pct}%</span>
        </div>`).join('')}
    </div>
    <div class="seg-result ${isPass ? 'seg-pass' : 'seg-fail'}">
      ${isPass ? '✅ Segregation: PASS' : '❌ Segregation: FAIL — Mixed waste detected'}
    </div>`;
  document.getElementById('aiActions').style.display = 'flex';
}

function selectFeedback(val, btn) {
  document.querySelectorAll('.fq-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ST.wizFeedback = val;
}

function completeCollection() {
  const idx = ST.wizHouseIdx;
  const h   = ST.houses[idx];
  const remarks = document.getElementById('wizRemarks')?.value || '';

  // Save update
  ST.houses[idx].status = 'collected';
  persistState();

  // Queue for offline sync
  const record = {
    id: h.id, house: h.name, feedback: ST.wizFeedback,
    remarks, photo: ST.wizPhoto ? 'captured' : null,
    timestamp: new Date().toISOString(),
  };
  if (!navigator.onLine) {
    ST.offlineQ.push(record);
    localStorage.setItem('swm_offline', JSON.stringify(ST.offlineQ));
    showToast('Saved offline — will sync when online 📶', 'blue');
  } else {
    syncSingleRecord(record);
    showToast('Collection complete! ✅', 'green');
  }

  closeCollection();
  pushActivity('#2ecc71', `${h.name} — collected`, 'Just now');
  renderRoute(); renderHome();

  // Update map marker if map open
  updateHouseMarker(idx, 'collected');
}

function markNotAvailable(idx) {
  ST.houses[idx].status = 'not_available';
  persistState();
  pushActivity('#fdcb6e', `${ST.houses[idx].name} — Not Available`, 'Just now');
  renderRoute(); renderHome();
  updateHouseMarker(idx, 'not_available');
  showToast('Marked as Not Available', 'blue');
}

// ── MAP ──────────────────────────────────────────────────────
function initMap() {
  if (ST.map) { ST.map.invalidateSize(); return; }

  const center = ST.myPos
    ? [ST.myPos.lat, ST.myPos.lng]
    : [ST.houses[0].lat, ST.houses[0].lng];

  ST.map = L.map('collectorMap', { zoomControl: true }).setView(center, 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap', maxZoom: 19,
  }).addTo(ST.map);

  // My position marker
  const meIcon = L.divIcon({
    html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#2ecc71,#27ae60);border-radius:50%;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:16px">🚛</div>`,
    iconSize: [36, 36], iconAnchor: [18, 18],
  });
  ST.myMarker = L.marker(center, { icon: meIcon }).addTo(ST.map)
    .bindPopup('<b>My Location</b><br>GPS Active');

  // House markers
  ST.houses.forEach((h, i) => {
    addHouseMarker(h, i);
  });

  // If GPS already running, pan to position
  if (ST.myPos) ST.map.setView([ST.myPos.lat, ST.myPos.lng], 16);
}

function addHouseMarker(h, i) {
  const color = h.status === 'collected' ? '#aaa' :
                h.status === 'not_available' ? '#e17055' : '#0984e3';
  const icon = L.divIcon({
    html: `<div style="width:28px;height:28px;background:${color};border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff">${h.seq}</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  });
  const marker = L.marker([h.lat, h.lng], { icon }).addTo(ST.map)
    .bindPopup(`<b>${h.name}</b><br>${h.address}<br>Status: ${h.status}`);
  ST.houseMarkers[i] = marker;
}

function updateHouseMarker(idx, status) {
  if (!ST.map || !ST.houseMarkers[idx]) return;
  ST.map.removeLayer(ST.houseMarkers[idx]);
  addHouseMarker({ ...ST.houses[idx], status }, idx);
}

// ── STATS ────────────────────────────────────────────────────
function renderStats() {
  document.getElementById('feedbackCards').innerHTML = FEEDBACK_RECEIVED.map(f => `
    <div class="fb-card">
      <div class="fb-stars">${'⭐'.repeat(f.stars)}</div>
      <div class="fb-comment">"${f.comment}"</div>
      <div class="fb-meta">— ${f.from} · ${f.date}</div>
    </div>`).join('');
}

// ── ALERTS ───────────────────────────────────────────────────
function renderAlerts() {
  document.getElementById('alertsList').innerHTML = ALERTS.map(a => `
    <div class="alert-card">
      <div class="alert-icon">${a.icon}</div>
      <div class="alert-body">
        <h4>${a.title}</h4>
        <p>${a.body}</p>
        <div class="alert-time">${a.time}</div>
      </div>
    </div>`).join('');
}

// ── REPORT ───────────────────────────────────────────────────
function openReport(idx) {
  document.getElementById('repHouse').value = ST.houses[idx].name + ' — ' + ST.houses[idx].address;
  document.getElementById('reportModal').style.display = 'flex';
  document.getElementById('reportModal').dataset.idx = idx;
}
function closeReportModal() { document.getElementById('reportModal').style.display = 'none'; }

function submitReport() {
  const type    = document.getElementById('repType').value;
  const note    = document.getElementById('repNote').value.trim();
  const hName   = document.getElementById('repHouse').value;
  if (!note) { showToast('Please add remarks', 'red'); return; }
  closeReportModal();
  showToast('Report submitted to Admin ✅', 'green');
  pushActivity('#e17055', `Report filed for ${hName.split('—')[0].trim()}: ${type}`, 'Just now');
}

// ── OFFLINE SYNC ─────────────────────────────────────────────
async function syncSingleRecord(record) {
  try {
    await fetch('/api/v1/collector/collections/' + record.id + '/complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('swm_token') || 'demo') },
      body: JSON.stringify(record),
    });
  } catch { /* store for later */ ST.offlineQ.push(record); localStorage.setItem('swm_offline', JSON.stringify(ST.offlineQ)); }
}

async function syncOfflineQueue() {
  if (!navigator.onLine || ST.offlineQ.length === 0) return;
  let synced = 0;
  for (const rec of [...ST.offlineQ]) {
    try {
      await fetch('/api/v1/collector/collections/' + rec.id + '/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('swm_token') || 'demo') },
        body: JSON.stringify(rec),
      });
      ST.offlineQ = ST.offlineQ.filter(r => r.id !== rec.id);
      synced++;
    } catch { break; }
  }
  localStorage.setItem('swm_offline', JSON.stringify(ST.offlineQ));
  if (synced > 0) showToast(`Synced ${synced} offline record(s) ✅`, 'green');
}

function persistState() {
  localStorage.setItem('swm_houses', JSON.stringify(ST.houses));
}

// ── NETWORK STATUS ───────────────────────────────────────────
function checkOnline() { setSync(navigator.onLine); }
function setSync(online) {
  const dot = document.getElementById('syncDot');
  dot.className = 'sync-dot ' + (online ? 'online' : 'offline');
  dot.title     = online ? 'Online' : 'Offline — changes saved locally';
}

// ── TOAST ────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'green') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── REGISTER SERVICE WORKER ──────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ── BOOT ─────────────────────────────────────────────────────
window.onload = () => {
  // Auto-login if session still active (demo)
  const session = localStorage.getItem('swm_session');
  if (session === 'active') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initApp();
  }
};
