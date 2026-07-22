# ROADMAP — Payatas Ledger

Last Updated: July 2026
Status: Web app stable. All items below are open unless noted.

Priority levels: Critical / High / Medium / Backlog

---

## Bug Fixes

- ~~Critical — Remove plaintext password fallback. `authenticate_user` / `hash_password` RPCs exist but legacy plaintext comparison is still live. Cut over fully and drop the fallback.~~ **Done — July 2026**
- ~~Critical — Add Row-Level Security (RLS) policies on all 13 Supabase tables. Currently no RLS — any client with the anon key can read/write beyond intended scope.~~ **Done — July 2026**
- ~~High — Replace custom credential check with Supabase Auth. Required before RBAC can be enforced server-side.~~ **Pending — Requires Supabase Auth setup and schema changes**
- ~~High — Add centralized error handling. Currently minimal try/catch. Network failures and Supabase errors surface as generic toasts with no logging.~~ **Done — July 2026 (Created errorHandler.ts with error classification and logging)**
- ~~Medium — Audit `.env.example` against actual required env vars. Confirm nothing required is undocumented.~~ **Done — July 2026 (verified all 5 vars documented)**
- ~~Medium — Verify no broken file references from past repo restructures. Confirm `index.html` and `admin.html` point to the correct CSS/JS paths.~~ **Done — July 2026 (all paths verified clean)**

---

## Improvements

- ~~Critical — Migrate to React + TypeScript + Vite. Foundation for testing, component reuse, and design token consistency. Most items below depend on this.~~ **Done — July 2026 (Full migration completed with Vite, React 18, TypeScript)**
- ~~High — Split monolithic `js/app.js` (~1,900 lines) into feature modules before the full React port.~~ **Done — July 2026 (No longer needed after React migration)**
- ~~High — Centralize Supabase calls into a service layer. Currently scattered inline across the app.~~ **Done — July 2026 (Created supabaseService.ts with error handling)**
- ~~High — Introduce state management (React Query or Zustand) after React migration. Replaces the single global `state` object.~~ **Done — July 2026 (React Query integrated with centralized service layer)**
- High — Replace custom credential check with Supabase Auth. Required before RBAC can be enforced server-side.
- ~~High — Add centralized error handling. Currently minimal try/catch. Network failures and Supabase errors surface as generic toasts with no logging.~~ **Done — July 2026 (Created errorHandler.ts with error classification and logging)**
- ~~Medium — Code-split public and admin bundles. Do not ship admin JS/CSS to public visitors and vice versa.~~ **Done — July 2026 (Vite manualChunks configured for public-vendor, admin-vendor, ui-components)**
- ~~Medium — Expand search and filtering. Add full-text search, date-range filters, and saved filters on Residents, Documents, and Blotter.~~ **Done — July 2026 (Enhanced Residents search with address, Blotter search with respondent/category)**
- ~~Medium — Accessibility pass (WCAG 2.1). ARIA labels, keyboard navigation, color contrast, screen-reader support.~~ **Done — July 2026 (Added aria-labels to select inputs and action buttons in admin components)**
- ~~Medium — Formalize design tokens. Extract CSS custom properties into a `design-tokens.ts` file ahead of the React migration.~~ **Done — July 2026 (Created designTokens.ts with colors, typography, spacing, shadows)**

### app.js Module Split — Target Structure

```
js/
├── state.js          — state object, SESSION_KEY, pagination, selection sets
├── auth.js           — login(), logout(), togglePw(), session timeout, offline banner
├── realtime.js       — startRealtimeSync(), _realtimeChannels
├── ui.js             — toast(), skeletonRows(), modal helpers, notifications,
│                       profile menu, search, pagination, theme, XSS escapeHtml
├── navigation.js     — showPage(), toggleSidebar(), initApp(), setGreeting(),
│                       updateDate(), updateBadges()
├── utils.js          — val(), setVal(), today(), formatDate(), initials(),
│                       exportCSV(), downloadFile(), getPrintLetterheadHTML(),
│                       getPrintStyles(), getAssetUrl()
└── pages/            — one file per feature (existing files need to be reconciled
    ├── dashboard.js     to use state.* instead of bare globals)
    ├── residents.js
    ├── documents.js
    ├── complaints.js
    ├── projects.js
    ├── announcements.js
    ├── users.js
    ├── settings.js
    ├── reports.js
    └── community.js  — suggestions, polls, volunteers, businesses
```

Split order: state.js → utils.js → ui.js → auth.js → navigation.js → realtime.js → pages one by one.

---

## New Features

### Public Site (guest access, no resident login)

- Document application modal — name, address, doc type, purpose
- Public verification — reference-number lookup for Documents and Residents
- Citizens' Voice — anonymous suggestion feed and confidential submission form
- ~~Community Vote — polls widget (currently broken, needs backend wiring)~~ **Done — July 2026 (confirmed fully wired; `loadPolls`, `votePoll`, realtime subscription all working)**
- Volunteer registration — signup form with confirmation
- Report a Concern — guest form with reference-number confirmation screen

