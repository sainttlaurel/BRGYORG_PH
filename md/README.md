> **NOTE:** This project has been migrated from Vanilla JS to React + TypeScript + Vite. All code is in `src/`.

# Payatas Ledger — Civic Management System

A barangay management system for Barangay Payatas, Quezon City, Philippines. Provides comprehensive civic administration tools including resident management, document request processing, blotter case handling, community announcements, polls, citizen reporting, and volunteer management.

- **Web app** — React + TypeScript + Vite, deployed to Vercel

---

## Features

### Public Portal (12 pages)

| Page | Purpose |
|------|---------|
| Home | Landing page — hero, stats, quick actions, announcements |
| About | Barangay history, vision, mission |
| Officials | Elected officials directory |
| Services | All barangay services listed |
| Document Application | Submit a document request |
| Registry | Search resident registry |
| Announcements | Community announcements |
| Citizens' Voice | Anonymous suggestions/feedback |
| Community Vote | Active/closed polls — vote |
| Volunteer | Volunteer sign-up form |
| Report Concern | Report an issue/incident with live tracking |
| Contact | Contact form + info |

### Admin Portal (14 pages)

| Page | Purpose |
|------|---------|
| Dashboard | Live activity feed + charts |
| Residents | CRUD + search/filter + bulk operations + CSV import/export |
| Document Requests | Status workflow + certificate preview + print |
| Blotter Records | Case management + status workflows + bulk operations |
| Officials | Elected officials with CRUD |
| Announcements | Publish/hide/delete with priority categories |
| Polls | Create/manage community polls |
| Reports | Charts + period filter + CSV export |
| Concerns | Citizen report status workflows |
| Suggestions | Anonymous feedback with admin reply |
| Volunteers | Signup management + status workflows |
| Contact Messages | Inbox with delete + batch actions |
| Users | Admin account CRUD (admin-only) |
| Audit Logs | System activity trail with CSV export |
| Settings | Barangay profile, certificate templates, fees, danger zone |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.8 |
| UI framework | React 18.3 |
| Bundler | Vite 6 |
| Routing | react-router 7 |
| Data fetching | TanStack Query (React Query) 5 |
| Styling | Tailwind CSS 4 |
| UI primitives | Radix UI (shadcn-style) |
| Animation | motion (framer-motion) |
| Backend | Supabase (PostgreSQL 15) |
| Auth | Custom bcrypt RPCs |
| Forms | react-hook-form + zod |
| Charts | recharts |
| Icons | lucide-react |
| Notifications | sonner |
| Testing | Vitest + Testing Library |
| CI/CD | GitHub Actions → Vercel |

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev              # http://localhost:5173

# TypeScript type check
npm run typecheck

# Lint & format
npm run lint
npm run format

# Build web app
npm run build            # outputs to dist/

# Run tests
npm test
```

---

## Project Structure

```
BRGY/
├── src/                      # React + TypeScript source
│   ├── app/components/       # Public & admin page components + UI primitives
│   ├── lib/                  # Supabase client, hooks (useDebounce, useSort, usePagination), validations
│   ├── styles/               # CSS (Tailwind v4)
│   └── test/                 # Vitest tests
├── scripts/                  # Build/utility scripts
├── sql/                      # Database schema + migrations
├── md/                       # Documentation
├── public/                   # Static assets
└── dist/                     # Web build output
```

---

## Default Users (for testing)

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Super Administrator |

---

## Login and Authentication

- **Credentials:** username/email + password
- **Hash:** bcrypt (done server-side via PostgreSQL `pgcrypto`)
- **Session:** stored in `sessionStorage` as JSON (`pl_session` key)
- **Roles:** `admin`, `captain`, `secretary`, `treasurer`, `staff`
- **Role enforcement:** Client-side via `RoleRoute` + server-side via RLS + SECURITY DEFINER RPCs

---

## Related Documents

- `md/ARCHITECTURE.md` — Full system architecture, data flow, and database schema
- `md/ROADMAP.md` — Feature roadmap and completion status
- `md/CHANGELOG.md` — Version history and release notes
- `sql/supabase-schema.sql` — Master database schema
