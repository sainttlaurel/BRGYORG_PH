# Changelog — Payatas Ledger

All notable changes to this project are documented here.

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
