# Payatas Ledger — Architecture & Structure

## Overview

**Payatas Ledger** is a barangay civic management platform. It has two faces — a **public portal** for residents and an **admin portal** for barangay staff. Both run in the browser (SPA). The desktop GUI (Tauri) was fully removed in Aug 2026 — the web app is the only client.

- **Frontend:** React 18 + TypeScript + Vite 6
- **Backend:** Supabase (PostgreSQL 15) accessed directly from the client
- **Deployment:** Vercel (SPA rewrites + prerendered public pages)
- **Auth:** Custom bcrypt-authenticated RPCs (not Supabase Auth)

---

## Directory Structure

```
BRGY/
├── index.html                  # SPA entry — minimal meta, loads main.tsx
├── vite.config.ts              # Build config (React, Tailwind v4, Sentry plugin,
│                               #   manualChunks, prerender plugin)
├── vitest.config.ts            # Test runner config
├── tsconfig.json               # TypeScript config (@/ → src/)
├── eslint.config.js            # ESLint flat config
├── vercel.json                 # Vercel rewrites: all paths → index.html
├── package.json
│
├── public/
│   ├── robots.txt              # Allows all crawlers, points to sitemap
│   ├── sitemap.xml             # Static URLs
│   └── img/                    # bg.png, hero.png, logo-payatas.png
│
├── src/
│   ├── main.tsx                # App entry — Sentry init (if DSN set), renders <App>
│   │
│   ├── app/
│   │   ├── App.tsx             # Router + providers (QueryClient, Helmet,
│   │   │                       #   Theme, ErrorBoundary, Auth, Data)
│   │   │
│   │   ├── components/
│   │   │   ├── PublicLayout.tsx    # Shell for public pages (nav, footer)
│   │   │   ├── AdminLayout.tsx     # Shell for admin pages (sidebar, header,
│   │   │   │                       #   refetches data on logout)
│   │   │   ├── AuthContext.tsx     # Auth state, login/logout via RPC
│   │   │   ├── DataContext.tsx     # Passes useSupabaseData() to all children
│   │   │   ├── ThemeProvider.tsx   # Light/dark toggle, persists to localStorage
│   │   │   ├── ErrorBoundary.tsx   # React error boundary → Sentry
│   │   │   ├── SeoHead.tsx         # Per-page SEO: title, meta, OG, JSON-LD
│   │   │   │
│   │   │   ├── Public*.tsx         # 15 public page components
│   │   │   ├── Admin*.tsx          # 18 admin page components (incl. Login/Layout)
│   │   │   ├── __tests__/          # Vitest component tests
│   │   │   └── ui/                 # shadcn-style primitives + custom components
│   │   │       ├── confirm-dialog.tsx   # Styled modal dialog (danger variant)
│   │   │       ├── column-toggle.tsx    # Column visibility dropdown
│   │   │       ├── file-preview.tsx     # Uploaded image/PDF preview
│   │   │       ├── dialog.tsx           # Radix dialog wrapper
│   │   │       ├── table-state.tsx      # TableLoading (skeleton rows) + TableEmpty
│   │   │       └── utils.ts
│   │   │
│   │   ├── styles/              # fonts.css, index.css, tailwind.css, theme.css
│   │   │
│   ├── lib/
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts       # 300ms debounce hook
│   │   │   ├── useSort.ts           # Column sorting (asc/desc toggle)
│   │   │   ├── usePagination.ts     # Pagination with page size selector
│   │   │   └── useColumnVisibility.ts # Per-table column visibility toggles
│   │   ├── supabase.ts             # Supabase client + all RPC wrappers
│   │   ├── supabaseWrite.ts        # All write operations (session-gated RPCs)
│   │   ├── useSupabaseData.ts      # Central data hook — token-aware fetches
│   │   ├── queryClient.ts          # TanStack Query client config
│   │   └── validations.ts          # Zod schemas (announcement, poll, document,
│   │                               #   resident, official, blotter, user, contact)
│   │
│   ├── test/
│   │   └── setup.ts               # Vitest setup (jsdom, jest-dom)
│
├── supabase/
│   └── migrations/                # Applied manually in Supabase SQL Editor
│       ├── 20260728_0000_base_schema.sql
│       ├── 20260728_0001_admin_sessions.sql
│       ├── 20260728_0002_lockdown_audit.sql
│       ├── 20260728_0003_audit_tables.sql
│       ├── 20260731_0004_audit_gaps.sql
│       ├── 20260731_0005_documents_id_upload.sql
│       └── 20260731_0006_admin_read_rpcs.sql
│
├── scripts/
│   └── prerender.mjs              # Puppeteer prerender of public routes
│
├── md/
│   ├── README.md
│   ├── CHANGELOG.md
│   ├── ROADMAP.md
│   └── ARCHITECTURE.md            # This file
│
└── .env / .env.example            # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
                                    #   VITE_SENTRY_DSN, SENTRY_AUTH_TOKEN,
                                    #   SENTRY_ORG, SENTRY_PROJECT, APP_ENV, APP_URL
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
| `/registry` | `PublicRegistry` | Search resident registry + track document requests |
| `/business-registry` | `PublicBusinessRegistry` | Register a business |
| `/projects` | `PublicProjects` | Barangay project card grid |
| `/clearance-request` | `PublicClearanceRequest` | Apply for a clearance + status checker |
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
| `/admin/business-registry` | `AdminBusinessRegistry` | admin, captain, secretary, treasurer |
| `/admin/projects` | `AdminProjects` | admin, captain, treasurer |
| `/admin/clearance-requests` | `AdminClearanceRequests` | admin, captain, secretary |
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
```
Browser
  main.tsx → Sentry.init() → <App>
    <HelmetProvider> / <QueryClientProvider> / <ThemeProvider>
    <ErrorBoundary> / <AuthProvider> / <DataProvider>
    <Routes>: public (PublicLayout) | admin (ProtectedRoute > AdminLayout)

