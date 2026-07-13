/* ══════════════════════════════════════════════════════════
   SmartWaste Admin Dashboard — Phase 2 JavaScript
   ══════════════════════════════════════════════════════════ */

// ─── MOCK DATA ───────────────────────────────────────────────
const MOCK = {
  admin: { email: 'admin@smartwaste.in', password: 'admin123' },

  collectors: [
    { id: 'EMP-001', name: 'Ravi Kumar',    phone: '9876543210', zone: 'Zone A', onDuty: true,  rating: 4.8, lat: 10.9610, lng: 78.0770 },
    { id: 'EMP-002', name: 'Priya Sharma',  phone: '8765432109', zone: 'Zone B', onDuty: true,  rating: 4.5, lat: 10.9630, lng: 78.0750 },
    { id: 'EMP-003', name: 'Ahmed Khan',    phone: '7654321098', zone: 'Zone C', onDuty: false, rating: 4.2, lat: 10.9580, lng: 78.0790 },
    { id: 'EMP-004', name: 'Meena Devi',    phone: '6543210987', zone: 'Zone A', onDuty: true,  rating: 4.9, lat: 10.9600, lng: 78.0760 },
    { id: 'EMP-005', name: 'Suresh Babu',   phone: '5432109876', zone: 'Zone D', onDuty: false, rating: 3.9, lat: 10.9620, lng: 78.0780 },
  ],

  vehicles: [
    { code: 'V-101', plate: 'TN33AB1234', type: 'Truck',    capacity: 2000, assignedTo: 'Ravi Kumar',  active: true },
    { code: 'V-102', plate: 'TN33CD5678', type: 'Auto',     capacity: 500,  assignedTo: 'Priya Sharma', active: true },
    { code: 'V-103', plate: 'TN33EF9012', type: 'Tricycle', capacity: 200,  assignedTo: '—',            active: false },
    { code: 'V-104', plate: 'TN33GH3456', type: 'Van',      capacity: 1200, assignedTo: 'Meena Devi',  active: true },
  ],

  routes: [
    { id: 'R-01', name: 'Zone A — North Circuit', zone: 'Zone A', houses: 45, collector: 'Ravi Kumar',   vehicle: 'V-101', day: 'Mon/Thu', completed: 38 },
    { id: 'R-02', name: 'Zone B — East Loop',     zone: 'Zone B', houses: 38, collector: 'Priya Sharma', vehicle: 'V-102', day: 'Tue/Fri', completed: 30 },
    { id: 'R-03', name: 'Zone C — South Sweep',   zone: 'Zone C', houses: 52, collector: 'Ahmed Khan',   vehicle: '—',     day: 'Wed/Sat', completed: 0  },
    { id: 'R-04', name: 'Zone A — South Circuit', zone: 'Zone A', houses: 41, collector: 'Meena Devi',   vehicle: 'V-104', day: 'Mon/Thu', completed: 41 },
  ],

  complaints: [
    { id: 'C-001', title: 'Garbage not collected for 3 days', desc: 'No pickup at 12 Main Street since Monday.', resident: 'John Doe',  collector: 'Ahmed Khan',   priority: 'High',   status: 'open',        date: '2025-07-10' },
    { id: 'C-002', title: 'Collector rude behaviour',         desc: 'The collector was rude to my family.',       resident: 'Anita S',   collector: 'Suresh Babu',  priority: 'Medium', status: 'in_progress', date: '2025-07-09' },
    { id: 'C-003', title: 'Mixed waste not segregated',       desc: 'Organic and plastic dumped together.',       resident: 'Ramu K',    collector: 'Ravi Kumar',   priority: 'High',   status: 'open',        date: '2025-07-11' },
    { id: 'C-004', title: 'Vehicle spilled waste on road',    desc: 'Truck leaked on Park Avenue.',               resident: 'Usha M',    collector: 'Priya Sharma', priority: 'Medium', status: 'resolved',    date: '2025-07-08' },
    { id: 'C-005', title: 'Early morning noise from truck',   desc: 'Collection at 4 AM is too early.',           resident: 'Kumar P',   collector: 'Meena Devi',   priority: 'Low',    status: 'resolved',    date: '2025-07-07' },
  ],

  salary: [
    { name: 'Ravi Kumar',   base: 12000, collection: 2940, seg: 2375, attendance: 2400, rating: 1440, penalty: 0    },
    { name: 'Priya Sharma', base: 12000, collection: 2550, seg: 2000, attendance: 2200, rating: 1350, penalty: 200  },
    { name: 'Ahmed Khan',   base: 12000, collection: 1800, seg: 1600, attendance: 1800, rating: 1260, penalty: 500  },
    { name: 'Meena Devi',   base: 12000, collection: 3000, seg: 2500, attendance: 2400, rating: 1470, penalty: 0    },
    { name: 'Suresh Babu',  base: 12000, collection: 1500, seg: 1200, attendance: 1600, rating: 1170, penalty: 800  },
  ],

  activity: [
    { color: '#2ecc71', msg: 'Ravi Kumar collected House 38 in Zone A',         time: '9:42 AM' },
    { color: '#0984e3', msg: 'New complaint filed by John Doe',                  time: '9:35 AM' },
    { color: '#2ecc71', msg: 'Meena Devi completed Route R-04 (100%)',           time: '9:20 AM' },
    { color: '#fdcb6e', msg: 'Ahmed Khan marked 5 houses as Not Available',      time: '9:10 AM' },
    { color: '#a29bfe', msg: 'Vehicle V-101 dispatched to Zone A North Circuit', time: '8:55 AM' },
    { color: '#2ecc71', msg: 'Priya Sharma started duty — GPS active',           time: '8:30 AM' },
  ],
};

