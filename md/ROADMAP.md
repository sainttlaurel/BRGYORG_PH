# ROADMAP — Payatas Ledger

Last Updated: July 28, 2026
Status: **Feature-complete web app.** All public forms persist to Supabase. All 14 admin pages exist with live data. RBAC, certificate editor, CSV export, CI pipeline done.

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

- **Audit logs not wired** — admin write functions don't call `insertAuditLog()`, so the audit table stays empty.
- ~~**No contact messages admin UI** — `contact_messages` table exists but admin has no way to view/reply.~~ **Done — July 2026**
- **No certificate preview** — template editor saves to DB but there's no render/preview.
- **Report tracking is exact-match only** — no fuzzy search or typo tolerance on reference numbers.
- **AdminReports age chart** — `age` derived from `dob` in mapper; invalid DOBs produce wrong chart data.
- **Zero error detail** — most `catch` blocks just `toast.error("Failed to ...")` with no specific error message.
- **Inconsistent loading states** — some admin tables show spinners, others flash empty before data arrives.

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

- **Audit log wiring** (Medium) — every admin mutation should call `insertAuditLog()` so the audit table has real data.
- **Certificate preview** (Medium) — render a mock certificate with the template values so admin can see before saving.
- ~~**Contact messages admin UI** (Low) — simple inbox view for submitted contact messages.~~ **Done — July 2026**
- **Error detail pass** (Low) — surface Supabase error messages in catch blocks instead of generic text.
- **Loading state consistency** (Low) — ensure all data tables show a consistent skeleton/spinner pattern.

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
7. ~~Contact messages admin inbox~~ **Done**
8. Wire audit logs to all admin write functions — **Next (Medium)**
9. Certificate preview render — **Next (Medium)**
10. Testing suite (Vitest/RTL) — **Next (Medium)**
11. Desktop GUI (Electron) — **Backlog**
