# 🏗️ System Architecture

## Smart Waste Management System — Phase 1

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │  Admin       │  │  Collector    │  │  Household / Resident│ │
│  │  Dashboard   │  │  Mobile App   │  │  App                 │ │
│  │  (React.js)  │  │ (React Native)│  │  (React Native)      │ │
│  └──────┬───────┘  └──────┬────────┘  └──────────┬───────────┘ │
└─────────┼─────────────────┼──────────────────────┼─────────────┘
          │                 │                      │
          └─────────────────┼──────────────────────┘
                            │  HTTPS / REST API / WebSocket
┌───────────────────────────▼───────────────────────────────────────┐
│                         API GATEWAY                                │
│                  (Node.js + Express.js)                            │
│                                                                    │
│  ┌──────────────┐  ┌───────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  Auth/RBAC   │  │  Rate     │  │  Request     │  │Logging  │ │
│  │  Middleware  │  │  Limiter  │  │  Validator   │  │& Audit  │ │
│  └──────────────┘  └───────────┘  └──────────────┘  └─────────┘ │
└─────────┬──────────────────────────────────────────┬─────────────┘
          │                                          │
    ┌─────▼──────────────────────┐    ┌─────────────▼──────────────┐
    │       CORE SERVICES         │    │      AI MICROSERVICE        │
    │                             │    │     (Python FastAPI)        │
    │  ┌──────────┐ ┌──────────┐ │    │                             │
    │  │Collector │ │Household │ │    │  ┌──────────┐ ┌──────────┐ │
    │  │Service   │ │Service   │ │    │  │ YOLOv8   │ │ OpenCV   │ │
    │  └──────────┘ └──────────┘ │    │  │ Detector │ │ Pipeline │ │
    │  ┌──────────┐ ┌──────────┐ │    │  └──────────┘ └──────────┘ │
    │  │GPS/Route │ │Wage Calc │ │    │  ┌──────────────────────┐  │
    │  │Service   │ │Service   │ │    │  │  Waste Classification│  │
    │  └──────────┘ └──────────┘ │    │  │  (Plastic/Organic/   │  │
    │  ┌──────────┐ ┌──────────┐ │    │  │   Metal/Glass/Paper) │  │
    │  │Analytics │ │Notif.    │ │    │  └──────────────────────┘  │
    │  │Service   │ │Service   │ │    └────────────────────────────┘
    │  └──────────┘ └──────────┘ │
    └──────────┬──────────────────┘
               │
    ┌──────────▼──────────────────────────────────────────────────┐
    │                       DATA LAYER                             │
    │                                                              │
    │  ┌─────────────────┐    ┌──────────────┐    ┌───────────┐  │
    │  │  PostgreSQL DB  │    │  AWS S3      │    │  Redis    │  │
    │  │  (25 Tables)    │    │  (Images)    │    │  (Cache)  │  │
    │  └─────────────────┘    └──────────────┘    └───────────┘  │
    └──────────────────────────────────────────────────────────────┘
```

---

## 2. User Role Hierarchy

```
                         ADMIN
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
     COLLECTOR         HOUSEHOLD          AUTHORITY
         │                 │
         └────────────WAREHOUSE────────────────┘
```

### Role Permissions

| Feature                  | Admin | Collector | Household | Warehouse | Authority |
|--------------------------|:-----:|:---------:|:---------:|:---------:|:---------:|
| View All Collectors      |  ✅   |    ❌     |    ❌     |    ❌     |    ✅     |
| Manage Routes            |  ✅   |    ❌     |    ❌     |    ❌     |    ❌     |
| GPS Live Tracking        |  ✅   |    ✅     |    ✅     |    ❌     |    ✅     |
| Submit Waste Photo       |  ❌   |    ✅     |    ❌     |    ❌     |    ❌     |
| Submit Feedback          |  ❌   |    ❌     |    ✅     |    ❌     |    ❌     |
| View Analytics           |  ✅   |    ❌     |    ❌     |    ✅     |    ✅     |
| Wage Calculation         |  ✅   |    ❌     |    ❌     |    ❌     |    ❌     |
| Warehouse Management     |  ✅   |    ❌     |    ❌     |    ✅     |    ❌     |
| View Own Salary          |  ❌   |    ✅     |    ❌     |    ❌     |    ❌     |

---

## 3. Full Collection Workflow

```
PHASE A: Before Collection
─────────────────────────────────────
  House Registration
         │
         ▼
  QR Code / NFC Tag Assigned to House
         │
         ▼
  Admin Creates Daily Route
         │
         ▼
  Route Assigned to Collector + Vehicle