// ─── STATE ───────────────────────────────────────────────────
let state = {
  collectors: JSON.parse(JSON.stringify(MOCK.collectors)),
  vehicles:   JSON.parse(JSON.stringify(MOCK.vehicles)),
  routes:     JSON.parse(JSON.stringify(MOCK.routes)),
  complaints: JSON.parse(JSON.stringify(MOCK.complaints)),
  salary:     JSON.parse(JSON.stringify(MOCK.salary)),
  editingId:  null,
  map:        null,
  markers:    [],
  charts:     {},
};

// ─── AUTH ─────────────────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  const err   = document.getElementById('loginError');
  const btn   = document.getElementById('loginBtn');

  if (email !== MOCK.admin.email || pass !== MOCK.admin.password) {
    err.textContent = '❌ Invalid credentials. Try admin@smartwaste.in / admin123';
    err.style.display = 'block';
    return;
  }
  btn.textContent = 'Signing in…';
  setTimeout(() => {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initApp();
  }, 600);
}

function logout() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginBtn').textContent = 'Sign In →';
}

// ─── APP INIT ─────────────────────────────────────────────────
function initApp() {
  setDate();
  initOverview();
  renderCollectors();
  renderVehicles();
  renderRoutes();
  renderReports();
  renderSalary();
  renderComplaints('all');
}

function setDate() {
  const d = new Date();
  document.getElementById('todayDate').textContent =
    d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
}

// ─── SIDEBAR / NAVIGATION ─────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  const labels = { overview:'Overview', collectors:'Collectors', vehicles:'Vehicles',
    routes:'Routes', tracking:'Live Tracking', reports:'Reports', salary:'Salary', complaints:'Complaints' };
  document.getElementById('pageTitle').textContent = labels[name] || name;
  if (name === 'tracking') initTrackingMap();
  if (name === 'reports')  initCharts();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ─── OVERVIEW ─────────────────────────────────────────────────
function initOverview() {
  const totHouses   = state.routes.reduce((a, r) => a + r.houses, 0);
  const totCollected = state.routes.reduce((a, r) => a + r.completed, 0);
  const activeCol   = state.collectors.filter(c => c.onDuty).length;
  const pending     = totHouses - totCollected;
  const openCompl   = state.complaints.filter(c => c.status === 'open').length;

  animateCount('sHouses',     totHouses);
  animateCount('sCollected',  totCollected);
  animateCount('sCollectors', activeCol);
  animateCount('sPending',    pending);
  animateCount('sComplaints', openCompl);
  animateCount('sWaste',      847);

  const pct = Math.round(totCollected / totHouses * 100);
  setTimeout(() => {
    document.getElementById('sbCollected').style.width = pct + '%';
    document.getElementById('sbPending').style.width   = Math.round(pending / totHouses * 100) + '%';
  }, 200);

  renderActivityFeed();
  initWeeklyChart();
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 40));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 30);
}