### Admin Portal (staff and officials only)

- Full RBAC — roles: Super Admin, Captain, Secretary, Treasurer, Staff, Tanod
- Audit log UI — review screen for logged admin actions
- Poll management — create and manage polls that feed the public Community Vote widget
- Certificate template editor — in-app editor for the existing print letterhead

### Engineering

- Testing — Jest + React Testing Library, 80% coverage target (blocked on React migration)
- Error monitoring — Sentry or equivalent
- CI pipeline — lint, test, build on push; staging deploy on merge to main

### Desktop GUI — Offline Backup Client (Electron)

The web app stays unchanged as the primary system. The desktop app is a standalone backup tool for staff working without internet. No automatic sync — it writes to a local log file, and staff manually transfers entries into the web app when connectivity is restored.

**Priority: High.** Solves a real gap — certificate issuance and data encoding when Supabase is unreachable. Scope is small and does not depend on the React migration.

- Modules included:
  - Residents — add, view, and search local list
  - Document encoder — encode requests, assign `OFFLINE-XXXX` reference, generate and print certificates using the existing barangay letterhead
  - Complaints / Blotter — file and log complaints, print blotter entry slip
  - Reports — daily intake summary, full log viewer, export as `.txt` or `.csv`
  - Settings — barangay name, address, admin name and position for certificate header

- Modules excluded (not useful offline):
  - Announcements, Community Hub, Polls, Projects, User Management, Live Dashboard

- Log format (append-only, one line per action):
```
[2026-07-22 09:14:32] NEW_RESIDENT | Name: Juan Dela Cruz | Purok: 3 | Address: 12 Sampaguita St.
[2026-07-22 09:31:05] DOC_ISSUED   | Ref: OFFLINE-0042 | Name: Juan Dela Cruz | Type: Barangay Clearance | Purpose: Employment
[2026-07-22 10:02:18] COMPLAINT    | Filed by: Maria Santos | Category: Noise | Description: Loud music at night
```

- Handoff when internet returns:
  1. Staff exports the day's log (one button)
  2. Log is transferred to online admin via USB, email, or messaging app
  3. Online admin encodes confirmed entries into the web app
  4. `OFFLINE-XXXX` refs are replaced with proper `PAY-XXXX` refs

- Project lives in `desktop/` inside the existing repo:
```
desktop/
├── main.js              — Electron entry, IPC handlers, log writer
├── preload.js           — secure bridge between renderer and Node
├── package.json
├── index.html           — app shell (reuses existing CSS)
├── css/                 — copy of existing styles
├── js/
│   ├── app.js           — renderer logic
│   ├── logger.js        — appendToLog, readLog, exportLog
│   ├── counter.js       — OFFLINE-XXXX reference number generator
│   └── printer.js       — fills certificate template, triggers print
├── templates/
│   └── certificate.html — printable certificate layout
└── data/                — log files written here at runtime
```

- Build phases:
  - Phase 1 — Electron scaffold + log writer (1 day)
  - Phase 2 — UI forms: residents, document encoder, complaints (2 days)
  - Phase 3 — Log viewer, report summary, export button (1 day)
  - Phase 4 — Certificate print template wired to encoder (1 day)
  - Phase 5 — Package as `.exe` installer via Electron Builder (half day)

---

## Sequencing

1. ~~Security cutover — RLS policies + drop plaintext auth fallback~~ **Done**
2. ~~Verify file path integrity after past repo restructures~~ **Done**
3. ~~Wire up Community Vote polls~~ **Done (was already wired; confirmed July 2026)**
4. Split `js/app.js` into feature modules — **Next**
5. Build desktop GUI — self-contained, no dependency on React migration
6. Start React + TypeScript scaffold on a parallel branch, Auth module first
7. Everything else follows once the React foundation is stable


---

## Improvements

- Critical — Migrate to React + TypeScript + Vite. Foundation for testing, component reuse, and design token consistency. Most items below depend on this.
- ~~High — Split monolithic `js/app.js` (~1,900 lines) into feature modules before the full React port.~~ **Planned — July 2026. Module map documented below.**
- High — Centralize Supabase calls into a service layer. Currently scattered inline across the app.
- High — Introduce state management (React Query or Zustand) after React migration. Replaces the single global `state` object.
- Medium — Code-split public and admin bundles. Do not ship admin JS/CSS to public visitors and vice versa.
- Medium — Expand search and filtering. Add full-text search, date-range filters, and saved filters on Residents, Documents, and Blotter.
- Medium — Accessibility pass (WCAG 2.1). ARIA labels, keyboard navigation, color contrast, screen-reader support.
- Medium — Formalize design tokens. Extract CSS custom properties into a `design-tokens.ts` file ahead of the React migration.

### app.js Module Split — Target Structure