Supabase (PostgreSQL 15)
  Tables: users, residents, documents, complaints, clearance_requests,
          announcements, polls, officials, barangay_info, services,
          suggestions, volunteer_signups, reports, contact_messages,
          business_registry, projects, audit_logs, settings,
          service_fees, admin_sessions, poll_votes, rate_limits,
          login_attempts, document_counters, suggestion_limits

  Views: v_resident_public, v_pending_documents,
         v_complaint_summary, v_residents_per_purok

  All RPCs are SECURITY DEFINER (runs as table owner):
    Auth: authenticate_user, validate_session, end_session,
          require_session, require_admin, check_login_rate_limit,
          current_client_ip
    Admin read (session-gated):
      admin_get_residents(_count), admin_get_documents(_count),
      admin_get_complaints(_count), admin_get_clearance_requests,
      admin_get_business_registry, admin_get_officials,
      admin_get_settings, admin_get_barangay_info,
      admin_get_contact_messages(_count), admin_get_reports(_count)
    Admin write (session-gated, audit-logged):
      admin_update_document_status, admin_update_blotter_status,
      admin_update_resident, admin_insert_resident,
      admin_delete_resident, admin_insert_document,
      admin_insert_announcement, admin_update_announcement,
      admin_delete_announcement, admin_insert_blotter,
      admin_upsert_setting, admin_update_poll, admin_insert_poll,
      admin_delete_poll, admin_reply_suggestion,
      admin_update_suggestion_status, admin_insert_official,
      admin_update_official, admin_delete_official,
      admin_update_volunteer_status, admin_update_report_status,
      admin_update_contact_status, admin_update_barangay_info,
      admin_update_service_fee, admin_clear_documents,
      admin_clear_residents, admin_delete_contact_message,
      admin_update_contact_message_status, admin_insert_business,
      admin_update_business, admin_delete_business,
      admin_insert_project, admin_update_project,
      admin_delete_project, admin_update_clearance_request
    User mgmt (require_admin): get_users, create_user,
      update_user, set_user_status, delete_user,
      hash_password, update_user_password
    Public: search_residents, get_document_status,
      check_clearance_status, cast_vote, get_poll_results,
      record_suggestion, rate_limited_insert
    ID gen: get_next_entity_id, get_next_clearance_number
    Housekeeping: clean_expired_sessions

  RLS: All tables have Row-Level Security. Anon SELECT on
       residents/documents/complaints/clearance_requests is
       dropped — admin reads go through session-gated RPCs,
       public reads through safe RPCs (search_residents,
       get_document_status, check_clearance_status). Internal
       tables (users, admin_sessions, document_counters,
       suggestion_limits, rate_limits, login_attempts) are
       default-deny.