function renderActivityFeed() {
  const ul = document.getElementById('activityList');
  ul.innerHTML = MOCK.activity.map(a => `
    <li>
      <span class="act-dot" style="background:${a.color}"></span>
      <div style="flex:1"><div style="font-size:13px">${a.msg}</div><div class="act-time">${a.time}</div></div>
    </li>`).join('');
}

function initWeeklyChart() {
  const ctx = document.getElementById('weeklyChart').getContext('2d');
  if (state.charts.weekly) state.charts.weekly.destroy();
  state.charts.weekly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Collection %',
        data: [94, 88, 91, 97, 85, 78, 92],
        backgroundColor: 'rgba(46,204,113,.7)',
        borderColor: '#2ecc71',
        borderWidth: 2, borderRadius: 6,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 60, max: 100, grid: { color: '#f0f3f7' } },
        x: { grid: { display: false } }
      },
      responsive: true, maintainAspectRatio: false,
    }
  });
}

// ─── COLLECTORS ───────────────────────────────────────────────
function renderCollectors(filter = '') {
  const tbody = document.getElementById('collectorsTbody');
  const list  = state.collectors.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    c.zone.toLowerCase().includes(filter.toLowerCase()) ||
    c.id.toLowerCase().includes(filter.toLowerCase())
  );
  tbody.innerHTML = list.map((c, i) => `
    <tr>
      <td><code style="font-size:12px;background:#f0f3f7;padding:2px 6px;border-radius:4px">${c.id}</code></td>
      <td><strong>${c.name}</strong></td>
      <td>📞 ${c.phone}</td>
      <td>${c.zone}</td>
      <td><span class="status ${c.onDuty ? 'on-duty' : 'off-duty'}">${c.onDuty ? 'On Duty' : 'Off Duty'}</span></td>
      <td>${'⭐'.repeat(Math.floor(c.rating))} ${c.rating}</td>
      <td class="actions">
        <button class="btn btn-ghost btn-sm" onclick="openCollectorModal(${state.collectors.indexOf(c)})">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCollector(${state.collectors.indexOf(c)})">🗑️</button>
      </td>
    </tr>`).join('');
}