PHASE B: During Collection
─────────────────────────────────────
  Collector Starts Duty
         │
         ▼
  GPS Tracking Activates
         │
         ▼
  Collector Navigates to House
         │
         ▼
  Scan House QR Code
         │
         ▼
  Capture Waste Image
         │
         ▼
  AI Analyses Waste
         │
    ┌────┴────┐
    │         │
  Properly  Mixed /
Segregated  Unsegregated
    │         │
    ▼         ▼
Compliance  Alert sent to
Updated     Household + Admin
    │         │
    └────┬────┘
         ▼
  Data saved to Cloud DB
         │
         ▼
  Next House → Repeat

PHASE C: End of Day
─────────────────────────────────────
  Collection Summary Generated
         │
         ▼
  Performance Score Calculated
         │
         ▼
  Salary Component Updated
         │
         ▼
  Admin Dashboard Updated
```

---

## 4. GPS Tracking Architecture

```
Collector Device (GPS)
        │
        ▼ every 5 seconds
WebSocket Server (Node.js)
        │
        ├──→ PostgreSQL (gps_tracking table)
        │
        ├──→ Admin Dashboard (Live Map)
        │
        └──→ Household App (Collector approaching notification)
```

---

## 5. AI Waste Detection Pipeline

```
Collector captures image
        │
        ▼
Image uploaded to AWS S3
        │
        ▼
FastAPI AI Service called
        │
        ▼
YOLOv8 model inference
        │
        ▼
Objects detected per class:
  ├── Plastic       (confidence %)
  ├── Paper         (confidence %)
  ├── Metal         (confidence %)
  ├── Glass         (confidence %)
  ├── Organic       (confidence %)
  └── E-Waste       (confidence %)
        │
        ▼
Segregation check
        │
   ┌────┴────┐
   │         │
 PASS       FAIL
   │         │
Compliance  Deduction +
Score +1    Household Alert
```

---

## 6. Performance-Based Wage Formula

```
Final Salary = Base Salary
             + (Collection Score   × Weight 0.30)
             + (Segregation Score  × Weight 0.25)
             + (Attendance Score   × Weight 0.20)
             + (Citizen Rating     × Weight 0.15)
             + (Timeliness Bonus   × Weight 0.10)
             - Penalty (missed houses / complaints)

Example:
  Base Salary        = ₹12,000
  Collection Score   = 98%  → +₹2,940
  Segregation Score  = 95%  → +₹2,375
  Attendance         = 100% → +₹2,400
  Citizen Rating     = 4.8  → +₹1,440
  Timeliness Bonus   = 90%  → +₹900
  Penalty            = ₹0
  ─────────────────────────────────
  Final Salary        = ₹22,055
```

---

## 7. Notification Flow

```
Event Triggers:
  ├── Collector is 500m away    → "Your collector is nearby" (Household)
  ├── Waste collected           → "Waste collected ✅" (Household)
  ├── Not available marked      → "Missed pickup, reschedule?" (Household)
  ├── Complaint filed           → Alert (Admin + Collector)
  └── Low compliance score      → Warning (Admin + Collector)

Delivery:
  Firebase Cloud Messaging (FCM)
  ├── Push notification (Mobile)
  └── In-app notification (Web)
```

---

## 8. Security Architecture

```
Authentication:
  ├── JWT (Access Token — 15min expiry)
  ├── Refresh Token (7 days, stored in HttpOnly cookie)
  └── Role-Based Access Control (RBAC)

Data Security:
  ├── HTTPS (TLS 1.3)
  ├── Password hashing (bcrypt, salt rounds 12)
  ├── Input validation (Joi / Zod)
  └── SQL injection prevention (parameterized queries)

Image Security:
  ├── AWS S3 private bucket
  ├── Pre-signed URLs (15min expiry)
  └── File type + size validation
```

---

## 9. Deployment Architecture

```
                      ┌─────────────────┐
                      │   GitHub Actions │
                      │   CI/CD Pipeline │
                      └────────┬────────┘
                               │
                    ┌──────────▼──────────┐
                    │      Docker Hub      │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼──────────────────────┐
          │                    │                      │
   ┌──────▼───────┐   ┌────────▼──────┐   ┌──────────▼──────┐
   │  Web Server  │   │  API Server   │   │  AI Microservice │
   │  (Nginx)     │   │  (Node.js)    │   │  (Python FastAPI)│
   └──────────────┘   └───────┬───────┘   └─────────────────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
       ┌───────▼────┐  ┌──────▼──────┐ ┌────▼──────┐
       │ PostgreSQL │  │   Redis     │ │  AWS S3   │
       │ Database   │  │   Cache     │ │  Storage  │
       └────────────┘  └─────────────┘ └───────────┘
```
