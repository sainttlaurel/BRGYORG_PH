# Payatas Ledger — Civic Management System

A barangay management system for Barangay Payatas, Quezon City, Philippines. Provides comprehensive civic administration tools including resident management, document request processing, complaint handling, project tracking, and community announcements.

---

## Features

### Core Modules

- Dashboard — Overview of barangay statistics, recent activities, and quick actions.
- Residents — Manage resident directory with CRUD operations and detailed profile drawers.
- Document Requests — Process and track official document certifications (Clearance, Indigency, Residency, etc.) with custom remarks.
- Public Verification — Dual-purpose portal for verifying document authenticity and resident registration status.
- Complaints — Handle and track citizen complaints with priority levels and bulk resolution tools.
- Projects — Manage and display community infrastructure and social projects with progress tracking.
- Announcements — Post and manage community announcements reachable by all residents.
- Reports — Generate operational reports and analytics with date-range filtering.

---

## Technology Stack

- HTML5 and CSS3 — Semantic markup with CSS Grid/Flexbox layouts.
- Vanilla JavaScript — ES6+ logic for real-time state management and DOM manipulation.
- Supabase — Backend-as-a-Service providing PostgreSQL database and real-time subscriptions.
- Material Symbols — Standardized icons for clear visual hierarchy.
- Responsive Web Design — Optimized for mobile browsers (Safari/Chrome) through desktop displays.

---

## Design System

The platform uses a Civic Horizon design language.

### Visual Style

- Glassmorphism — Surfaces use `backdrop-filter: blur(20px)` with semi-transparent backgrounds.
- Dynamic Themes — Light and Dark mode support that persists across sessions.
- Navigation — Desktop uses a fixed slide-out drawer. Mobile uses a responsive overlay menu.
- Typography — `Public Sans` for bold accessible headings, `Inter` for clean body text.

### Design Tokens

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| Primary | `#0d9488` | `#2dd4bf` |
| Background | `#f8fafc` | `#0f172a` |
| Surface | `#ffffff` | `#1e293b` |
| Text Main | `#0f172a` | `#f8fafc` |
| Text Muted | `#64748b` | `#94a3b8` |
| Border | `#e2e8f0` | `#334155` |

### Fonts

- Headings — `DM Sans` (700-900 weight)
- Body — `Inter` (400-600 weight)
- Mono — `DM Mono` (400-500 weight)

---

## Login and Authentication

### Default Users (for testing)

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Super Administrator |

### Authentication Functions

| Function | Description |
|----------|-------------|
| `checkAuth()` | Check if user is logged in on page load |
| `login()` | Authenticate user with username/password |
| `logout()` | Open logout confirmation modal |
| `confirmLogout()` | Confirm logout and clear session |
| `updateAdminUI()` | Show/hide admin-only elements |

---

## Administrative Tools

### Document Detail Panel (Drawer)

Slide-out panel for viewing and processing document requests.

- Status Management — Toggle between Pending, Approved, and Rejected.
- Quick Select Remarks — Predefined templates for common approval/rejection messages.
- History Timeline — Visual tracking of document status changes.

### Resident Profile Panel

Comprehensive view of resident data including their full document request and complaint history.

---

## Project Setup

### 1. Database Configuration

Edit `supabase-config.js`:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key-here'
};
```

### 2. Database Schema

Run `sql/supabase-schema.sql` in your Supabase SQL Editor to initialize all tables, RLS policies, and sample data.

---

## Project Structure

```
brgyorg-ph/
├── index.html              # Public portal (landing and verification)
├── admin.html              # Administrative dashboard
├── README.md               # Project overview (root entry point)
├── .env.example            # Environment variable template
├── vercel.json             # Deployment config for clean URLs
├── css/
│   ├── landing.css         # Public portal styles
│   └── styles.css          # Admin portal styles
├── js/
│   ├── app.js              # Admin portal engine
│   ├── landing.js          # Public portal logic and verification
│   ├── supabase-config.js  # Supabase client and BRGY_CONFIG
│   └── pages/
│       ├── dashboard.js
│       ├── residents.js
│       ├── documents.js
│       ├── complaints.js
│       ├── projects.js
│       ├── announcements.js
│       ├── reports.js
│       ├── users.js
│       └── settings.js
├── sql/
│   └── supabase-schema.sql # Full database schema and migrations
├── img/
│   ├── logo-payatas.png
│   ├── hero.png
│   └── bg.png
└── md/
    ├── README.md           # This file
    ├── DESIGN.md           # System design and architecture
    ├── ROADMAP.md          # Improvement roadmap and migration plan
    └── CHANGELOG.md        # Version history
```

---

## Related Documents

- DESIGN.md — System architecture, data models, and module design.
- ROADMAP.md — Prioritized improvements, React migration plan, and implementation timeline.
- CHANGELOG.md — Full version history and release notes.
