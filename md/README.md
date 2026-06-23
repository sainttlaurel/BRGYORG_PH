# Payatas Ledger
## Barangay Civic Management Platform

Payatas Ledger is a digital governance platform for barangay operations. It covers resident records, document processing, complaints, community projects, announcements, business registry, and administrative reporting — all backed by a live Supabase database with real-time sync.

---

## Core Modules

### Resident Management
Centralized resident directory for barangay staff to register and manage profiles, track document and complaint history per resident, search and filter by purok or status, and maintain accurate records.

### Document Requests
Digital processing of barangay-issued certificates.

Supported documents:
- Barangay Clearance
- Certificate of Residency
- Certificate of Indigency
- Barangay Business Clearance
- Certificate of Good Moral Character
- Barangay Permit

Includes online submission, approval and rejection workflows, status tracking, administrative remarks, and official print letterhead with barangay logo.

### Public Verification Portal
Allows residents to verify registration status and check document authenticity. Sensitive personal data is not exposed.

### Complaint Management
Citizen grievance filing with priority levels (High / Medium / Low), status tracking, and resolution history.

### Community Project Management
Track barangay initiatives with progress monitoring, budget, and timelines. Projects are visible on the public portal.

### Announcement Center
Post community updates, public advisories, emergency notices, and events. Live on both admin and public portals.

### Community Hub
- Citizens Voice: Public suggestion board with admin reply workflow
- Community Polls: Live voting with real-time results
- Volunteer Program: Sign-up and status management
- Business Registry: Local business applications with approve/reject workflow

### Reports and Analytics
Generate summaries on resident demographics, document requests by type, complaint resolution rates, and project status — all from live Supabase data.

---

## Administrative Features

### Admin Dashboard
Live statistics on pending requests, active complaints, ongoing projects, and total residents. Recent document requests with one-click approve/reject.

### Authentication and Security
- Username/email login with bcrypt password hashing via PostgreSQL pgcrypto
- Legacy plaintext fallback during migration
- Role-based access: Admin and Staff
- 30-minute session timeout with 5-minute warning banner
- Session data stored in sessionStorage with password stripped before persistence
- XSS protection via escHtml() on all rendered user data

### Real-Time Sync
Supabase Realtime subscriptions on 9 admin tables and 4 public portal channels. All connected staff see live updates without refreshing.

---

## Technology Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Markup     | HTML5 (Semantic, Accessible)        |
| Styling    | CSS3 (Custom Properties, Flex/Grid) |
| Scripting  | Vanilla JavaScript (ES6+)           |
| Backend    | Supabase (PostgreSQL + Realtime)    |
| Icons      | Material Symbols (Outlined)         |
| Fonts      | DM Sans, DM Mono                    |
| Deployment | Vercel (Clean URLs)                 |

---

## Setup

### 1. Supabase Configuration

Credentials are set in `js/supabase-config.js`:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://xyaqigazszqhvvglqint.supabase.co',
  anonKey: 'sb_publishable_ftY2kTePsAkVcK-PrgTgiQ_jG636mXp'
};
```

### 2. Initialize the Database

Run `sql/supabase-schema.sql` in Supabase Dashboard > SQL Editor.

Or via CLI:
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xyaqigazszqhvvglqint.supabase.co:5432/postgres" \
  -f sql/supabase-schema.sql
```

### 3. Supabase CLI (optional)

```bash
supabase login
supabase init
supabase link --project-ref xyaqigazszqhvvglqint
```

### 4. Environment Variables

```bash
cp .env.example .env
# Edit .env with your database password
```

### 5. Deploy to Vercel

```bash
vercel
# or connect your GitHub repo in the Vercel dashboard
```

---

## Default Login Accounts

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | Admin |
| egarcia  | staff123  | Staff |
| rsantos  | staff123  | Staff |

Change all passwords before deploying to production.

---

## Project Structure

```
brgyorg-ph/
├── index.html              # Public Portal (Landing and Verification)
├── admin.html              # Administrative Dashboard
├── vercel.json             # Deployment config for clean URLs
├── .env.example            # Environment variable template
├── css/
│   ├── landing.css         # Public portal styles (mobile responsive)
│   └── styles.css          # Admin portal styles
├── img/                    # Logos, seals, and backgrounds
├── js/
│   ├── supabase-config.js  # Supabase connection and DB helpers
│   ├── landing.js          # Public portal logic and verification
│   └── app.js              # Administrative engine
├── md/
│   ├── README.md           # This file
│   └── CHANGELOG.md        # Version history
└── sql/
    └── supabase-schema.sql # Full database schema and seed data
```

---

## Database Schema

| Table                | Purpose                                    |
|----------------------|--------------------------------------------|
| `users`              | Admin and staff accounts                  |
| `residents`          | Resident directory                        |
| `documents`          | Document and certificate requests         |
| `complaints`         | Citizen complaints and grievances         |
| `projects`           | Community development projects            |
| `announcements`      | Community notices and advisories          |
| `clearance_requests` | Public portal document applications       |
| `document_counters`  | Sequential reference number generation    |
| `suggestions`        | Citizens Voice suggestions and Q&A        |
| `polls`              | Community voting polls                    |
| `volunteer_signups`  | Volunteer program registrations           |
| `business_registry`  | Local business directory                  |
| `suggestion_limits`  | Rate limiting for public submissions      |

---

## Current Version

v3.1.0 — June 2026. See `md/CHANGELOG.md` for full version history.

---

&copy; 2026 Barangay Payatas Digital Division. Powered by Payatas Ledger.
