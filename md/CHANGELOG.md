# Changelog — Payatas Ledger

All notable changes to this project are documented here.

---

## [6.2.0] — August 16, 2026

### Fixed

- **Public submissions not appearing in admin pages** — realtime subscriptions in `useSupabaseData.ts` were only watching 8 tables (`announcements`, `polls`, `officials`, `barangay_info`, `services`, `reports`, `suggestions`, `volunteer_signups`). Added `documents`, `complaints`, `clearance_requests`, `business_registry`, and `contact_messages` so admin panels auto-refresh when any public form is submitted.
- **`rate_limited_insert` column/value order mismatch** — `string_agg` without `ORDER BY` returns results in non-deterministic order, causing the columns list and values list to be built in different orders and values to land in wrong columns (type errors or silent data corruption). Fixed by adding `ORDER BY key` to both `string_agg` calls. Applied to migrations `0001`, `0004`, and new dedicated migration `0007`. A new migration `20260816_0007_fix_rate_limited_insert.sql` is provided for immediate re-application to the live database.
- **Suggestions and volunteers not session-gated** — added `admin_get_suggestions` and `admin_get_volunteers` SECURITY DEFINER RPCs; `useSupabaseData.ts` and `supabase.ts` updated to route these reads through session-gated RPCs when an admin session exists.
- **Missing resident columns** — `household`, `occupation`, `civil_status` columns added to `residents` table via `ALTER TABLE … ADD COLUMN IF NOT EXISTS` in migration `0004`.
- **Silent error swallowing on document submit** — `catch` block in `PublicDocumentApplication` now surfaces the actual error message in the toast instead of a generic string.

### Added

- **Refresh button on Document Requests** — manual `Refresh` button (with spinner) added to `AdminRequests` as a fallback for environments where Supabase realtime is not enabled.

### Changed

- Admin sidebar nav labels expanded for clarity: "Residents Registry", "Document Requests", "Blotter Records", "Officials Management", "Community Polls", "Reports & Analytics", "Reported Concerns", "Suggestions & Feedback", "Contact Messages", "Volunteer Registrations", "User Management", "Business Registry", "Clearance Requests".
- `AdminAnnouncements` page title simplified to "Announcements" (removed " CMS" suffix).

---

## [6.1.0] — August 6, 2026

### Removed

- **Desktop GUI (Tauri) removed entirely** — `src-tauri/`, release CI, desktop installer artifacts, icon generation script, and `@tauri-apps/cli` dependency all gone. The web app is now the only client.

### Added

- **Session-gated admin read RPCs** — migration `20260731_0006_admin_read_rpcs.sql` adds `admin_get_clearance_requests(p_token, p_limit, p_offset)` and `admin_get_business_registry(p_token, p_limit, p_offset)`, plus the public-safe `get_document_status(p_query)` lookup for document tracking
- **Token-aware data layer** — `useSupabaseData.ts` now reads the session token on every load and routes locked-table reads through the session-gated RPCs when a session exists, with safe anon fallbacks otherwise
- **Login/logout refetch** — `AdminLogin` and `AdminLayout` trigger `refetch()` so admin pages populate immediately after login and clear on logout
- **Public home population stat** — "Registered Residents" now uses the official `barangay_info.population` instead of a resident row count (which is RLS-blocked for anon)
- **Sentry env vars documented** — `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` added to `.env.example`

### Changed

- Recharts moved out of `admin-vendor` into its own `charts` chunk — `admin-vendor` dropped from 621 kB to 199 kB, clearing the >500 kB build warning
- Lint cleanup — four `no-empty` catch-block errors in bulk operations (AdminBlotter, AdminRequests, AdminResidents) fixed

### Fixed

- **Admin pages blank after anon SELECT lockdown** — migration `0003` dropped anon SELECT on residents/documents/complaints/clearance_requests, silently returning empty lists to the admin UI. Admin reads now go through session-gated RPCs; the public registry document tab uses `get_document_status` instead of the locked `documents` table.
- Public document submission `400` — `id_upload` column added (migration `20260731_0005_documents_id_upload.sql`) and upload size capped at 1.5 MB

---

## [6.0.0] — July 31, 2026

### Added

