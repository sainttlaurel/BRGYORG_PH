# ROADMAP — Payatas Ledger

Last Updated: July 29, 2026
Status: **Feature-complete web app with test suite.** All public forms persist to Supabase. All 14 admin pages exist with live data. RBAC, certificate editor, CSV export, CI pipeline, testing suite done.

Priority levels: Critical / High / Medium / Backlog

---

## Bug Fixes

- ~~Critical — Remove plaintext password fallback.~~ **Done — July 2026**
- ~~Critical — Add Row-Level Security (RLS) policies on all tables.~~ **Done — July 2026**
- ~~High — Reports table missing UPDATE RLS policy — status updates silently fail.~~ **Done — July 2026**
- ~~High — Social media links all `href="#"` — go nowhere.~~ **Done — July 2026**
- ~~High — AdminDashboard activity feed is static mock data.~~ **Done — July 2026**
- ~~High — AdminReports period dropdown doesn't filter anything.~~ **Done — July 2026**
- ~~Medium — PublicContact form doesn't persist anywhere.~~ **Done — July 2026**
- ~~Medium — File upload UI on ReportConcern has no backend — misleading.~~ **Done — July 2026**
- ~~Medium — Inline `style={{}}` attributes should be Tailwind classes.~~ **Done — July 2026**

### Known issues (not yet fixed)

- ~~**Audit logs not wired** — admin RPCs now INSERT into audit_logs server-side on every mutation.~~ **Fixed**
- ~~**No contact messages admin UI** — full inbox view exists with list/detail layout, search, and delete.~~ **Done**
- ~~**No certificate preview** — preview dialog renders styled certificate with template values.~~ **Done**
- ~~**Zero error detail** — all catch blocks surface actual Supabase error messages.~~ **Fixed**
- ~~**Inconsistent loading states** — TableLoading early returns added to all data tables.~~ **Fixed**
- ~~**Report tracking is exact-match only** — added multi-strategy search: exact match, ILIKE wildcards, stripped non-alphanumeric, numeric extraction (with/without zero-padding), last-4-digit lookup.~~ **Fixed — July 2026**
- ~~**AdminReports age chart** — invalid DOBs filtered out; `No demographic data available` fallback shown when no valid data. Consistent handling in AdminDashboard.~~ **Fixed — July 2026**

---

## Improvements

- ~~Critical — Migrate to React + TypeScript + Vite.~~ **Done — July 2026**
- ~~High — Centralize Supabase calls into a service layer.~~ **Done — July 2026**
- ~~High — Introduce state management (React Query).~~ **Done — July 2026**
- ~~High — Add centralized error handling.~~ **Done — July 2026**
- ~~Medium — Code-split public and admin bundles.~~ **Done — July 2026**
- ~~Medium — Expand search and filtering on admin tables.~~ **Done — July 2026**
- ~~Medium — Accessibility pass (WCAG 2.1).~~ **Done — July 2026**
- ~~Medium — Formalize design tokens.~~ **Done — July 2026**
- ~~Low — Convert inline styles to Tailwind utility classes.~~ **Done — July 2026**

### Still to improve

- ~~**Audit log wiring** (Medium) — all admin RPCs now INSERT into audit_logs server-side.~~ **Done — July 2026**
- ~~**Certificate preview** (Medium) — preview dialog shows styled certificate with template values.~~ **Done — July 2026**
- ~~**Contact messages admin UI** (Low) — inbox view with list/detail layout, search, and delete.~~ **Done — July 2026**
- ~~**Error detail pass** (Low) — all catch blocks surface actual error messages.~~ **Done — July 2026**
- ~~**Loading state consistency** (Low) — TableLoading added to all data tables.~~ **Done — July 2026**

---

## New Features

### Public Site (guest access)

All items complete. 12 public pages fully wired:

| Page | Status |
|---|---|
| Home, About, Officials, Services | Wired to Supabase |
| Announcements | Wired to Supabase |
| Document Application | Wired to Supabase |
| Public Registry | Wired to Supabase |
| Report Concern | Persists to `reports` + live tracking via ref number |
| Citizens' Voice | Persists to `suggestions` |
| Community Vote | Persists to `polls.votes` |
| Volunteer | Persists to `volunteer_signups` |
| Contact | Persists to `contact_messages` |

### Admin Portal

All items complete. 14 admin pages built:

| Page | Status |
|---|---|
| Dashboard | Live activity feed + charts |
| Residents, Requests, Blotter | CRUD + search/filter |
| Officials, Announcements, Polls | CRUD + status workflows |
| Concerns, Suggestions, Volunteers | Status workflows (Start Review, Dismiss, Resolve, Accept, Archive) |
| Users, Audit Logs | CRUD + live audit trail view |
| Reports | Charts + period filter + CSV export |
| Settings | Profile, fees, templates editor, notifications, security, danger zone |

#### RBAC — Role-Based Access Control

**Done — July 2026.** Roles: `admin`, `captain`, `secretary`, `treasurer`, `staff`.

- Sidebar nav items filtered by role via `roles[]` array on each item
- Route-level protection via `<RoleRoute>` component — unauthorized paths redirect to dashboard
- `getVisiblePaths()` exported for use in route guards

#### Certificate Template Editor

**Done — July 2026.** Inline editor with Header, Footer, and Officer fields per template type. Saves to `settings` table. "custom" badge shown when overridden.

### Engineering

- ~~CI pipeline~~ **Done — July 2026** (`.github/workflows/deploy.yml`: build on push to main)
- **Testing — Jest + React Testing Library** (Medium) — no test files exist yet
- **Error monitoring — Sentry or equivalent** (Backlog)

### Desktop GUI — Offline Backup Client (Electron)

**Priority: Backlog.** Scope and architecture documented in previous versions of this roadmap. Not started.

---

## Sequencing

1. ~~Security cutover — RLS policies + drop plaintext auth fallback~~ **Done**
2. ~~Verify file path integrity~~ **Done**
3. ~~Wire up Community Vote polls~~ **Done**
4. ~~React + TypeScript + Vite migration~~ **Done**
5. ~~Build all public forms and admin pages~~ **Done**
6. ~~RBAC, template editor, CI, CSV export, logo upload~~ **Done**
7. ~~Wire audit logs to all admin write functions~~ **Done — July 2026**
8. ~~Certificate preview render~~ **Done — July 2026**
9. ~~Contact messages admin inbox~~ **Done — July 2026**
10. ~~Testing suite (Vitest + RTL)~~ **Done — July 2026** — 15 tests across 4 test files (utility, auth, dashboard, not-found)
11. Desktop GUI (Electron) — **Backlog**
