# 🔌 API Design — Smart Waste Management System

**Base URL:** `https://api.smartwaste.in/v1`  
**Auth:** JWT Bearer Token  
**Format:** JSON  

---

## Authentication

### POST `/auth/register`
Register a new user.
```json
Request:
{
  "full_name": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "9876543210",
  "password": "SecurePass@123",
  "role": "collector"
}

Response 201:
{
  "success": true,
  "user": { "id": "uuid", "full_name": "Ravi Kumar", "role": "collector" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST `/auth/login`
```json
Request:
{ "email": "ravi@example.com", "password": "SecurePass@123" }

Response 200:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "...",
  "user": { "id": "uuid", "role": "collector" }
}
```

### POST `/auth/refresh` — Refresh access token
### POST `/auth/logout` — Invalidate token

---

## Admin — Collector Management

### GET `/admin/collectors`
List all collectors.
```json
Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "full_name": "Ravi Kumar",
      "employee_id": "EMP-001",
      "phone": "9876543210",
      "zone_assigned": "Zone A",
      "is_on_duty": true,
      "base_salary": 12000
    }
  ]
}
```

### POST `/admin/collectors` — Add collector
### GET `/admin/collectors/:id` — Get single collector
### PUT `/admin/collectors/:id` — Update collector
### DELETE `/admin/collectors/:id` — Remove collector

---

## Admin — Vehicle Management

### GET `/admin/vehicles` — List vehicles
### POST `/admin/vehicles` — Add vehicle
```json
Request:
{
  "vehicle_code": "V-101",
  "plate_number": "KL07AB1234",
  "type": "truck",
  "capacity_kg": 2000,
  "gps_device_id": "GPS-001"
}
```
### PUT `/admin/vehicles/:id` — Update vehicle
### DELETE `/admin/vehicles/:id` — Remove vehicle

---

## Admin — Route Management

### GET `/admin/routes` — List all routes
### POST `/admin/routes` — Create route
```json
Request:
{
  "route_name": "Zone A - North",
  "zone": "Zone A",
  "assigned_collector": "collector_uuid",
  "assigned_vehicle": "vehicle_uuid",
  "schedule_day": "Mon",
  "house_ids": ["house_uuid_1", "house_uuid_2"]
}
```
### GET `/admin/routes/:id/houses` — List houses on route
### PUT `/admin/routes/:id` — Update route
### DELETE `/admin/routes/:id` — Delete route

---

## Admin — Reports & Analytics

### GET `/admin/reports/collector/:id?month=7&year=2025`
Collector performance report.
```json
Response 200:
{
  "collector": { "name": "Ravi Kumar", "employee_id": "EMP-001" },
  "period": "July 2025",
  "total_assigned": 120,
  "collected": 115,
  "collection_pct": 95.8,
  "segregation_pct": 92.0,
  "avg_rating": 4.6,
  "attendance_pct": 100,
  "complaints": 1,
  "estimated_salary": 21500
}
```

### GET `/admin/reports/analytics/daily?date=2025-07-01`
### GET `/admin/reports/analytics/monthly?month=7&year=2025`
### GET `/admin/reports/warehouse?from=2025-07-01&to=2025-07-31`

---

## Admin — Salary

### GET `/admin/salary?month=7&year=2025` — View all salaries
### POST `/admin/salary/calculate` — Trigger salary calculation
```json
Request: { "month": 7, "year": 2025 }
Response: { "success": true, "processed": 25, "total_payout": 425000 }
```
### POST `/admin/salary/:id/pay` — Mark salary as paid

---

## Collector Endpoints

### GET `/collector/me/route`
Today's assigned route and house list.
```json
Response 200:
{
  "route": { "id": "uuid", "route_name": "Zone A - North" },
  "houses": [
    {
      "id": "uuid",
      "sequence": 1,
      "resident_name": "John Doe",
      "address": "12 Main Street",
      "phone": "9876543210",
      "latitude": 10.9601,
      "longitude": 78.0766,
      "status": "pending",
      "qr_code_token": "QR-ABC123"
    }
  ],
  "stats": { "total": 20, "completed": 8, "pending": 12, "not_available": 0 }
}
```

### POST `/collector/duty/start` — Start duty (activates GPS)
### POST `/collector/duty/end` — End duty

### POST `/collector/collections/scan`
Scan QR code to check in at house.
```json
Request: { "qr_code_token": "QR-ABC123", "collection_id": "uuid" }
Response: { "success": true, "house": { ... }, "scan_time": "2025-07-01T09:15:00Z" }
```

### POST `/collector/collections/:id/complete`
Mark collection complete + upload photo.
```json
Request: FormData { photo: File, collection_id: uuid }
Response: { "success": true, "ai_job_id": "uuid", "message": "Image queued for AI analysis" }
```

### POST `/collector/collections/:id/not-available`
Mark household as not available.

### GET `/collector/me/gps/current` — Get current GPS location
### POST `/collector/me/gps/update`
```json
Request: { "latitude": 10.9601, "longitude": 78.0766, "speed_kmph": 25.5 }
```

### GET `/collector/me/stats?month=7&year=2025`
### GET `/collector/me/salary?month=7&year=2025`
### GET `/collector/me/feedback` — View feedback received

---

## Household / Resident Endpoints

### GET `/household/me/status`
Today's collection status for this household.
```json
Response 200:
{
  "status": "pending",
  "collector": {
    "name": "Ravi Kumar",
    "phone": "9876543210",
    "latitude": 10.9595,
    "longitude": 78.0760,
    "distance_meters": 320,
    "eta_minutes": 5
  },
  "last_collected": "2025-06-30"
}
```

### POST `/household/feedback`
```json
Request:
{
  "collector_id": "uuid",
  "collection_id": "uuid",
  "behaviour_rating": "Excellent",
  "comments": "Very punctual and clean."
}
```

### POST `/household/complaints`
```json
Request:
{
  "title": "Garbage not picked for 3 days",
  "description": "...",
  "priority": "High",
  "photo": File (optional)
}
```
### GET `/household/me/complaints` — View my complaints
### GET `/household/me/compliance` — View my compliance history

### GET `/household/collector/location`
Live collector GPS position for tracking on map.

---

## AI Service Endpoints (Internal)

### POST `/ai/classify`
```json
Request: { "image_url": "https://s3.amazonaws.com/...", "collection_id": "uuid" }

