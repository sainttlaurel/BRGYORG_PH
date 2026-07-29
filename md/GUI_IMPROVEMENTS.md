# GUI Improvements — Payatas Ledger

Last Updated: July 29, 2026
Status: **In progress** — UX and accessibility improvements being applied incrementally alongside live site.

Priority: Critical / High / Medium / Low / Backlog

---

## Completed

- ~~High — Replace native `confirm()` dialogs with styled modal dialogs.~~ **Done — July 2026**
  - Residents (delete), Officials (remove), Users (delete), Settings (clear all documents/residents)
  - Uses existing Radix dialog with danger/warning variant, icon, and confirm/cancel buttons
- ~~Medium — Add skeleton loading states to data tables.~~ **Done — July 2026**
  - `TableLoading` now renders animated skeleton rows matching table column layout
  - Configurable row count, staggered animation delays for natural feel

---

## High Priority

### 1. Debounced search inputs
- **Problem:** Search inputs fire on every keystroke against in-memory arrays. Fine for small datasets but wasteful with 500+ records and unnecessary re-renders.
- **Solution:** Apply `useDebounce` hook (hook exists at `src/lib/hooks/useDebounce.ts`) to all search inputs.
- **Files affected:** AdminResidents, AdminRequests, AdminBlotter, AdminAnnouncements, AdminOfficials, AdminAuditLogs, AdminUsers, AdminConcerns, AdminSuggestions, AdminVolunteers, AdminContactMessages, PublicAnnouncements, PublicRegistry

### 2. Retry button on offline state
- **Problem:** When Supabase is unreachable, the dashboard shows an offline banner but offers no way to retry.
- **Solution:** Add a "Retry" button to the offline banner that calls `refetch()`.
- **Files affected:** AdminDashboard

### 3. Confirmation on all destructive actions (remaining)
- **Problem:** Some delete operations still lack confirmation (announcement delete, poll delete, contact message delete).
- **Solution:** Apply `ConfirmDialog` to all remaining destructive buttons.
- **Files affected:** AdminAnnouncements, AdminPolls, AdminContactMessages, AdminBlotter

---

## Medium Priority

### 4. Column sorting on data tables
- **Problem:** No table columns are sortable.
- **Solution:** Add click-to-sort on table headers (asc/desc toggle).
- **Files affected:** AdminResidents, AdminRequests, AdminBlotter, AdminOfficials, AdminAnnouncements, AdminAuditLogs

### 5. Pagination for large datasets
- **Problem:** All records render at once. With 500+ entries the page gets slow.
- **Solution:** Add page-size selector (10/25/50/100) and prev/next controls.
- **Files affected:** AdminResidents, AdminRequests, AdminAuditLogs

### 6. Bulk operations
- **Problem:** No checkbox selection or batch actions.
- **Solution:** Add row checkboxes + "Select All" header. Batch: delete, export CSV, approve.
- **Files affected:** AdminResidents, AdminRequests, AdminBlotter

### 7. Form validation library
- **Problem:** Every form uses manual `useState` + inline validation. Repetitive.
- **Solution:** Use zod + hookform resolvers (already in dependencies) for new forms.

---

## Low Priority / Backlog

### 8. File preview for uploads
- **Problem:** Uploaded files show filename only, no preview.
- **Solution:** Show image thumbnail or PDF icon.

### 9. Column visibility toggles
- **Problem:** Fixed columns, some hidden on mobile via `hidden md:table-cell`.
- **Solution:** Add dropdown to show/hide columns.

### 10. Export improvements
- **Problem:** Only audit logs have CSV export.
- **Solution:** Add CSV export to Residents, Requests, Blotter, Officials.

### 11. Keyboard navigation & shortcuts
- **Problem:** No keyboard shortcuts for common actions.
- **Solution:** Add global shortcut handler (Ctrl+K search, Escape close, etc.).

---

## Database Tables With No GUI

| Table | Columns | Missing |
|---|---|---|
| `business_registry` | id, name, owner, category, contact, address, description, status, created_at | No public form, no admin page |
| `projects` | id, title, category, status, budget, progress, description, target_date, reactions | No public listing, no admin CRUD |
| `clearance_requests` | id, resident_id, full_name, address, purpose, doc_type, contact, control_number, verification_code, status | Table unused. PublicDocumentApplication writes to documents. check_clearance_status RPC has no UI |

---

## Audit Logging Gaps

- Resident create/update — no audit log written
- Document create — no audit log written
- Barangay info / settings / service fee updates — no audit log written

---

## Recent UX Wins

- Mobile grids: `grid-cols-3` to `grid-cols-1 sm:grid-cols-3` across all forms
- Fixed-width search inputs replaced with full-width + responsive max-width
- PublicLayout top bar shows hotline on mobile (was hidden)
- AdminLayout header cleaner on mobile
- All form fields have `id`/`name` attributes, labels use `htmlFor`
- Disclaimer centered both vertically and horizontally
