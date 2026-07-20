# ♻️ Smart Waste Management System

> A Smart IoT and GPS-Enabled Waste Monitoring System with Real-Time Feedback and Automated Wage Allocation

[![SIH 2025](https://img.shields.io/badge/Smart%20India%20Hackathon-2025-blue)](https://www.sih.gov.in/)
[![Phases](https://img.shields.io/badge/Phases-6%2F6%20Complete-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🚀 Quick Start (No server needed for frontend)

```bash
git clone https://github.com/Dakkshina/Smart-Waste-Management.git
cd Smart-Waste-Management

# Open any page directly in your browser:
open frontend/admin/IV_Admin.html          # Admin Dashboard
open frontend/collector/IV_Collector.html  # Collector PWA
open frontend/households/IV_HouseHolds.html # Resident PWA
open frontend/analytics/index.html         # Analytics Dashboard
open frontend/warehouse/index.html         # Warehouse Management
open frontend/ai-demo/index.html           # AI Classifier Demo
```

| App | Demo Login |
|-----|-----------|
| Admin | admin@smartwaste.in / admin123 |
| Collector | 9876543210 / ravi123 |
| Resident | 9001122334 / house123 |

---

## 📁 Project Structure

```
Smart-Waste-Management/
│
├── frontend/
│   ├── admin/          → Admin Dashboard (Phase 2)
│   ├── collector/      → Collector PWA (Phase 3)
│   ├── households/     → Resident PWA (Phase 4)
│   ├── ai-demo/        → AI Classifier Demo (Phase 5)
│   ├── analytics/      → Analytics Dashboard (Phase 6)
│   └── warehouse/      → Warehouse Management (Phase 6)
│
├── backend/            → Node.js + Express API (Phase 2+)
│   ├── controllers/    → Business logic
│   ├── routes/         → Express routes
│   ├── middleware/      → JWT auth + RBAC
│   └── config/         → DB connection
│
├── ai-service/         → Python FastAPI YOLOv8 (Phase 5)
│   ├── main.py         → 7 REST endpoints
│   ├── classifier.py   → YOLOv8 + mock fallback
│   └── utils.py        → Image preprocessing
│
├── docs/               → Architecture, DB schema, API design
└── deployment/         → Docker, Nginx, deploy scripts
```

---

## 🏗️ All 6 Phases — Complete

| Phase | Deliverable | Key Features |
|-------|-------------|-------------|
| **1** | Architecture + Docs | DB schema (25 tables), API design, UI/UX guidelines |
| **2** | Admin Dashboard + Backend | 9-section dashboard, full CRUD API, WebSocket GPS |
| **3** | Collector PWA | 4-step collection wizard, GPS, QR scan, offline sync |
| **4** | Resident PWA | Live collector tracking, feedback, complaints, segregation guide |
| **5** | AI Microservice | YOLOv8 FastAPI, 6 waste classes, interactive demo |
| **6** | Analytics + Warehouse + Deploy | Charts, heatmaps, wage calculator, Docker stack |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS, Leaflet.js, Chart.js |
| Backend | Node.js, Express.js, JWT, WebSocket |
| Database | PostgreSQL (25 tables) |
| AI | Python, FastAPI, YOLOv8 (ultralytics), OpenCV |
| Deployment | Docker, Docker Compose, Nginx |
| Maps | Leaflet.js (OpenStreetMap) |
| PWA | Service Worker, Web Manifest |

---

## 🐳 Full Stack Deployment

```bash
cp deployment/.env.example deployment/.env
# Fill in DB_PASSWORD and JWT_SECRET
bash deployment/scripts/deploy.sh
```

Services started: PostgreSQL · Redis · Node.js API · AI Service · Nginx

---

> Built for **Smart India Hackathon (SIH) 2025** 🇮🇳