Response 200:
{
  "job_id": "uuid",
  "collection_id": "uuid",
  "results": {
    "plastic_pct": 45.2,
    "organic_pct": 30.1,
    "paper_pct": 15.8,
    "metal_pct": 5.0,
    "glass_pct": 3.9,
    "ewaste_pct": 0,
    "mixed_waste": false,
    "confidence": 94.5
  },
  "segregation_passed": true,
  "model_version": "yolov8-v1"
}
```

### GET `/ai/jobs/:id` — Check AI job status

---

## GPS / Live Tracking

### WebSocket `wss://api.smartwaste.in/v1/gps/live`
```json
// Server emits every 5 seconds:
{
  "collector_id": "uuid",
  "collector_name": "Ravi Kumar",
  "latitude": 10.9601,
  "longitude": 78.0766,
  "speed_kmph": 15.2,
  "timestamp": "2025-07-01T09:20:05Z"
}
```

---

## Warehouse Endpoints

### POST `/warehouse/entry`
```json
Request:
{
  "vehicle_id": "uuid",
  "plastic_kg": 120.5,
  "organic_kg": 200.0,
  "paper_kg": 80.0,
  "metal_kg": 30.0,
  "glass_kg": 10.0,
  "ewaste_kg": 5.0,
  "mixed_kg": 20.0
}
```
### GET `/warehouse/summary?from=2025-07-01&to=2025-07-31`

---

## Notifications

### GET `/notifications/me` — Get my notifications
### PUT `/notifications/:id/read` — Mark as read
### PUT `/notifications/read-all` — Mark all as read

---

## HTTP Status Codes Used

| Code | Meaning                  |
|------|--------------------------|
| 200  | OK — Successful GET/PUT  |
| 201  | Created — POST success   |
| 400  | Bad Request              |
| 401  | Unauthorized             |
| 403  | Forbidden (RBAC)         |
| 404  | Not Found                |
| 409  | Conflict (duplicate)     |
| 422  | Validation Error         |
| 500  | Internal Server Error    |

---

## Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number must be 10 digits",
    "field": "phone"
  }
}
```
