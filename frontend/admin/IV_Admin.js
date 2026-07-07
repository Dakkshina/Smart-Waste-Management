// Sample data
let collectors = [{
        name: "Ravi Kumar",
        phone: "+911234567890"
    },
    {
        name: "Priya Sharma",
        phone: "+919876543210"
    },
    {
        name: "Ahmed Khan",
        phone: "+911112223334"
    }
];

let vehicles = [{
        id: "V-101",
        plate: "DL01AB1234"
    },
    {
        id: "V-102",
        plate: "MH02XY5678"
    },
    {
        id: "V-103",
        plate: "KA03PQ9999"
    }
];

// Map
let map;
let markers = [];

// Show sections
function showSection(id) {
    // Hide all sections
    document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
    // Show selected section
    document.getElementById(id).style.display = "block";

    // Highlight active nav item
    document.querySelectorAll(".sidebar ul li").forEach(li => li.classList.remove("active"));
    let target = Array.from(document.querySelectorAll(".sidebar ul li"))
        .find(li => li.getAttribute("onclick").includes(id));
    if (target) target.classList.add("active");

    // Load dynamic data if required
    if (id === "collectors") renderCollectors();
    if (id === "vehicle") renderVehicles();
    if (id === "tracking") initMap();
}

// Render collectors
function renderCollectors() {
    let ul = document.getElementById("collectorList");
    ul.innerHTML = "";
    collectors.forEach(c => {
        let li = document.createElement("li");
        li.innerHTML = `<b>${c.name}</b><br>📞 <a href="tel:${c.phone}">${c.phone}</a>`;
        ul.appendChild(li);
    });
}

// Render vehicles
function renderVehicles() {
    let ul = document.getElementById("vehicleList");
    ul.innerHTML = "";
    vehicles.forEach(v => {
        let li = document.createElement("li");
        li.innerHTML = `<b>Vehicle ID:</b> ${v.id} | <b>Plate:</b> ${v.plate}`;
        ul.appendChild(li);
    });
}

// Init map
function initMap() {
    if (map) {
        map.invalidateSize();
        return;
    }

    map = L.map('map').setView([28.6139, 77.2090], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let locations = [{
            name: "Ravi Kumar",
            lat: 28.6139,
            lng: 77.2090
        },
        {
            name: "Priya Sharma",
            lat: 28.7041,
            lng: 77.1025
        },
        {
            name: "Ahmed Khan",
            lat: 28.5355,
            lng: 77.3910
        }
    ];

    locations.forEach(loc => {
        let marker = L.marker([loc.lat, loc.lng]).addTo(map)
            .bindPopup(`<b>${loc.name}</b><br>Live location`);
        markers.push(marker);
    });
}