- **Admin GUIs for 3 new modules** — Business Registry (`/admin/business-registry`, approve/reject workflow + CSV), Projects (`/admin/projects`, budget/progress + status workflow + CSV), Clearance Requests (`/admin/clearance-requests`, control # / verification code, approve/reject with timestamps, print-ready clearance certificate + CSV)
- **Public pages** — Business Registry registration form, Projects card grid, Clearance Request (apply + status checker via `check_clearance_status`); all three added to vite prerendering
- **Data layer** — `BusinessRegistry`, `Project`, `ClearanceRequest` types/mappers/fetches in `useSupabaseData.ts`; CRUD in `supabaseWrite.ts` (new `PRJ` id prefix)
- **File previews** — `FilePreview` component renders uploaded images/PDFs; wired into PublicDocumentApplication (upload preview) and AdminRequests (detail modal)
- **Column visibility toggles** — `useColumnVisibility` hook + `ColumnToggle` dropdown on Residents, Requests, Blotter, Business Registry, Projects, Clearances
- **Audit-logging gap closure** — migration `20260731_0004_audit_gaps.sql`: new `admin_log_action` helper; audit logging added to `admin_update_resident`, `admin_insert_resident`, `admin_upsert_setting`, `admin_update_barangay_info`, `admin_update_service_fee`, `admin_clear_documents`, `admin_clear_residents`; new SECURITY DEFINER RPCs for business/projects/clearance CRUD; public document + clearance submissions now audited as `Public` via `rate_limited_insert`
- **Rate limiting for public forms** — `insertDocument` and `insertBusiness` now route through `rate_limited_insert` (3 submits / 10 verified)

### Changed

- Resident insert/update now session-gated RPCs (previously direct table inserts)
- AdminSettings passes the logged-in user into every RPC for audit attribution

---

## [5.0.0] — July 29, 2026

### Added

- **Mobile responsiveness** — all form grids changed to `grid-cols-1 sm:grid-cols-3`; search inputs made full-width with responsive max-width; PublicLayout top bar shows hotline on mobile; AdminLayout header cleaner on small screens
- **Accessibility** — all form fields now have `id` and `name` attributes; labels use `htmlFor` (20+ files)
- **ConfirmDialog component** — styled modal dialog using Radix, replaces native `confirm()` across Residents, Officials, Users, Settings, Announcements, Polls, ContactMessages
- **Skeleton loading** — `TableLoading` now renders animated skeleton rows with configurable count and staggered delays
- **useDebounce hook** — 300ms debounce applied to all 13 search inputs across admin and public pages
- **Retry button** — offline banner on AdminDashboard now has a Retry button calling `refetch()`
- **useSort hook** — column sorting with click-to-sort on table headers / sort button rows (asc/desc toggle)
- **usePagination hook** — page controls with configurable page sizes (10/25/50/100) and First/Prev/Next/Last navigation
- **Bulk operations** — checkbox selection + batch actions (delete, approve, reject, export) on AdminResidents, AdminRequests, AdminBlotter
- **Zod validation** — `residentSchema`, `officialSchema`, `blotterSchema`, `userSchema`, `contactMessageSchema` added to validations; applied to Residents, Officials, Blotter, Users forms
- **CSV export** — added to AdminBlotter and AdminOfficials
- **Keyboard shortcuts** — `Ctrl+K` / `Cmd+K` focuses search input on admin pages

### Changed

- Disclaimer text revised to final version

---

## [4.1.0] — July 28, 2026

### Added

- **Audit logs wired** — all 20 admin write functions in `supabaseWrite.ts` now call `insertAuditLog()` with user, action, and module info on every mutation
- **Certificate template preview** — "Preview" button in template editor opens a styled certificate preview dialog showing how the certificate will look
- **Testing infrastructure** — Vitest + React Testing Library configured with example test; run via `npm run test`
- **Linting & formatting** — ESLint flat config (TypeScript + React + Hooks) + Prettier; run via `npm run lint` / `npm run format`
- **CI pipeline expanded** — `.github/workflows/deploy.yml` now runs `typecheck`, `lint`, and `test` after build (lint/test continue on error)

### Fixed

- **Generic error messages** — all `catch` blocks across 12 admin components now surface actual error messages instead of hardcoded text
- **Missing loading states** — added `TableLoading` early returns to AdminConcerns, AdminVolunteers, AdminSuggestions, AdminOfficials, AdminUsers
- **Age chart invalid DOBs** — AdminReports and AdminDashboard now filter out residents with invalid/missing DOBs before computing age distribution
- **Report tracking** — reference search now tries multiple formats (trimmed, uppercased, with/without prefix)
- **23 lint warnings eliminated** — removed unused imports, fixed `any` types, fixed unused variables, fixed hook dependency

### Changed

- All admin write functions now accept `loggedInUser: string = "System"` parameter for audit trail
- `defaultBarangayInfo` and `defaultServices` moved to module scope to fix React hook dependency warning
- `md/ROADMAP.md` updated — all completed items marked done
- `md/README.md` — added migration notice (Vanilla JS → React + Vite)

### Removed

- Empty `src/app/data/` directory
- `md/CHANGELOG2` duplicate file

---

## [4.0.0] — July 2026

### Added

#### Public features — all 12 pages now live
- **PublicCitizensVoice** — form persists suggestions to `suggestions` table
- **PublicVolunteer** — form persists to `volunteer_signups` table with parsed `body_conditions`
- **PublicReportConcern** — form persists to `reports` table with live status tracking via reference number
- **PublicDocumentApplication** — loading state + spinner on submit
- **PublicCommunityVote** — vote submissions persist via `submitVote()` to `polls.votes` JSONB
- **PublicContact** — new `contact_messages` table; form persists with loading state

#### Admin features — all 14 pages built with live data
- **AdminConcerns** — status badge + workflow actions (Start Review, Dismiss, Mark Resolved, Reopen)
- **AdminSuggestions** — detail modal with reply textarea + archive button
- **AdminVolunteers** — parsed `body_conditions`, Accept/Complete workflow
- **AdminResidents** — `dob` preserved in edit modal
- **AdminUsers** — `username` preserved in edit modal
- **AdminReports** — period dropdown now filters charts/tables by year; CSV export replaces "coming soon" stubs
- **AdminDashboard** — activity feed now sourced from live `auditLogs` instead of static mock array
- **AdminAnnouncements** — `priority` field persisted on create and edit
- **AdminBlotter** — filter column name fix (`incident` → `location`); unused imports cleaned

#### RBAC — Role-Based Access Control
- Sidebar nav items filtered by user role (`admin`, `captain`, `secretary`, `treasurer`, `staff`)
- Route-level protection via `<RoleRoute>` — unauthorized paths redirect to `/admin/dashboard`
- `getVisiblePaths()` exported for route guards in `App.tsx`

#### Certificate template editor
- Inline editor for 6 certificate types (Barangay Clearance, Certificate, Indigency, Residency, Business Clearance, Good Moral)
- Editable fields: Header Text, Footer Text, Signing Officer Title
- Saves to `settings` table with `template_<name>_header/footer/officer` keys
- "custom" badge shown when template has overrides

#### AdminSettings — real functionality
- **Logo upload** — file picker for PNG/SVG, converts to base64 data URL, stored in `seal_url` column with preview + remove
- **Danger zone** — "Clear Document Requests" and "Clear Residents" buttons with confirmation dialogs (replaces toast stubs)

#### CI Pipeline
- `.github/workflows/deploy.yml` — runs `npm ci && npm run build` on every push to `main`

### Fixed
- **Missing UPDATE RLS policy** — `reports` table only had INSERT/SELECT policies; admin status updates silently failed. Added `reports_anon_update` policy.
- **Social media links** — changed `#` placeholders to real QC Government URLs (Facebook, Twitter/X, YouTube) in footer and contact page
- **Misleading file upload UI** — removed evidence upload section from ReportConcern (no storage backend)
- **Inline styles → Tailwind** — converted all admin page headers and sidebar titles from `style={{fontSize}}` to `text-[...]` utility classes
- **AdminReports unused imports** — removed 6 unused imports (AreaChart, Area, Legend, TrendingUp, Calendar, DollarSign)
- **AdminPolls** — unused `CheckCircle` import removed
- **AdminAuditLogs** — unused `Filter`, `Globe` imports removed
- **PublicOfficials** — unused `Leaf`, `Mail` imports removed
- **PublicAnnouncements** — unused `Filter` import removed
- **PublicVolunteer** — unused `CheckCircle` import removed
- **PublicLayout** — unused `ExternalLink` import removed

### Changed
- All admin components now use `refetch()` after mutations to keep UI in sync with DB
- `useData()` returns `reports`, `suggestions`, `volunteers` in `AppData` interface + fetched in `useSupabaseData`
- `mockData.ts` deleted — no mock data remains
- Admin sidebar has 14 entries including Concerns, Suggestions, Volunteers
- All write functions in `supabaseWrite.ts` throw `new Error('offline')` when Supabase is unavailable

### Security
- Added `reports_anon_update` RLS policy for reports table
- Added `contact_messages_anon_update` RLS policy for contact_messages table

### Removed
- `mockData.ts` — all mock/report dummy data deleted
- Evidence file upload UI from PublicReportConcern (no storage backend)
- Static activity feed mock array from AdminDashboard
- `toast` import from AdminReports (CSV export no longer uses toasts)
- PDF/Excel "coming soon" toast stubs from AdminReports

---

## [3.2.0] — July 2026

### Security

- **Removed plaintext password fallback** — `authenticate_user` and `update_user_password` RPCs now use bcrypt-only. The `OR u.password = p_password` branch is gone from both functions.
- **Hashed seed user passwords** — Default accounts in the schema now use `crypt('...', gen_salt('bf'))` instead of plaintext strings.
- **Removed JS-side legacy auth path** — `sbAuthenticateUser` no longer falls back to a direct `users` table SELECT with plaintext comparison. All auth goes through the RPC.
- **Removed `window.SUPABASE_CONFIG` export** — Anon key no longer reachable via DevTools.
- **Tightened RLS on all 13 tables** — Replaced open `USING (true)` policies with purpose-scoped ones:
  - `users` — default-deny for anon. Auth via SECURITY DEFINER RPC only.
  - `document_counters`, `suggestion_limits` — default-deny for anon.
  - `suggestions` — anon SELECT limited to `status = 'published'` rows.
  - `polls` — anon SELECT/UPDATE limited to `status = 'active'` polls.
  - `volunteer_signups`, `business_registry` — anon INSERT only; no anon SELECT.
- **Added SECURITY DEFINER RPCs** to replace all direct access to blocked tables:
  - `get_users()` — password-stripped user list for admin portal
  - `create_user(...)` — hashes password server-side; replaces direct INSERT into users
  - `update_user(...)` — profile field update; no password exposure
  - `set_user_status(...)` — suspend/reactivate without touching password
  - `delete_user(...)` — admin account removal
  - `record_suggestion(...)` — quota-enforced suggestion insert; keeps `suggestion_limits` invisible to anon
- **Added `sql/migrate-security.sql`** — standalone migration for existing live databases.

### Fixed

- `sbLoadAll()` — now calls `sbGetUsers()` RPC instead of `dbFetch('users')`.
- `submitUser()`, `editUser()`, `deleteUser()`, `toggleUserStatus()` — all route through the new user management RPCs.
- `submitSuggestion()` in `landing.js` — now calls `sbRecordSuggestion()` RPC; no direct `suggestion_limits` access from browser.
- Connectivity test and `sbPingLatency()` — changed from `users` table (now blocked) to `announcements`.

### Verified

- Polls widget (`loadPolls`, `votePoll`, realtime subscription) was already fully wired — confirmed working, no changes needed.
- All CSS/JS file references in `index.html` and `admin.html` are correct — no broken paths.
- `.env.example` covers all required variables.

### Planned

- `js/app.js` module split — map documented in `ROADMAP.md`.

---

## [3.1.0] — June 2026

### Fixed

- Login button loading spinner (`id="login-btn"`)
- Reports export button label (CSV, not PDF)
- Hero background image path in `landing.css`
- Bulk document approve/reject now require confirmation
- Poll close action now requires confirmation

### Added

- `BRGY_CONFIG` central configuration in `supabase-config.js`
- Business Registry admin UI (approve/reject/delete)
- Official print letterhead with barangay logo
- Offline database banner when Supabase is unreachable
- Loading skeletons on data tables during initial load
- Live resident count on public portal hero stats
- Real system status on Settings page (version, latency, DB status)
- Security RPC functions for password hashing (`authenticate_user`, `hash_password`, `update_user_password`)
- Race-condition-safe ID generation via `get_next_entity_id` RPC
- Official government trust bar on public portal
- `CHANGELOG.md`

### Changed

- Unified typography to DM Sans across public and admin portals
- Admin login screen uses official barangay logo
- Settings barangay info merges with `BRGY_CONFIG` defaults
- Community Hub tables use XSS escaping (`escHtml`)
- Removed fake dashboard stats and fake system status values

### Security

- Password hashing via PostgreSQL `pgcrypto` (with legacy plaintext fallback during migration)
- New user passwords hashed on creation
- Password change routed through secure RPC when available

---

## [3.0.0] — Prior release

### Added

- Full Supabase schema rebuild (13 tables)
- Session restore on page refresh
- Realtime sync on 8 admin tables and public portal
- Dark mode persistence
- Community Hub (suggestions, polls, volunteers)
- Reports page with live charts
