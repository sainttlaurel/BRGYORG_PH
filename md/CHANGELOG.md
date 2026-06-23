# Changelog — Payatas Ledger

All notable changes to this project are documented here.

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

- Full Supabase schema rebuild (13 tables)
- Session restore on page refresh
- Realtime sync on 8 admin tables + public portal
- Dark mode persistence
- Community Hub (suggestions, polls, volunteers)
- Reports page with live charts
