# Phase 3 — Collector App ✅

## Overview
A mobile-first **Progressive Web App (PWA)** for field collectors — works offline, tracks GPS, and guides the collector through a 4-step collection workflow.

## Files

| File | Lines | Description |
|------|-------|-------------|
| `frontend/collector/IV_Collector.html` | 214 | App shell — login + 5 screens + modals |
| `frontend/collector/IV_Collector.css`  | 425 | Mobile-first PWA styles |
| `frontend/collector/IV_Collector.js`   | 664 | Full feature JS |
| `frontend/collector/sw.js`             | 90  | Service Worker — offline cache + push |
| `frontend/collector/manifest.json`     | 20  | PWA install manifest |

## Screens

| Screen | Features |
|--------|----------|
| 🔐 **Login** | Phone + password auth, demo credentials pre-filled |
| 🏠 **Home** | SVG progress ring, duty toggle, quick-nav cards, live activity feed |
| 🗂️ **Route** | House list with filter tabs, expandable action buttons per house |
| 📍 **Map** | Leaflet map with live GPS position, colour-coded house markers |
| 📊 **Stats** | KPI grid, salary breakdown preview, feedback received cards |
| 🔔 **Alerts** | Admin messages, feedback notifications, route updates |

## 4-Step Collection Wizard
When a collector taps **📷 Collect** on any house:

```
Step 1 — Scan QR Code
        Tap to open camera → simulate QR scan → house verified

Step 2 — Capture Waste Photo
        Camera opens → photo preview shown → ready to analyse

Step 3 — AI Analysis (YOLOv8 mock)
        1.8s animated analysis →
        Waste bars: Organic 42%, Plastic 28%, Paper 18%, Metal 8%, Glass 4%
        Segregation: PASS ✅ or FAIL ❌

Step 4 — Rate Household + Complete
        Quick feedback: Excellent / Good / Poor
        Optional remarks
        → Mark Complete → data synced
```

## Key Technical Features

### GPS Tracking
- Uses `navigator.geolocation.watchPosition` for real GPS
- Falls back to simulated movement for demo
- Pushes coordinates to `/api/v1/collector/me/gps/update` every 5s
- Live marker on Leaflet map follows position

### Offline-First
- Service Worker caches app shell (HTML, CSS, JS, Leaflet)
- Collections saved to `localStorage` immediately
- Offline queue auto-syncs when internet reconnects
- Network status dot in topbar (green/red)

### PWA Features
- Installable on Android/iOS (`manifest.json`)
- Full-screen standalone mode
- Push notification handler in Service Worker
- Background sync for pending collections

## How to Use
```bash
# Open directly in browser
open frontend/collector/IV_Collector.html

# Login with demo credentials:
Phone:    9876543210
Password: ravi123
```