function openCollectorModal(idx = -1) {
  state.editingId = idx;
  const c = idx >= 0 ? state.collectors[idx] : null;
  document.getElementById('modalTitle').textContent = c ? 'Edit Collector' : 'Add New Collector';
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Employee ID</label>
          <input id="mEmpId" value="${c ? c.id : 'EMP-00' + (state.collectors.length+1)}" ${c?'readonly':''}></div>
        <div class="form-group"><label>Full Name</label>
          <input id="mName" value="${c ? c.name : ''}" placeholder="Enter full name"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Phone</label>
          <input id="mPhone" value="${c ? c.phone : ''}" placeholder="10-digit number"></div>
        <div class="form-group"><label>Zone</label>
          <select id="mZone">
            ${['Zone A','Zone B','Zone C','Zone D'].map(z =>
              `<option ${c && c.zone === z ? 'selected':''} value="${z}">${z}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group"><label>Duty Status</label>
        <select id="mDuty">
          <option value="true"  ${c && c.onDuty  ? 'selected':''}>On Duty</option>
          <option value="false" ${c && !c.onDuty ? 'selected':''}>Off Duty</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveCollector()">Save Collector</button>
      </div>
    </div>`;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function saveCollector() {
  const id    = document.getElementById('mEmpId').value.trim();
  const name  = document.getElementById('mName').value.trim();
  const phone = document.getElementById('mPhone').value.trim();
  const zone  = document.getElementById('mZone').value;
  const duty  = document.getElementById('mDuty').value === 'true';
  if (!name || !phone) { showToast('Please fill all required fields', 'error'); return; }
  const obj = { id, name, phone, zone, onDuty: duty, rating: 4.5, lat: 10.9600, lng: 78.0766 };
  if (state.editingId >= 0) {
    state.collectors[state.editingId] = { ...state.collectors[state.editingId], ...obj };
    showToast('Collector updated successfully ✅');
  } else {
    state.collectors.push(obj);
    showToast('Collector added successfully ✅');
  }
  closeModal(); renderCollectors();
}

function deleteCollector(idx) {
  if (!confirm(`Remove ${state.collectors[idx].name}? This cannot be undone.`)) return;
  state.collectors.splice(idx, 1);
  renderCollectors();
  showToast('Collector removed', 'info');
}

// ─── VEHICLES ─────────────────────────────────────────────────
function renderVehicles(filter = '') {
  const tbody = document.getElementById('vehiclesTbody');
  const list  = state.vehicles.filter(v =>
    v.code.toLowerCase().includes(filter.toLowerCase()) ||
    v.plate.toLowerCase().includes(filter.toLowerCase())
  );
  tbody.innerHTML = list.map((v, i) => `
    <tr>
      <td><code style="font-size:12px;background:#f0f3f7;padding:2px 6px;border-radius:4px">${v.code}</code></td>
      <td><strong>${v.plate}</strong></td>
      <td>${v.type}</td>
      <td>${v.capacity.toLocaleString()} kg</td>
      <td>${v.assignedTo}</td>
      <td><span class="status ${v.active ? 'active' : 'inactive'}">${v.active ? 'Active' : 'Inactive'}</span></td>
      <td class="actions">
        <button class="btn btn-ghost btn-sm" onclick="openVehicleModal(${state.vehicles.indexOf(v)})">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteVehicle(${state.vehicles.indexOf(v)})">🗑️</button>
      </td>
    </tr>`).join('');
}

function openVehicleModal(idx = -1) {
  state.editingId = idx;
  const v = idx >= 0 ? state.vehicles[idx] : null;
  document.getElementById('modalTitle').textContent = v ? 'Edit Vehicle' : 'Add New Vehicle';
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Vehicle Code</label>
          <input id="vCode" value="${v ? v.code : ''}"></div>
        <div class="form-group"><label>Plate Number</label>
          <input id="vPlate" value="${v ? v.plate : ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Type</label>
          <select id="vType">
            ${['Truck','Auto','Tricycle','Van'].map(t =>
              `<option ${v && v.type===t?'selected':''} value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Capacity (kg)</label>
          <input id="vCap" type="number" value="${v ? v.capacity : ''}"></div>
      </div>
      <div class="form-group"><label>Assign to Collector</label>
        <select id="vAssign">
          <option value="—">— Unassigned —</option>
          ${state.collectors.map(c => `<option ${v && v.assignedTo===c.name?'selected':''} value="${c.name}">${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveVehicle()">Save Vehicle</button>
      </div>
    </div>`;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function saveVehicle() {
  const obj = {
    code: document.getElementById('vCode').value.trim(),
    plate: document.getElementById('vPlate').value.trim(),
    type: document.getElementById('vType').value,
    capacity: parseInt(document.getElementById('vCap').value),
    assignedTo: document.getElementById('vAssign').value,
    active: true,
  };
  if (!obj.code || !obj.plate) { showToast('Code and plate required', 'error'); return; }
  if (state.editingId >= 0) {
    state.vehicles[state.editingId] = { ...state.vehicles[state.editingId], ...obj };
    showToast('Vehicle updated ✅');
  } else {
    state.vehicles.push(obj);
    showToast('Vehicle added ✅');
  }
  closeModal(); renderVehicles();
}

function deleteVehicle(idx) {
  if (!confirm(`Remove vehicle ${state.vehicles[idx].code}?`)) return;
  state.vehicles.splice(idx, 1); renderVehicles();
  showToast('Vehicle removed', 'info');
}

// ─── ROUTES ───────────────────────────────────────────────────
function renderRoutes() {
  const grid = document.getElementById('routeGrid');
  grid.innerHTML = state.routes.map(r => {
    const pct = r.houses > 0 ? Math.round(r.completed / r.houses * 100) : 0;
    return `
    <div class="route-card">
      <h4>🗺️ ${r.name}</h4>
      <div class="route-meta">
        <span>👷 ${r.collector}</span>
        <span>🚛 ${r.vehicle}</span>
        <span>📅 ${r.day}</span>
        <span>🏠 ${r.houses} houses</span>
      </div>
      <div style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
          <span style="color:var(--muted)">Progress</span><strong>${pct}%</strong>
        </div>
        <div style="background:#f0f3f7;border-radius:4px;height:6px">
          <div style="width:${pct}%;background:var(--accent);height:100%;border-radius:4px;transition:.6s"></div>
        </div>
      </div>
      <div class="route-footer">
        <span style="font-size:12px;color:var(--muted)">${r.completed}/${r.houses} collected</span>
        <button class="btn btn-ghost btn-sm" onclick="openRouteModal(${state.routes.indexOf(r)})">✏️ Edit</button>
      </div>
    </div>`;
  }).join('');
}

function openRouteModal(idx = -1) {
  state.editingId = idx;
  const r = idx >= 0 ? state.routes[idx] : null;
  document.getElementById('modalTitle').textContent = r ? 'Edit Route' : 'Create New Route';
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-form">
      <div class="form-group"><label>Route Name</label>
        <input id="rName" value="${r ? r.name : ''}" placeholder="e.g. Zone A — North Circuit"></div>
      <div class="form-row">
        <div class="form-group"><label>Zone</label>
          <select id="rZone">
            ${['Zone A','Zone B','Zone C','Zone D'].map(z =>
              `<option ${r&&r.zone===z?'selected':''} value="${z}">${z}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Schedule Day(s)</label>
          <input id="rDay" value="${r ? r.day : 'Mon/Thu'}" placeholder="Mon/Thu"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Assign Collector</label>
          <select id="rCollector">
            ${state.collectors.map(c => `<option ${r&&r.collector===c.name?'selected':''} value="${c.name}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Assign Vehicle</label>
          <select id="rVehicle">
            <option value="—">— None —</option>
            ${state.vehicles.map(v => `<option ${r&&r.vehicle===v.code?'selected':''} value="${v.code}">${v.code} (${v.plate})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group"><label>Number of Houses</label>
        <input id="rHouses" type="number" value="${r ? r.houses : 0}"></div>
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveRoute()">Save Route</button>
      </div>
    </div>`;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function saveRoute() {
  const obj = {
    id:        state.editingId >= 0 ? state.routes[state.editingId].id : 'R-0' + (state.routes.length + 1),
    name:      document.getElementById('rName').value.trim(),
    zone:      document.getElementById('rZone').value,
    day:       document.getElementById('rDay').value,
    collector: document.getElementById('rCollector').value,
    vehicle:   document.getElementById('rVehicle').value,
    houses:    parseInt(document.getElementById('rHouses').value) || 0,
    completed: state.editingId >= 0 ? state.routes[state.editingId].completed : 0,
  };
  if (!obj.name) { showToast('Route name required', 'error'); return; }
  if (state.editingId >= 0) state.routes[state.editingId] = obj;
  else state.routes.push(obj);
  closeModal(); renderRoutes();
  showToast('Route saved ✅');
}

// ─── LIVE TRACKING MAP ─────────────────────────────────────────
function initTrackingMap() {
  if (state.map) { state.map.invalidateSize(); return; }
  const center = [10.9601, 78.0766];
  state.map = L.map('trackingMap').setView(center, 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors', maxZoom: 19,
  }).addTo(state.map);

  // House markers
  [[10.9605,78.0768],[10.9595,78.0758],[10.9615,78.0772],[10.9588,78.0780]].forEach(([lat,lng], i) => {
    L.circleMarker([lat, lng], { radius: 7, fillColor: '#f0f3f7', color: '#636e72', weight: 2, fillOpacity: 1 })
      .addTo(state.map).bindPopup(`House ${i+1} — Pending`);
  });

  const chips = document.getElementById('trackerChips');
  chips.innerHTML = '';
  state.collectors.filter(c => c.onDuty).forEach(c => {
    // Chip
    const chip = document.createElement('div');
    chip.className = 'collector-chip'; chip.id = 'chip-' + c.id;
    chip.innerHTML = `<span class="chip-dot"></span>${c.name}`;
    chip.onclick = () => {
      document.querySelectorAll('.collector-chip').forEach(el => el.classList.remove('active'));
      chip.classList.add('active');
      state.map.setView([c.lat, c.lng], 16);
    };
    chips.appendChild(chip);

    // Marker
    const icon = L.divIcon({
      html: `<div style="background:#2ecc71;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)">${c.name.split(' ').map(w=>w[0]).join('')}</div>`,
      iconSize: [34, 34], iconAnchor: [17, 17],
    });
    const marker = L.marker([c.lat, c.lng], { icon }).addTo(state.map)
      .bindPopup(`<b>${c.name}</b><br>Zone: ${c.zone}<br>⭐ ${c.rating}`);
    state.markers.push({ collector: c, marker });

    // Simulate movement
    setInterval(() => {
      const dlat = (Math.random() - 0.5) * 0.0008;
      const dlng = (Math.random() - 0.5) * 0.0008;
      c.lat += dlat; c.lng += dlng;
      marker.setLatLng([c.lat, c.lng]);
    }, 4000);
  });
}

// ─── REPORTS ──────────────────────────────────────────────────
function initCharts() {
  const reportData = [
    { name: 'Ravi',  rate: 95, seg: 92, rating: 4.8 },
    { name: 'Priya', rate: 88, seg: 86, rating: 4.5 },
    { name: 'Ahmed', rate: 72, seg: 70, rating: 4.2 },
    { name: 'Meena', rate: 100,seg: 97, rating: 4.9 },
    { name: 'Suresh',rate: 65, seg: 60, rating: 3.9 },
  ];

  const perfCtx = document.getElementById('perfChart').getContext('2d');
  if (state.charts.perf) state.charts.perf.destroy();
  state.charts.perf = new Chart(perfCtx, {
    type: 'bar',
    data: {
      labels: reportData.map(d => d.name),
      datasets: [
        { label: 'Collection %', data: reportData.map(d => d.rate), backgroundColor: 'rgba(46,204,113,.8)', borderRadius: 5 },
        { label: 'Segregation %',data: reportData.map(d => d.seg),  backgroundColor: 'rgba(9,132,227,.6)',  borderRadius: 5 },
      ]
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { min: 50, max: 105 } }, responsive: true, maintainAspectRatio: false }
  });

  const wasteCtx = document.getElementById('wasteChart').getContext('2d');
  if (state.charts.waste) state.charts.waste.destroy();
  state.charts.waste = new Chart(wasteCtx, {
    type: 'doughnut',
    data: {
      labels: ['Organic', 'Plastic', 'Paper', 'Metal', 'Glass', 'E-Waste'],
      datasets: [{ data: [38, 27, 15, 10, 6, 4],
        backgroundColor: ['#2ecc71','#0984e3','#fdcb6e','#a29bfe','#00b894','#e17055'], borderWidth: 0 }]
    },
    options: { plugins: { legend: { position: 'bottom' } }, cutout: '60%', responsive: true, maintainAspectRatio: false }
  });

  renderReports();
}

function renderReports() {
  const data = [
    { name: 'Ravi Kumar',   assigned: 45, collected: 43, rate: 95.6, seg: 92.0, rating: 4.8 },
    { name: 'Priya Sharma', assigned: 38, collected: 33, rate: 86.8, seg: 84.0, rating: 4.5 },
    { name: 'Ahmed Khan',   assigned: 52, collected: 37, rate: 71.2, seg: 69.0, rating: 4.2 },
    { name: 'Meena Devi',   assigned: 41, collected: 41, rate: 100.0,seg: 97.0, rating: 4.9 },
    { name: 'Suresh Babu',  assigned: 35, collected: 23, rate: 65.7, seg: 60.0, rating: 3.9 },
  ];
  const grade = r => r >= 90 ? '<span class="status on-duty">A</span>' :
                    r >= 75 ? '<span class="status active">B</span>' :
                              '<span class="status open">C</span>';
  document.getElementById('reportTbody').innerHTML = data.map(d => `
    <tr>
      <td><strong>${d.name}</strong></td>
      <td>${d.assigned}</td><td>${d.collected}</td>
      <td>${d.rate}%</td><td>${d.seg}%</td>
      <td>⭐ ${d.rating}</td>
      <td>${grade(d.rate)}</td>
    </tr>`).join('');
}

function exportReport() {
  showToast('Report exported as CSV ✅', 'success');
}

// ─── SALARY ───────────────────────────────────────────────────
function renderSalary(calculated = false) {
  document.getElementById('salaryTbody').innerHTML = state.salary.map(s => {
    const total = s.base + s.collection + s.seg + s.attendance + s.rating - s.penalty;
    return `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td class="salary-amt">₹${s.base.toLocaleString()}</td>
      <td class="salary-amt" style="color:#2ecc71">+₹${s.collection.toLocaleString()}</td>
      <td class="salary-amt" style="color:#0984e3">+₹${s.seg.toLocaleString()}</td>
      <td class="salary-amt" style="color:#00b894">+₹${s.attendance.toLocaleString()}</td>
      <td class="salary-amt" style="color:#a29bfe">+₹${s.rating.toLocaleString()}</td>
      <td class="salary-amt" style="color:#e17055">-₹${s.penalty.toLocaleString()}</td>
      <td class="salary-amt"><strong>₹${total.toLocaleString()}</strong></td>
      <td><span class="status ${calculated ? 'paid' : 'pending'}">${calculated ? 'Calculated' : 'Pending'}</span></td>
    </tr>`;
  }).join('');
}

function calculateAllSalaries() {
  showToast('⚡ Calculating salaries for all collectors…', 'info');
  setTimeout(() => { renderSalary(true); showToast('✅ All salaries calculated for July 2025!'); }, 1200);
}

// ─── COMPLAINTS ───────────────────────────────────────────────
function renderComplaints(filter) {
  const list = filter === 'all' ? state.complaints :
               state.complaints.filter(c => c.status === filter);
  document.getElementById('complaintsList').innerHTML = list.map(c => `
    <div class="complaint-card">
      <div class="complaint-priority priority-${c.priority.toLowerCase()}"></div>
      <div class="complaint-body">
        <h4>${c.title}</h4>
        <p>${c.desc}</p>
        <div class="complaint-meta">
          <span>👤 ${c.resident}</span>
          <span>👷 ${c.collector}</span>
          <span>📅 ${c.date}</span>
          <span class="status ${c.status}">${c.status.replace('_',' ').toUpperCase()}</span>
          <span style="background:rgba(0,0,0,.06);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">
            ${c.priority.toUpperCase()}
          </span>
        </div>
      </div>
      <div class="complaint-actions">
        ${c.status !== 'resolved' ? `<button class="btn btn-primary btn-sm" onclick="resolveComplaint('${c.id}')">✅ Resolve</button>` : ''}
        ${c.status === 'open' ? `<button class="btn btn-ghost btn-sm" onclick="progressComplaint('${c.id}')">▶ Start</button>` : ''}
      </div>
    </div>`).join('') || '<div class="card" style="text-align:center;color:var(--muted);padding:40px">No complaints in this category</div>';
}

function filterComplaints(filter, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderComplaints(filter);
}

function resolveComplaint(id) {
  const c = state.complaints.find(x => x.id === id);
  if (c) { c.status = 'resolved'; renderComplaints('all'); document.querySelector('.filter-btn').click(); }
  showToast('Complaint marked as resolved ✅');
  document.getElementById('complaintBadge').textContent =
    state.complaints.filter(c => c.status === 'open').length;
}

function progressComplaint(id) {
  const c = state.complaints.find(x => x.id === id);
  if (c) { c.status = 'in_progress'; renderComplaints('all'); }
  showToast('Complaint moved to In Progress', 'info');
}

// ─── MODAL ────────────────────────────────────────────────────
function closeModal() { document.getElementById('modalOverlay').style.display = 'none'; }

// ─── TOAST ────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── BOOTSTRAP ────────────────────────────────────────────────
window.onload = () => {
  // Auto-show section from URL if needed
};
