let map;
let vehicleMarker;
let householdMarkers = [];
let households = [{
        id: 1,
        name: "House 1",
        address: "12 Main Street",
        lat: 10.9601,
        lng: 78.0766,
        completed: false
    },
    {
        id: 2,
        name: "House 2",
        address: "45 Park Avenue",
        lat: 10.9611,
        lng: 78.0770,
        completed: false
    },
    {
        id: 3,
        name: "House 3",
        address: "78 Lake Road",
        lat: 10.9620,
        lng: 78.0780,
        completed: false
    }
];

function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
    if (id === "map") renderMap();
}

function renderMap() {
    if (!map) {
        map = L.map("mapArea").setView([households[0].lat, households[0].lng], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);

        households.forEach((house, i) => {
            const marker = L.marker([house.lat, house.lng]).addTo(map);
            marker.bindPopup(`<strong>${house.name}</strong><br>${house.address}<br><button onclick="markCollected(${i})">Mark Collected</button>`);
            householdMarkers.push(marker);
        });

        vehicleMarker = L.marker([households[0].lat, households[0].lng], {
            icon: L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854866.png",
                iconSize: [32, 32]
            })
        }).addTo(map).bindPopup("Collection Vehicle 🚛");
    }

    setTimeout(() => map.invalidateSize(), 200);
}

function markCollected(i) {
    households[i].completed = true;
    householdMarkers[i].bindPopup(`<strong>${households[i].name}</strong><br>${households[i].address}<br>✅ Collected`);
    householdMarkers[i].setIcon(L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
        iconSize: [32, 32]
    }));
    alert(`${households[i].name} marked as collected.`);
}

function scanObject() {
    const categories = ["Recyclable ♻️", "Non-Recyclable 🚯", "Bio-Degradable 🌱", "Non-Bio-Degradable ❌🌱"];
    const result = categories[Math.floor(Math.random() * categories.length)];
    document.getElementById("scanResult").innerText = "Scan Result: " + result;
}

function submitFeedback() {
    const name = document.getElementById("feedbackName").value.trim();
    const phone = document.getElementById("feedbackPhone").value.trim();
    const behaviour = document.getElementById("collectorBehaviour").value;

    if (!name || !/^\d{10}$/.test(phone)) {
        alert("Please enter valid name and mobile.");
        return;
    }

    alert(`Feedback submitted!\nName: ${name}\nPhone: ${phone}\nBehaviour: ${behaviour}`);
    document.getElementById("feedbackName").value = "";
    document.getElementById("feedbackPhone").value = "";
    document.getElementById("collectorBehaviour").value = "Excellent";
}

function submitReport() {
    const name = document.getElementById("reportName").value.trim();
    const address = document.getElementById("reportAddress").value.trim();
    const comments = document.getElementById("reportComments").value.trim();

    if (!name || !address || !comments) {
        alert("Please fill all fields.");
        return;
    }

    alert("Report submitted successfully!");
    document.getElementById("reportName").value = "";
    document.getElementById("reportAddress").value = "";
    document.getElementById("reportComments").value = "";
}

function limitWords(textarea, maxWords) {
    const words = textarea.value.trim().split(/\s+/);
    if (words.length > maxWords) {
        textarea.value = words.slice(0, maxWords).join(" ");
        alert(`Maximum ${maxWords} words allowed.`);
    }
}

function emergencyCall() {
    window.location.href = "tel:+911234567890";
}

function garbageClicked(status) {
    alert(status === "picked" ? "Marked: Picked Up" : "Marked: Not Picked Up");
    document.getElementById("pickedBtn").disabled = true;
    document.getElementById("notPickedBtn").disabled = true;
}

// Simulate vehicle movement
setInterval(() => {
    if (!vehicleMarker) return;
    const lat = households[0].lat + (Math.random() - 0.5) / 1000;
    const lng = households[0].lng + (Math.random() - 0.5) / 1000;
    vehicleMarker.setLatLng([lat, lng]);
    map.setView([lat, lng], 15);
}, 5000);