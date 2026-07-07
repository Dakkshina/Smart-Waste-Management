# 🎨 UI/UX Guidelines — Smart Waste Management System

## Design Principles
- **Clarity** — Field workers use the app outdoors; keep UI minimal and glanceable
- **Accessibility** — Support low-end devices, slow networks, and users with low literacy
- **Feedback** — Every action must give clear visual feedback (loading, success, error)
- **Offline-first** — Collector app must work without internet and sync later

---

## Color Palette

| Token               | Hex       | Usage                          |
|---------------------|-----------|--------------------------------|
| `--primary`         | `#2c3e50` | Sidebar, headers, buttons      |
| `--accent`          | `#1abc9c` | Active states, success, CTA    |
| `--danger`          | `#e74c3c` | Errors, alerts, delete         |
| `--warning`         | `#f39c12` | Pending, in-progress           |
| `--success`         | `#27ae60` | Completed, collected           |
| `--bg-light`        | `#f4f6f9` | Page backgrounds               |
| `--card-bg`         | `#ffffff` | Cards, panels                  |
| `--text-dark`       | `#333333` | Primary text                   |
| `--text-muted`      | `#7f8c8d` | Secondary / helper text        |

---

## Typography

| Use           | Font          | Size   | Weight |
|---------------|---------------|--------|--------|
| Headings (H1) | Segoe UI      | 28px   | 700    |
| Headings (H2) | Segoe UI      | 22px   | 600    |
| Body          | Arial / Segoe | 16px   | 400    |
| Small / Meta  | Arial         | 13px   | 400    |
| Button Label  | Arial         | 14px   | 600    |

---

## Component Standards

### Buttons
```
Primary   → bg:#2c3e50  text:white  border-radius:6px  padding:10px 20px
Secondary → bg:white    text:#2c3e50 border:1px solid #2c3e50
Danger    → bg:#e74c3c  text:white
Disabled  → bg:#aaa     cursor:not-allowed
```

### Status Badges
```
collected     → green  background
pending       → yellow background
not_available → red    background
in_progress   → blue   background
```

### Cards
```
border-radius : 12px
box-shadow    : 0 4px 12px rgba(0,0,0,0.08)
padding       : 20px
background    : #ffffff
```

---

## Page-by-Page Layout

### Landing / Login Page (`IV_Mainpage.html`)
- Role selector (Admin / Collector / Household)
- Login form → redirect to role-specific dashboard
- Clean, single-column layout on mobile

### Admin Dashboard (`IV_Admin.html`)
```
┌──────────────┬────────────────────────────────────┐
│              │  Page Title / Breadcrumb            │
│   Sidebar    ├────────────────────────────────────┤
│   (220px)    │                                    │
│              │        Main Content Area            │
│  ● Collectors│        (scrollable)                │
│  ● Reports   │                                    │
│  ● Vehicles  │                                    │
│  ● Tracking  │                                    │
│              │                                    │
└──────────────┴────────────────────────────────────┘
```

### Collector App (`IV_Collector.html`)
```
┌────────────────────────────────────┐
│  Collector Dashboard               │
├────────────────────────────────────┤
│  Stats Bar: Total | Done | Pending │
│  Progress Bar                      │
├────────────────────────────────────┤
│  [Show Households Button]          │
├────────────────────────────────────┤
│  House Card:                       │
│   House Name | Address | Phone     │
│   [Upload Photo] [Complete] [NA]   │
│   [Call] [Report]                  │
│   Feedback Form (auto-show)        │
├────────────────────────────────────┤
│  Live Map (Leaflet)                │
└────────────────────────────────────┘
```

### Household App (`IV_HouseHolds.html`)
```
┌──────────┬────────────────────────────┐
│          │  Section Content           │
│ Sidebar  │                            │
│          │  Map / Feedback / Report / │
│ Map      │  Scan / Emergency /        │
│ Feedback │  Garbage Status            │
│ Report   │                            │
│ Scan     │                            │
│ Emergency│                            │
│ Garbage  │                            │
└──────────┴────────────────────────────┘
```

---

## Mobile Responsiveness Rules

```css
/* Breakpoint: 768px and below → stack sidebar + content vertically */
@media (max-width: 768px) {
  .container    { flex-direction: column; }
  .sidebar      { width: 100%; height: auto; }
  .sidebar ul   { display: flex; flex-wrap: wrap; }
  .sidebar ul li { flex: 1; text-align: center; padding: 10px; }
}
```

---

## Map Standards (Leaflet.js)

- Default center: Based on ward/zone assigned
- Default zoom: 14 (neighbourhood level)
- Collector marker: truck icon (blue)
- Completed house: green checkmark icon
- Pending house: default red pin
- Not available: orange pin

---

## Form Validation UX

| Rule                    | Display               |
|-------------------------|-----------------------|
| Required field empty    | Red border + message  |
| Phone not 10 digits     | Inline error below    |
| File upload required    | Disable button + hint |
| Max word limit          | Live counter + trim   |

---

## Accessibility Checklist

- [ ] All buttons have `aria-label`
- [ ] Images have `alt` text
- [ ] Form labels linked to inputs via `for`/`id`
- [ ] Color is not the only indicator (icons + text)
- [ ] Minimum touch target 44×44px on mobile
- [ ] Offline mode shows clear "No internet" banner
