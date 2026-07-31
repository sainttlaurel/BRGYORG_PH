# Payatas Ledger — Architecture & Structure

## Overview

**Payatas Ledger** is a barangay civic management platform. It has two faces — a **public portal** for residents and an **admin portal** for barangay staff. Both run in the browser (SPA).

- **Frontend:** React 18 + TypeScript + Vite 6
- **Backend:** Supabase (PostgreSQL 15) accessed directly from the client
- **Deployment:** Vercel (spa-rewrites to index.html)
- **Auth:** Custom bcrypt-authenticated RPCs (not Supabase Auth)

---

## Directory Structure

```
BRGY/
├── index.html                  # SPA entry — minimal meta, loads main.tsx
├── vite.config.ts              # Build config (React, Tailwind v4, Sentry plugin)
├── vitest.config.ts            # Test runner config
├── tsconfig.json               # TypeScript config (@/ → src/)
├── eslint.config.js            # ESLint flat config
├── vercel.json                 # Vercel SPA rewrites: all paths → index.html
├── postcss.config.mjs          # (removed — Tailwind v4 uses Vite plugin)
├── package.json
│
├── public/
│   ├── robots.txt              # Allows all crawlers, points to sitemap
│   ├── sitemap.xml             # 8 static URLs
│   └── img/                    # bg.png, hero.png, logo-payatas.png
│
├── src/
│   ├── main.tsx                # App entry — Sentry init, renders <App>
│   │
│   ├── app/
│   │   ├── App.tsx             # Router + providers (QueryClient, Helmet,
│   │   │                       #   Theme, ErrorBoundary, Auth, Data)
│   │   │
│   │   ├── components/
│   │   │   ├── PublicLayout.tsx    # Shell for public pages (nav, footer)
│   │   │   ├── AdminLayout.tsx     # Shell for admin pages (sidebar, header)
│   │   │   ├── AuthContext.tsx     # Auth state, login/logout, mock fallback
│   │   │   ├── DataContext.tsx     # Passes useSupabaseData() to all children
│   │   │   ├── ThemeProvider.tsx   # Light/dark toggle, persists to localStorage
│   │   │   ├── ErrorBoundary.tsx   # React error boundary → Sentry
│   │   │   ├── SeoHead.tsx         # Per-page SEO: title, meta, OG, JSON-LD
│   │   │   │
│   │   │   ├── Public*.tsx         # 12 public page components
│   │   │   ├── Admin*.tsx          # 14 admin page components
│   │   │   ├── HeroLandscape.tsx
│   │   │   ├── figma/              # Design assets
│   │   │   └── ui/                 # shadcn-style primitives + custom components
│   │   │       ├── confirm-dialog.tsx   # Styled modal dialog (danger variant)
│   │   │       ├── table-state.tsx      # TableLoading (skeleton rows) + TableEmpty
│   │   │       └── ...                 # 49 other UI primitives
│   │   │
│   ├── lib/
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts       # 300ms debounce hook
│   │   │   ├── useSort.ts           # Column sorting (asc/desc toggle)
│   │   │   └── usePagination.ts     # Pagination with page size selector
│   │   ├── supabase.ts             # Supabase client + RPC wrappers + CRUD
│   │   ├── supabaseWrite.ts        # All write operations (inserts, updates)
│   │   ├── useSupabaseData.ts      # Central data hook — fetches all tables
│   │   ├── queryClient.ts          # TanStack Query client config
│   │   ├── errorHandler.ts         # Categorised error handling → Sentry
│   │   ├── designTokens.ts         # Design system tokens
│   │   └── validations.ts          # Zod schemas (announcement, poll, document, resident, official, blotter, user, contact)
│   │
│   ├── styles/
│   │   ├── index.css               # @import "tailwindcss"
│   │   ├── globals.css             # (empty — Tailwind v4)
│   │   ├── tailwind.css
│   │   ├── theme.css
│   │   └── fonts.css
│   │
│   └── test/                       # Vitest test files
│
├── sql/
│   ├── supabase-schema.sql         # Master schema (all tables + RLS + RPCs)
│   ├── migrate-admin.sql
│   ├── migrate-contact.sql
│   ├── migrate-features.sql
│   ├── migrate-reports.sql
│   ├── migrate-rls-fix.sql
│   ├── migrate-rls-update.sql
│   ├── migrate-schema-fixes.sql
│   ├── migrate-security.sql
│   └── migrate-storage.sql
│
├── supabase/.temp/                 # Supabase local dev artifacts
│
├── scripts/
│
├── md/
│   ├── README.md
│   ├── CHANGELOG.md
│   ├── ROADMAP.md
│   └── ARCHITECTURE.md            # This file
│
└── .env / .env.example            # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
                                    #   VITE_SENTRY_DSN, APP_ENV, APP_URL
```

