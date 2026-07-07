# 🗑️ Smart Waste Management System

> A Smart IoT and GPS-Enabled Waste Monitoring System with Real-Time Feedback and Automated Wage Allocation

[![SIH 2025](https://img.shields.io/badge/Smart%20India%20Hackathon-2025-blue)](https://www.sih.gov.in/)
[![Phase](https://img.shields.io/badge/Phase-1%20Complete-green)]()
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📌 Project Overview

This system is a full-stack **Smart Waste Management Ecosystem** that integrates IoT, GPS tracking, AI-based waste detection, and automated performance-based wage calculation into a unified platform for urban local bodies (ULBs).

---

## 👥 Users / Roles

| Role        | Description                                               |
|-------------|-----------------------------------------------------------|
| **Admin**   | Full control — manages collectors, routes, reports, wages |
| **Collector** | Field worker — GPS tracked, scans QR, captures waste images |
| **Household** | Resident — views pickup status, submits feedback & complaints |
| **Warehouse** | Manages incoming waste, segregation, and recycling records |
| **Authority** | Government oversight — reads reports and analytics |

---

## 🏗️ System Modules

| # | Module | Status |
|---|--------|--------|
| 1 | Admin Dashboard | ✅ UI Done |
| 2 | Collector Mobile App | ✅ UI Done |
| 3 | Household Resident App | ✅ UI Done |
| 4 | AI Waste Detection (YOLOv8) | 🔲 Phase 5 |
| 5 | GPS Live Tracking | ✅ UI Done |
| 6 | Performance-Based Wage Calculation | 🔲 Phase 6 |
| 7 | AI Analytics Dashboard | 🔲 Phase 5 |
| 8 | Complaint Management | ✅ UI Done |
| 9 | Warehouse Management | 🔲 Phase 6 |

---

## 🗂️ Folder Structure

```
Smart-Waste-Management/
│
├── frontend/
│   ├── admin/          → Admin Dashboard (HTML/CSS/JS)
│   ├── collector/      → Collector App (HTML/CSS/JS)
│   ├── households/     → Resident App (HTML/CSS/JS)
│   └── main/           → Landing / Login Page
│
├── backend/
│   ├── routes/         → Express.js API routes
│   ├── controllers/    → Business logic
│   ├── models/         → PostgreSQL models
│   ├── middleware/     → Auth, RBAC, logging
│   └── config/         → DB, env, cloud config
│
├── ai-service/         → YOLOv8 FastAPI microservice
├── database/
│   └── migrations/     → SQL schema files
├── deployment/         → Docker, Nginx configs
├── docs/               → Architecture, API, DB docs
└── .github/workflows/  → CI/CD pipelines
```

---

## 🛠️ Tech Stack

### Frontend
- HTML5 / CSS3 / JavaScript (current)
- React.js (Admin Dashboard — Phase 2)
- React Native (Collector & Resident Apps — Phase 3 & 4)

### Backend
- Node.js + Express.js
- JWT Authentication + RBAC

### Database
- PostgreSQL (25 tables)

### AI
- YOLOv8 + OpenCV
- Python FastAPI microservice
- Dataset: TrashNet + TACO + Custom Indian Garbage Dataset

### Maps & Location
- Leaflet.js (current) → Google Maps API (Phase 2+)

### Cloud & DevOps
- AWS S3 (waste images)
- Firebase Cloud Messaging (notifications)
- Docker + GitHub Actions
- Render / Railway / AWS EC2

---

## 🚀 Development Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | System Architecture, DB Schema, API Design, UI/UX | ✅ **Complete** |
| **Phase 2** | Admin Dashboard — Auth, Collectors, Routes, GPS, Reports | 🔲 Pending |
| **Phase 3** | Collector App — QR, GPS, Image Upload, Offline Sync | 🔲 Pending |
| **Phase 4** | Resident App — Notifications, Feedback, Complaints | 🔲 Pending |
| **Phase 5** | AI Microservice — YOLOv8 integration + Backend API | 🔲 Pending |
| **Phase 6** | Wage Calc, Analytics, Warehouse, Deployment | 🔲 Pending |

---

## 📄 Phase 1 Deliverables

- 📐 [System Architecture](docs/ARCHITECTURE.md)
- 🗄️ [Database Schema](docs/DATABASE_SCHEMA.sql)
- 🔌 [API Design](docs/API_DESIGN.md)
- 🎨 [UI/UX Guidelines](docs/UIUX_GUIDELINES.md)

---

## ⚙️ Quick Start (Phase 1 — Frontend Preview)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Smart-Waste-Management.git
cd Smart-Waste-Management

# Open any frontend page directly in browser
open frontend/main/IV_Mainpage.html
open frontend/admin/IV_Admin.html
open frontend/collector/IV_Collector.html
open frontend/households/IV_HouseHolds.html
```

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

> Built for **Smart India Hackathon (SIH)** — *Making India Cleaner, Smarter, Greener* 🇮🇳
