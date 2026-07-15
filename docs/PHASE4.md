# Phase 4 — Resident App ✅

## Files

| File | Lines | Description |
|------|-------|-------------|
| `frontend/households/IV_HouseHolds.html` | 288 | App shell — login + 6 screens + 2 modals |
| `frontend/households/IV_HouseHolds.css`  | 416 | Mobile-first PWA, teal + orange palette |
| `frontend/households/IV_HouseHolds.js`   | 541 | Full JS — all features |
| `frontend/households/sw.js`              | 25  | Service Worker — offline + push |
| `frontend/households/manifest.json`      | 15  | PWA install manifest |

## Screens

| Screen | Features |
|--------|----------|
| 🔐 **Login** | Phone + password, demo: 9001122334 / house123 |
| 🏠 **Home** | Today's pickup card, compliance ring, quick actions, notification preview |
| 📍 **Track** | Live Leaflet map — collector 🚛 + your house 🏠, ETA countdown, distance |
| 📋 **History** | Monthly compliance bar chart (Chart.js) + full collection log |
| 🚨 **Complaints** | File complaint (type, priority, photo), filter by status |
| ♻️ **Guide** | Collapsible waste segregation guide — 5 categories |
| 🔔 **Notifications** | All alerts with unread indicator |

## Standout Features

### Collector Nearby Banner
Auto-shows after 2 seconds — simulates real-time proximity alert:
`🚛 Collector is 320m away · ETA 4 min` → counts down every 4 seconds

### Live Tracking Map
- Leaflet map with collector 🚛 marker animated toward your house
- Your house 🏠 marked with teal pin
- Dotted polyline shows remaining route
- Nearby pending houses shown on route

### Pickup Status Card
Two-state button pair — tap "Picked Up" or "Not Picked":
- Picked → green card, success toast
- Not Picked → red card, auto-complaint filed toast

### Compliance Ring (SVG)
Animated SVG ring showing monthly segregation score (87%)
- Animates on load with stroke-dashoffset transition

### Segregation Guide (5 categories)
- 🥕 Organic / Wet Waste
- 🧴 Dry / Recyclable
- 💡 E-Waste
- 💉 Hazardous
- 👗 Sanitary / Rejects
Each card expands with Do ✓ / Don't ✗ lists

## Demo
```
Open: frontend/households/IV_HouseHolds.html
Login: 9001122334 / house123
```