---

## Routes

### Public (wrapped in `PublicLayout`)

| Path | Component | Description |
|---|---|---|
| `/` | `PublicHome` | Landing page — hero, stats, quick actions, announcements |
| `/about` | `PublicAbout` | Barangay history, vision, mission |
| `/officials` | `PublicOfficials` | Elected officials directory |
| `/services` | `PublicServices` | All barangay services listed |
| `/document-application` | `PublicDocumentApplication` | Submit a document request |
| `/registry` | `PublicRegistry` | Search resident registry |
| `/announcements` | `PublicAnnouncements` | Community announcements |
| `/citizens-voice` | `PublicCitizensVoice` | Anonymous suggestions/feedback |
| `/community-vote` | `PublicCommunityVote` | Active/closed polls — vote |
| `/volunteer` | `PublicVolunteer` | Volunteer sign-up form |
| `/report-concern` | `PublicReportConcern` | Report an issue/incident |
| `/contact` | `PublicContact` | Contact form + info |

### Admin (wrapped in `AdminLayout`, behind `ProtectedRoute` + `RoleRoute`)

| Path | Component | Roles |
|---|---|---|
| `/admin/login` | `AdminLogin` | — |
| `/admin/dashboard` | `AdminDashboard` | all |
| `/admin/residents` | `AdminResidents` | admin, captain, staff |
| `/admin/requests` | `AdminRequests` | all |
| `/admin/blotter` | `AdminBlotter` | all |
| `/admin/officials` | `AdminOfficials` | admin, captain, secretary |
| `/admin/announcements` | `AdminAnnouncements` | all |
| `/admin/polls` | `AdminPolls` | admin, captain, secretary |
| `/admin/reports` | `AdminReports` | all |
| `/admin/concerns` | `AdminConcerns` | admin, captain, secretary, staff |
| `/admin/suggestions` | `AdminSuggestions` | admin, captain, secretary |
| `/admin/contact-messages` | `AdminContactMessages` | admin, captain, secretary |
| `/admin/volunteers` | `AdminVolunteers` | admin, captain, secretary |
| `/admin/users` | `AdminUsers` | admin |
| `/admin/audit-logs` | `AdminAuditLogs` | admin, captain |
| `/admin/settings` | `AdminSettings` | admin |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                                                              │
│  main.tsx → Sentry.init() → <App />                          │
│                                                              │
│  <App>                                                        │
│   ├── <HelmetProvider>        ← react-helmet-async           │
│   ├── <QueryClientProvider>   ← TanStack Query               │
│   ├── <ThemeProvider>         ← light/dark toggle            │
│   ├── <ErrorBoundary>         ← catches render errors        │
│   ├── <AuthProvider>          ← user state, login()          │
│   ├── <DataProvider>          ← fetches all Supabase tables  │
│   └── <Routes>                ← react-router routing         │
│        ├── public routes (PublicLayout > Outlet > pages)     │
│        └── admin routes (ProtectedRoute > AdminLayout > …)   │
│                                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL 15)                                     │
│                                                              │
│  Tables: users, residents, documents, complaints,            │
│          announcements, polls, officials, barangay_info,     │
│          services, suggestions, volunteer_signups, reports,  │
│          contact_messages, business_registry, audit_logs,    │
│          settings, service_fees, admin_sessions,             │
│          poll_votes, rate_limits, login_attempts             │
│                                                              │
│  Views: v_resident_public, v_pending_documents,              │
│         v_complaint_summary, v_residents_per_purok           │
│                                                              │
│  All RPCs are SECURITY DEFINER (runs as table owner):         │
│    Auth: authenticate_user, validate_session, end_session,   │
│          require_session, check_login_rate_limit             │
│    Admin write:  admin_update_document_status,               │
│       admin_update_blotter_status, admin_update_resident,    │
│       admin_delete_resident, admin_insert_announcement,      │
│       admin_update_announcement, admin_delete_announcement,  │
│       admin_insert_blotter, admin_upsert_setting,            │
│       admin_update_poll, admin_insert_poll, admin_delete_poll│
│       admin_reply_suggestion, admin_update_suggestion_status,│
│       admin_insert_official, admin_update_official,          │
│       admin_delete_official, admin_update_volunteer_status,  │
│       admin_update_report_status, admin_update_contact_status│
│       admin_update_barangay_info, admin_update_service_fee,  │
│       admin_clear_documents, admin_clear_residents,          │
│       admin_delete_contact_message,                          │
│       admin_update_contact_message_status                    │
│    Admin read (paginated, session-gated):                    │
│       admin_get_residents, admin_get_residents_count,        │
│       admin_get_documents, admin_get_documents_count,        │
│       admin_get_complaints, admin_get_complaints_count       │
│    User mgmt: get_users, create_user, update_user,           │
│       delete_user, set_user_status, hash_password,           │
│       update_user_password                                   │
│    Public: search_residents, cast_vote, get_poll_results,    │
│            record_suggestion, rate_limited_insert            │
│    ID gen: get_next_entity_id, get_next_clearance_number     │
│    Housekeeping: clean_expired_sessions                       │
│                                                              │
│  RLS: All tables have Row-Level Security. Anon write         │
│       policies are dropped — admin writes go through         │
│       SECURITY DEFINER RPCs. Internal tables (users,         │
│       admin_sessions, document_counters, suggestion_limits,  │
│       rate_limits, login_attempts) are default-deny.          │
└─────────────────────────────────────────────────────────────┘
```

### Client → Supabase

All data flows directly from the browser to Supabase:

1. **Auth:** `AuthContext.login()` calls the `authenticate_user` RPC. If Supabase is unreachable (offline), a fallback list of mock users is used. Session is persisted in `sessionStorage`.

2. **Data fetching:** `useSupabaseData()` in `src/lib/useSupabaseData.ts` runs on mount and subscribes to real-time changes on all tables. It fetches 13 tables in parallel via `Promise.allSettled` and maps raw DB rows to typed interfaces (`DocRequest`, `Resident`, `BlotterCase`, etc.). The result (`AppData`) is provided to every component via `DataContext`.

3. **Writes:** `src/lib/supabaseWrite.ts` contains all mutation functions (`updateDocumentStatus`, `insertBlotterCase`, etc.). Each writes directly to a Supabase table and inserts an audit log entry.

4. **Settings:** The `settings` table stores key-value pairs for certificate templates, notification prefs, security settings, etc. `AdminRequests.tsx` fetches these on mount and uses them when rendering the certificate preview and print output (replacing previously hardcoded values).

---

## Authentication

- **Credentials:** username/email + password
- **Hash:** bcrypt (done server-side via `pgcrypto` in the `authenticate_user` RPC)
- **Session:** stored in `sessionStorage` as JSON (`pl_session` key)
- **Roles:** `admin`, `captain`, `secretary`, `treasurer`, `staff`
- **Role enforcement:** `RoleRoute` in `App.tsx` checks `getVisiblePaths(user.role)` from `AdminLayout.tsx` — this is a **client-side** gate only. True authorization depends on RLS and SECURITY DEFINER RPCs at the database level.

---

## Key Features

### Document Request Workflow
```
pending → approved → processing → ready → released
                                     ↘ rejected