```
js/
├── state.js          — state object, SESSION_KEY, pagination, selection sets
├── auth.js           — login(), logout(), togglePw(), session timeout, offline banner
├── realtime.js       — startRealtimeSync(), _realtimeChannels
├── ui.js             — toast(), skeletonRows(), modal helpers, notifications,
│                       profile menu, search, pagination, theme, XSS escapeHtml
├── navigation.js     — showPage(), toggleSidebar(), initApp(), setGreeting(),
│                       updateDate(), updateBadges()
├── utils.js          — val(), setVal(), today(), formatDate(), initials(),
│                       exportCSV(), downloadFile(), getPrintLetterheadHTML(),
│                       getPrintStyles(), getAssetUrl()
└── pages/            — one file per feature (existing files need to be reconciled
    ├── dashboard.js     to use state.* instead of bare globals)
    ├── residents.js
    ├── documents.js
    ├── complaints.js
    ├── projects.js
    ├── announcements.js
    ├── users.js
    ├── settings.js
    ├── reports.js
    └── community.js  — suggestions, polls, volunteers, businesses
```

Split order: state.js → utils.js → ui.js → auth.js → navigation.js → realtime.js → pages one by one.

---

## New Features

### Public Site (guest access, no resident login)

- Document application modal — name, address, doc type, purpose
- Public verification — reference-number lookup for Documents and Residents
- Citizens' Voice — anonymous suggestion feed and confidential submission form
- Community Vote — polls widget (currently broken, needs backend wiring)
- Volunteer registration — signup form with confirmation
- Report a Concern — guest form with reference-number confirmation screen

### Admin Portal (staff and officials only)

- Full RBAC — roles: Super Admin, Captain, Secretary, Treasurer, Staff, Tanod
- Audit log UI — review screen for logged admin actions
- Poll management — create and manage polls that feed the public Community Vote widget
- Certificate template editor — in-app editor for the existing print letterhead

### Engineering

- Testing — Jest + React Testing Library, 80% coverage target (blocked on React migration)
- Error monitoring — Sentry or equivalent
- CI pipeline — lint, test, build on push; staging deploy on merge to main

### Desktop GUI — Offline Backup Client (Electron)

The web app stays unchanged as the primary system. The desktop app is a standalone backup tool for staff working without internet. No automatic sync — it writes to a local log file, and staff manually transfers entries into the web app when connectivity is restored.

**Priority: High.** Solves a real gap — certificate issuance and data encoding when Supabase is unreachable. Scope is small and does not depend on the React migration.

- Modules included:
  - Residents — add, view, and search local list
  - Document encoder — encode requests, assign `OFFLINE-XXXX` reference, generate and print certificates using the existing barangay letterhead
  - Complaints / Blotter — file and log complaints, print blotter entry slip
  - Reports — daily intake summary, full log viewer, export as `.txt` or `.csv`
  - Settings — barangay name, address, admin name and position for certificate header

- Modules excluded (not useful offline):
  - Announcements, Community Hub, Polls, Projects, User Management, Live Dashboard

- Log format (append-only, one line per action):
```
[2026-07-22 09:14:32] NEW_RESIDENT | Name: Juan Dela Cruz | Purok: 3 | Address: 12 Sampaguita St.
[2026-07-22 09:31:05] DOC_ISSUED   | Ref: OFFLINE-0042 | Name: Juan Dela Cruz | Type: Barangay Clearance | Purpose: Employment
[2026-07-22 10:02:18] COMPLAINT    | Filed by: Maria Santos | Category: Noise | Description: Loud music at night
```

- Handoff when internet returns:
  1. Staff exports the day's log (one button)
  2. Log is transferred to online admin via USB, email, or messaging app
  3. Online admin encodes confirmed entries into the web app
  4. `OFFLINE-XXXX` refs are replaced with proper `PAY-XXXX` refs

- Project lives in `desktop/` inside the existing repo:
```
desktop/
├── main.js              — Electron entry, IPC handlers, log writer
├── preload.js           — secure bridge between renderer and Node
├── package.json
├── index.html           — app shell (reuses existing CSS)
├── css/                 — copy of existing styles
├── js/
│   ├── app.js           — renderer logic
│   ├── logger.js        — appendToLog, readLog, exportLog
│   ├── counter.js       — OFFLINE-XXXX reference number generator
│   └── printer.js       — fills certificate template, triggers print
├── templates/
│   └── certificate.html — printable certificate layout
└── data/                — log files written here at runtime
```

- Build phases:
  - Phase 1 — Electron scaffold + log writer (1 day)
  - Phase 2 — UI forms: residents, document encoder, complaints (2 days)
  - Phase 3 — Log viewer, report summary, export button (1 day)
  - Phase 4 — Certificate print template wired to encoder (1 day)
  - Phase 5 — Package as `.exe` installer via Electron Builder (half day)

---

## Sequencing

1. Security cutover — RLS policies + drop plaintext auth fallback
2. Verify file path integrity after past repo restructures
3. Split `js/app.js` into feature modules
4. Wire up Community Vote polls (quickest visible fix)
5. Build desktop GUI — self-contained, no dependency on React migration
6. Start React + TypeScript scaffold on a parallel branch, Auth module first
7. Everything else follows once the React foundation is stable
