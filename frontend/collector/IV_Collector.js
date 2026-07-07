// Example household data with GPS + phone
let households = [{
        name: "House 1",
        address: "12 Main Street",
        phone: "+911234567890",
        lat: 28.6139,
        lng: 77.2090,
        completed: false
    },
    {
        name: "House 2",
        address: "45 Park Avenue",
        phone: "+919876543210",
        lat: 28.7041,
        lng: 77.1025,
        completed: false
    },
    {
        name: "House 3",
        address: "78 Lake Road",
        phone: "+911112223334",
        lat: 28.5355,
        lng: 77.3910,
        completed: false
    }
];

let completedCount = 0;
let pendingCount = households.length;
let notAvailableCount = 0;

let map;
let markers = [];

// Initialize Map
function initMap() {
    map = L.map('map').setView([28.6139, 77.2090], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    households.forEach((house, index) => {
        let marker = L.marker([house.lat, house.lng]).addTo(map)
            .bindPopup(`<b>${house.name}</b><br>${house.address}`);
        markers.push(marker);
    });

    document.getElementById("total").innerText = households.length;
    document.getElementById("pending").innerText = pendingCount;
}

// Toggle Household List
function toggleHouseholds() {
    let listDiv = document.getElementById("householdList");
    listDiv.classList.toggle("hidden");

    let ul = document.getElementById("households");
    ul.innerHTML = "";

    households.forEach((house, index) => {
        let li = document.createElement("li");
        li.className = "household-item";
        li.innerHTML = `
      <strong id="house-${index}">${house.name}</strong><br>
      <small>${house.address}</small><br>
      <small>📞 ${house.phone}</small>
      <div class="household-actions">
        <input type="file" id="photo-${index}" accept="image/*" onchange="enableComplete(${index})">
        <button id="complete-${index}" onclick="markCompleted(${index})" disabled>Completed</button>
        <button id="notavailable-${index}" onclick="markNotAvailable(${index})">Not Available</button>
        <button onclick="callHousehold('${house.phone}')">Call</button>
        <button onclick="toggleReport(${index})">Report</button>
      </div>
      <div id="feedback-${index}" class="feedback">
        <p><b>Feedback for ${house.name}</b></p>
        <label><input type="radio" name="fb-${index}" value="Good"> Good</label><br>
        <label><input type="radio" name="fb-${index}" value="Average"> Average</label><br>
        <label><input type="radio" name="fb-${index}" value="Poor"> Poor</label><br>
        <button onclick="submitFeedback(${index})">Submit Feedback</button>
      </div>
      <div id="report-${index}" class="report">
        <p><b>Report for ${house.name}</b></p>
        <textarea id="report-text-${index}" rows="3" placeholder="Enter remarks..."></textarea><br>
        <button onclick="submitReport(${index})">Submit Report</button>
      </div>
    `;
        ul.appendChild(li);
    });
}

// Enable "Completed" button only after photo
function enableComplete(index) {
    document.getElementById(`complete-${index}`).disabled = false;
}

// Mark Completed
function markCompleted(index) {
    if (households[index].completed) return;

    households[index].completed = true;
    completedCount++;
    pendingCount--;

    // Green tick on map
    markers[index].setIcon(new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
        iconSize: [30, 30]
    }));

    // Disable other actions
    document.getElementById(`complete-${index}`).disabled = true;
    document.getElementById(`notavailable-${index}`).disabled = true;
    document.getElementById(`photo-${index}`).disabled = true;

    // Show feedback automatically
    document.getElementById(`feedback-${index}`).style.display = "block";

    updateStats();
}

// Mark Not Available
function markNotAvailable(index) {
    if (households[index].completed) return;

    notAvailableCount++;
    pendingCount--;

    document.getElementById(`complete-${index}`).disabled = true;
    document.getElementById(`notavailable-${index}`).disabled = true;
    document.getElementById(`photo-${index}`).disabled = true;

    updateStats();
}

// Call Household
function callHousehold(phone) {
    window.location.href = `tel:${phone}`;
}

// Submit Feedback
function submitFeedback(index) {
    let choice = document.querySelector(`input[name="fb-${index}"]:checked`);
    if (choice) {
        alert(`Feedback for ${households[index].name}: ${choice.value}`);
    } else {
        alert("Please select a feedback option.");
    }
}

// Show/Hide Report
function toggleReport(index) {
    let rep = document.getElementById(`report-${index}`);
    rep.style.display = rep.style.display === "block" ? "none" : "block";
}

// Submit Report
function submitReport(index) {
    let text = document.getElementById(`report-text-${index}`).value;
    if (text.trim() === "") {
        alert("Please enter remarks.");
    } else {
        alert(`Report submitted for ${households[index].name}: ${text}`);
    }
}

// Update Stats
function updateStats() {
    document.getElementById("completed").innerText = completedCount;
    document.getElementById("pending").innerText = pendingCount;
    document.getElementById("notavailable").innerText = notAvailableCount;

    let percent = (completedCount / households.length) * 100;
    document.getElementById("progress").style.width = percent + "%";
}

// Init
window.onload = initMap;