```

Each status transition is logged to `audit_logs`. At "released", a "Print Certificate" button appears that generates a styled HTML document using the admin-configured certificate template (header, footer, officer title from `settings` table).

### Certificate Templates
Admins can configure 6 certificate types via `AdminSettings` → "Certificate Templates" tab:
- Header text (default: "Republic of the Philippines")
- Footer text (default: "Not valid without seal")
- Signing officer title (default: "Barangay Captain")

These are stored in the `settings` table with keys like `template_{name_slug}_header`, etc.

### SEO
- **Static:** `robots.txt`, `sitemap.xml`, base OG tags in `index.html`
- **Per-page:** `SeoHead` component (backed by `react-helmet-async`) injects `<title>`, `<meta>`, Open Graph, Twitter Card, and JSON-LD structured data on every public page
- **JSON-LD:** A `GovernmentOrganization` schema is included on every page

### Error Monitoring (Sentry)
- Initialised in `main.tsx` (only when `VITE_SENTRY_DSN` is set)
- Captures unhandled render errors via `ErrorBoundary.componentDidCatch`
- Captures classified application errors via `errorHandler.ts`
- `@sentry/vite-plugin` is configured for source map upload (runs only when `SENTRY_AUTH_TOKEN` is present)

---

## Styling

- **Framework:** Tailwind CSS v4 (configured via `@tailwindcss/vite` Vite plugin)
- **Components:** ~49 shadcn-style UI primitives in `src/app/components/ui/`
- **Dark mode:** `<ThemeProvider>` adds/removes the `dark` class on `<html>`, persisted in localStorage
- **Animations:** `motion` (framer-motion API) for page transitions, modals, dropdowns

---

## Testing

- **Framework:** Vitest
- **Config:** `vitest.config.ts`
- **Setup:** jsdom environment, `@testing-library/react` + `@testing-library/user-event` + `@testing-library/jest-dom`
- **Run:** `npm test` or `npm run test:watch`

---

## Build & Deploy

- `npm run build` → Vite outputs to `dist/`
- `npm run dev` → Vite dev server with HMR
- `npm run typecheck` → TypeScript type checking (`tsc --noEmit`)
- `npm run lint` → ESLint on `src/`
- `npm run format` / `format:check` → Prettier
- **CI:** `.github/workflows/deploy.yml` builds on push to `main`
- **Deploy target:** Vercel (with `vercel.json` SPA rewrites)

---

## Database Tables

| Table | Purpose | Anon Access |
|---|---|---|
| `users` | Admin/staff accounts | ❌ default-deny (via RPCs only) |
| `residents` | Resident registry | ✅ SELECT, admin write |
| `documents` | Document requests | ✅ SELECT, admin write |
| `complaints` | Blotter cases | ✅ SELECT, admin write |
| `announcements` | Community announcements | ✅ SELECT, admin write |
| `projects` | Community projects | ✅ SELECT, admin write |
| `polls` | Community voting | ✅ SELECT, UPDATE votes |
| `suggestions` | Anonymous feedback | ✅ INSERT, admin write |
| `volunteer_signups` | Volunteer registrations | ✅ INSERT, admin write |
| `business_registry` | Business listings | ✅ INSERT, admin write |
| `reports` | Citizen concerns | ✅ INSERT, admin write |
| `contact_messages` | Contact form submissions | ✅ INSERT |
| `officials` | Barangay officials | ✅ SELECT, admin write |
| `barangay_info` | Barangay profile | ✅ SELECT, admin write |
| `services` | Service catalog | ✅ SELECT, admin write |
| `audit_logs` | Admin activity log | admin write via RPC |
| `settings` | Key-value config store | admin read/write |
| `service_fees` | Fee amounts per service | admin read/write |
| `admin_sessions` | Session tokens (8hr expiry) | ❌ default-deny (via RPCs only) |
| `poll_votes` | Poll vote records (one per IP per poll) | ❌ default-deny (via RPCs only) |
| `rate_limits` | Per-form-type rate limiting | ❌ default-deny (via RPCs only) |
| `login_attempts` | Brute-force protection (5/15min) | ❌ default-deny (via RPCs only) |
| `document_counters` | ID generation counters | ❌ default-deny (via RPCs only) |
| `suggestion_limits` | Rate-limiting | ❌ default-deny (via RPCs only) |

---

## SQL Functions (All SECURITY DEFINER)

### Auth & Session Management
| Function | Params | Returns |
|---|---|---|
| `authenticate_user` | `p_login TEXT, p_password TEXT, p_ip_hash TEXT DEFAULT ''` | JSON — login with rate limit + token |
| `validate_session` | `p_token TEXT` | JSON — `{valid, user_id, role, expires_at}` |
| `end_session` | `p_token TEXT` | JSON — deletes token |
| `require_session` | `p_token TEXT` | JSON — helper, raises if invalid |
| `check_login_rate_limit` | `p_ip_hash TEXT` | JSON — max 5 attempts per 15min |
| `hash_password` | `p_plain TEXT` | TEXT — bcrypt hash |
| `update_user_password` | `p_user_id INT, p_current TEXT, p_new TEXT` | JSON |

### User Management (Admin)
| Function | Params | Returns |
|---|---|---|
| `get_users` | — | JSON — all users (password stripped) |
| `create_user` | `p_id, p_name, p_username, p_email, p_password, p_role, p_initials` | JSON |
| `update_user` | `p_id, p_name, p_username, p_email, p_role, p_initials` | JSON |
| `set_user_status` | `p_id INT, p_status TEXT` | JSON |
| `delete_user` | `p_id INT` | JSON |

### Admin Write Operations (session-gated)
| Function | Params | Returns |
|---|---|---|
| `admin_update_document_status` | `p_token, p_id, p_status, p_logged_in_user` | JSON + audit log |
| `admin_update_blotter_status` | `p_token, p_id, p_status, p_logged_in_user` | JSON + audit log |
| `admin_update_resident` | `p_token, p_id, p_data JSONB` | JSON |
| `admin_delete_resident` | `p_token, p_id, p_logged_in_user` | JSON + audit log |
| `admin_insert_announcement` | `p_token, p_id, p_title, p_category, p_content, p_date, p_priority, p_logged_in_user` | JSON + audit log |
| `admin_update_announcement` | `p_token, p_id, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_delete_announcement` | `p_token, p_id, p_logged_in_user` | JSON + audit log |
| `admin_insert_blotter` | `p_token, p_id, p_complainant, p_respondent, p_incident, p_date, p_time, p_location, p_summary, p_handler, p_logged_in_user` | JSON + audit log |
| `admin_upsert_setting` | `p_token, p_key, p_value` | JSON |
| `admin_update_poll` | `p_token, p_id, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_insert_poll` | `p_token, p_question, p_options TEXT[], p_expires_at TIMESTAMPTZ, p_logged_in_user` | JSON + audit log |
| `admin_delete_poll` | `p_token, p_id, p_logged_in_user` | JSON + audit log |
| `admin_reply_suggestion` | `p_token, p_id, p_admin_reply, p_logged_in_user` | JSON + audit log |
| `admin_update_suggestion_status` | `p_token, p_id, p_status, p_logged_in_user` | JSON + audit log |
| `admin_insert_official` | `p_token, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_update_official` | `p_token, p_id INT, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_delete_official` | `p_token, p_id INT, p_logged_in_user` | JSON + audit log |
| `admin_update_volunteer_status` | `p_token, p_id, p_status, p_logged_in_user` | JSON + audit log |
| `admin_update_report_status` | `p_token, p_id, p_status, p_logged_in_user` | JSON + audit log |
| `admin_update_contact_status` | `p_token, p_id, p_status, p_logged_in_user` | JSON + audit log |
| `admin_update_barangay_info` | `p_token, p_data JSONB` | JSON |
| `admin_update_service_fee` | `p_token, p_id INT, p_fee INT` | JSON |
| `admin_clear_documents` | `p_token` | JSON — deletes all documents |
| `admin_clear_residents` | `p_token` | JSON — deletes all residents |
| `admin_delete_contact_message` | `p_token, p_id, p_logged_in_user` | JSON + audit log |
| `admin_update_contact_message_status` | `p_token, p_id, p_status, p_logged_in_user` | JSON + audit log |

### Admin Read Operations (paginated, session-gated)
| Function | Params | Returns |
|---|---|---|
| `admin_get_residents` | `p_token, p_limit DEFAULT 100, p_offset DEFAULT 0` | JSON array (full columns) |
| `admin_get_residents_count` | `p_token` | JSON `{count}` |
| `admin_get_documents` | `p_token, p_limit DEFAULT 100, p_offset DEFAULT 0` | JSON array (full columns) |
| `admin_get_documents_count` | `p_token` | JSON `{count}` |
| `admin_get_complaints` | `p_token, p_limit DEFAULT 100, p_offset DEFAULT 0` | JSON array (full columns) |
| `admin_get_complaints_count` | `p_token` | JSON `{count}` |

### Public / Voting
| Function | Params | Returns |
|---|---|---|
| `search_residents` | `p_query TEXT, p_limit DEFAULT 20, p_offset DEFAULT 0` | JSON — safe columns only (no PII) |
| `cast_vote` | `p_poll_id TEXT, p_voter_ip TEXT, p_option_index INT` | JSON — one vote per IP per poll |
| `get_poll_results` | `p_poll_id TEXT` | JSON array of `{option_index, count}` |

### Rate-Limited Form Submission
| Function | Params | Returns |
|---|---|---|
| `record_suggestion` | `p_identifier, p_name, p_content` | JSON — max 2 (anon) / 5 (verified) |
| `rate_limited_insert` | `p_identifier, p_form_type, p_table, p_data JSONB` | JSON — dynamic insert + rate check |

### ID Generation
| Function | Params | Returns |
|---|---|---|
| `get_next_entity_id` | `p_table TEXT, p_prefix TEXT` | TEXT — auto-incrementing ID (e.g. `PAY-000001`) |
| `get_next_clearance_number` | `p_year INT` | INT — sequential per year |

### Housekeeping
| Function | Params | Returns |
|---|---|---|
| `clean_expired_sessions` | — | INT — number of expired sessions deleted |

### Views
| View | Source | Purpose |
|---|---|---|
| `v_resident_public` | residents | Safe columns only (id, full_name, purok, gender, occupation, civil_status) |
| `v_pending_documents` | documents | Count per document type where status = 'Pending' |
| `v_complaint_summary` | complaints | Total, pending, resolved per category |
| `v_residents_per_purok` | residents | Total and active counts per purok |

---

## Tech Stack Summary

| Layer | Technology |
|---|---|---|
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
| Calendar | date-fns + react-day-picker |
| SEO | react-helmet-async |
| Error monitoring | Sentry (optional) |
| Icons | lucide-react |
| Notifications | sonner |
| Theme | next-themes clone (custom) |
| Testing | Vitest + Testing Library |
| CI/CD | GitHub Actions → Vercel |
| Image processing | sharp (icon generation) |