```

### Client → Supabase

All data flows directly from the browser to Supabase:

1. **Auth:** `AuthContext.login()` calls the `authenticate_user` RPC (bcrypt, server-side). The returned token is stored in `sessionStorage` (`pl_session`) and in the module-level session token (`supabase.ts` → `setSessionToken`). Refresh restores the user from `pl_session`.

2. **Data fetching:** `useSupabaseData()` in `src/lib/useSupabaseData.ts` is **token-aware**. On every load it reads `getSessionToken()`: if a session token is present, locked tables (residents, documents, complaints, clearance_requests, business_registry) are fetched via the session-gated `admin_get_*` RPCs; otherwise they fall back to the public-safe sources. Public tables (announcements, officials, etc.) always fetch directly. Login and logout trigger `refetch()` so admin pages populate immediately.

3. **Writes:** `src/lib/supabaseWrite.ts` contains all mutation functions. Each goes through a SECURITY DEFINER RPC with the session token (`p_token`) and the logged-in user for audit attribution; the server INSERTs into `audit_logs` on every mutation.

4. **Public submissions:** document/clearance/business submissions route through `rate_limited_insert` (3 submits per identifier, 10 if verified), which also audits them as `Public`.

5. **Settings:** the `settings` table stores key-value pairs for certificate templates, notification prefs, security settings, etc. `AdminRequests.tsx` fetches these on mount and uses them when rendering the certificate preview and print output.

---

## Authentication

- **Credentials:** username/email + password
- **Hash:** bcrypt (done server-side via `pgcrypto` in the `authenticate_user` RPC — no plaintext fallback)
- **Session:** token stored in `sessionStorage` as JSON (`pl_session` key) and mirrored in the module-level session token (`supabase.ts`) for per-fetch auth
- **Rate limit:** 5 attempts / 15 min per IP (`check_login_rate_limit`)
- **Roles:** `admin`, `captain`, `secretary`, `treasurer`, `staff`
- **Role enforcement:** `RoleRoute` in `App.tsx` checks `getVisiblePaths(user.role)` from `AdminLayout.tsx` — this is a **client-side** gate only. True authorization depends on RLS and SECURITY DEFINER RPCs at the database level (`require_session` + `require_admin`).

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
- **Components:** small set of purpose-built primitives in `src/app/components/ui/` (dialog, confirm-dialog, column-toggle, file-preview, table-state, utils) plus Radix UI primitives used directly across pages
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
| `residents` | Resident registry | ❌ direct SELECT dropped — session-gated RPCs only |
| `documents` | Document requests | ❌ direct SELECT dropped — admin via RPC, public via `get_document_status` |
| `complaints` | Blotter cases | ❌ direct SELECT dropped — session-gated RPCs only |
| `clearance_requests` | Clearance applications | ❌ direct SELECT dropped — INSERT public, admin via RPC |
| `announcements` | Community announcements | ✅ SELECT |
| `projects` | Community projects | ✅ SELECT |
| `polls` | Community voting | ✅ SELECT, votes via RPC |
| `suggestions` | Anonymous feedback | ✅ SELECT (published only), INSERT via RPC |
| `volunteer_signups` | Volunteer registrations | ✅ INSERT only |
| `business_registry` | Business listings | ✅ INSERT only, admin via RPC |
| `reports` | Citizen concerns | ✅ INSERT only |
| `contact_messages` | Contact form submissions | ✅ INSERT only |
| `officials` | Barangay officials | ✅ SELECT |
| `barangay_info` | Barangay profile | ✅ SELECT |
| `services` | Service catalog | ✅ SELECT |
| `audit_logs` | Admin activity log | admin write via RPC |
| `settings` | Key-value config store | admin read/write via RPC |
| `service_fees` | Fee amounts per service | admin read/write via RPC |
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
| `authenticate_user` | `p_login TEXT, p_password TEXT` | JSON — bcrypt login, rate-limited, returns token + user |
| `validate_session` | `p_token TEXT` | JSON — `{valid, user_id, role, expires_at}` |
| `end_session` | `p_token TEXT` | JSON — deletes token |
| `require_session` | `p_token TEXT` | JSON — helper, raises `P0001` if invalid/expired |
| `require_admin` | `p_token TEXT` | JSON — session + role check, raises if not `admin` |
| `check_login_rate_limit` | `p_ip_hash TEXT` | JSON — max 5 attempts per 15min |
| `current_client_ip` | — | TEXT — client IP for audit/rate-limit attribution |
| `hash_password` | `p_plain TEXT` | TEXT — bcrypt hash |
| `update_user_password` | `p_user_id INT, p_current TEXT, p_new TEXT` | JSON |
| `clean_expired_sessions` | — | INT — number of expired sessions deleted |

### User Management (Admin, gated by `require_admin`)
| Function | Params | Returns |
|---|---|---|
| `get_users` | `p_token TEXT` | JSON — all users (password stripped) |
| `create_user` | `p_token, p_name, p_username, p_email, p_password, p_role, p_initials` | JSON — hashes password server-side |
| `update_user` | `p_token, p_name, p_username, p_email, p_role, p_initials` | JSON — no password exposure |
| `set_user_status` | `p_token, p_id INT, p_status TEXT` | JSON — suspend/reactivate |
| `delete_user` | `p_token, p_id INT` | JSON |

### Admin Read Operations (session-gated, paginated)
| Function | Params | Returns |
|---|---|---|
| `admin_get_residents` | `p_token, p_limit DEFAULT 100, p_offset DEFAULT 0` | JSON array (full columns) |
| `admin_get_residents_count` | `p_token` | JSON `{count}` |
| `admin_get_documents` | `p_token, p_limit DEFAULT 100, p_offset DEFAULT 0` | JSON array (full columns) |
| `admin_get_documents_count` | `p_token` | JSON `{count}` |
| `admin_get_complaints` | `p_token, p_limit DEFAULT 100, p_offset DEFAULT 0` | JSON array (full columns) |
| `admin_get_complaints_count` | `p_token` | JSON `{count}` |
| `admin_get_clearance_requests` | `p_token, p_limit DEFAULT 200, p_offset DEFAULT 0` | JSON array (full columns) |
| `admin_get_business_registry` | `p_token, p_limit DEFAULT 200, p_offset DEFAULT 0` | JSON array (full columns) |
| `admin_get_officials` | `p_token` | JSON array |
| `admin_get_settings` | `p_token` | JSON array |
| `admin_get_barangay_info` | `p_token` | JSON array |
| `admin_get_contact_messages` | `p_token, p_limit DEFAULT 100, p_offset DEFAULT 0` | JSON array |
| `admin_get_contact_messages_count` | `p_token` | JSON `{count}` |
| `admin_get_reports` | `p_token, p_limit DEFAULT 100, p_offset DEFAULT 0` | JSON array |
| `admin_get_reports_count` | `p_token` | JSON `{count}` |

### Admin Write Operations (session-gated, audit-logged)
| Function | Params | Returns |
|---|---|---|
| `admin_update_document_status` | `p_token, p_id, p_status, p_logged_in_user` | JSON + audit log |
| `admin_update_blotter_status` | `p_token, p_id, p_status, p_logged_in_user` | JSON + audit log |
| `admin_update_resident` | `p_token, p_id, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_insert_resident` | `p_token, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_delete_resident` | `p_token, p_id, p_logged_in_user` | JSON + audit log |
| `admin_insert_document` | `p_token, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_insert_announcement` | `p_token, p_id, p_title, p_category, p_content, p_date, p_priority, p_logged_in_user` | JSON + audit log |
| `admin_update_announcement` | `p_token, p_id, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_delete_announcement` | `p_token, p_id, p_logged_in_user` | JSON + audit log |
| `admin_insert_blotter` | `p_token, p_id, p_complainant, p_respondent, p_incident, p_date, p_time, p_location, p_summary, p_handler, p_logged_in_user` | JSON + audit log |
| `admin_upsert_setting` | `p_token, p_key, p_value, p_logged_in_user` | JSON + audit log |
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
| `admin_update_barangay_info` | `p_token, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_update_service_fee` | `p_token, p_id INT, p_fee INT, p_logged_in_user` | JSON + audit log |
| `admin_clear_documents` | `p_token, p_logged_in_user` | JSON — deletes all documents |
| `admin_clear_residents` | `p_token, p_logged_in_user` | JSON — deletes all residents |
| `admin_delete_contact_message` | `p_token, p_id, p_logged_in_user` | JSON + audit log |
| `admin_update_contact_message_status` | `p_token, p_id, p_status, p_logged_in_user` | JSON + audit log |
| `admin_insert_business` | `p_token, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_update_business` | `p_token, p_id, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_delete_business` | `p_token, p_id, p_logged_in_user` | JSON + audit log |
| `admin_insert_project` | `p_token, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_update_project` | `p_token, p_id, p_data JSONB, p_logged_in_user` | JSON + audit log |
| `admin_delete_project` | `p_token, p_id, p_logged_in_user` | JSON + audit log |
| `admin_update_clearance_request` | `p_token, p_id, p_status, p_logged_in_user` | JSON + audit log |

### Public / Voting
| Function | Params | Returns |
|---|---|---|
| `search_residents` | `p_query TEXT, p_limit DEFAULT 20, p_offset DEFAULT 0` | JSON — safe columns only (no PII) |
| `get_document_status` | `p_query TEXT` | TABLE — public doc tracking by ID/name, max 20 |
| `check_clearance_status` | `p_control_number TEXT, p_verification_code TEXT` | JSON — clearance lookup |
| `cast_vote` | `p_poll_id UUID, p_option_index INT` | JSON — one vote per IP per poll |
| `get_poll_results` | `p_poll_id UUID` | JSON array of `{option_index, count}` |
| `record_suggestion` | `p_identifier, p_name, p_content` | JSON — max 2 (anon) / 5 (verified) |

### Rate-Limited Form Submission
| Function | Params | Returns |
|---|---|---|
| `rate_limited_insert` | `p_identifier, p_form_type, p_table, p_data JSONB` | JSON — dynamic insert + rate check + audit |

### ID Generation
| Function | Params | Returns |
|---|---|---|
| `get_next_entity_id` | `p_table TEXT, p_prefix TEXT` | TEXT — auto-incrementing ID (e.g. `DOC-001`) |
| `get_next_clearance_number` | `p_year INT` | INT — sequential per year |

### Audit Helper
| Function | Params | Returns |
|---|---|---|
| `admin_log_action` | `p_actor, p_action, p_module, p_target, p_detail JSONB, p_ip` | void — shared audit INSERT |

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
| Prerender | Puppeteer (public routes → static HTML) |
