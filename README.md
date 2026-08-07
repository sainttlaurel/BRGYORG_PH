# BRGYORG_PH — Barangay Management SaaS

A barangay management system that digitizes resident records, complaint tracking, document requests, clearances, and business registry into a single web portal for local government staff.

**Live:** [brgyorg-ph.vercel.app](https://brgyorg-ph.vercel.app/)

## Problem

Local government units in the Philippines still track resident records, complaints, and document requests on paper or in scattered spreadsheets. Residents have no way to check the status of their submitted requests.

## What it does

- **Public portal (15 pages)** — document/clearance/business submissions with tracking numbers and status checkers, resident directory search, community vote, volunteer sign-ups, citizen feedback, report-concern with reference tracking
- **Admin portal (18 pages)** — residents, requests, blotter, officials, announcements, polls, reports, concerns, suggestions, volunteers, contact messages, users, audit logs, settings, business registry, projects, clearances; RBAC, certificate editor, CSV export
- Replaces manual logbooks with a single system

## Tech Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS 4 · Supabase (PostgreSQL + REST/RPC) · TanStack Query · Radix UI · Recharts · Vitest

## Key Decisions

- **Supabase over Prisma/self-hosted** — direct browser-to-Postgres with SECURITY DEFINER RPCs for auth and admin operations; all writes are session-gated and audit-logged server-side
- **Custom bcrypt auth** — `authenticate_user` RPC (pgcrypto), 8-hour session tokens, login rate limiting, no Supabase Auth dependency
- **RLS lockdown** — anon SELECT dropped on sensitive tables; admin reads go through session-gated RPCs, public reads through safe RPCs (`search_residents`, `get_document_status`, `check_clearance_status`)
- **Desktop GUI removed (Aug 2026)** — the web app is the only client
- Public pages are prerendered to static HTML (Puppeteer) for SEO; Sentry is wired and optional

## Project Status

Feature-complete and deployed to Vercel + Supabase. Live demo at the link above. Not yet rolled out to a real barangay.

## Setup

```bash
# clone the repo
git clone https://github.com/sainttlaurel/BRGYORG_PH.git
cd BRGYORG_PH

# install dependencies
npm install

# set up environment variables
cp .env.example .env.local

# run the dev server
npm run dev
```

### Database

Migrations live in `supabase/migrations/` and are applied manually in the Supabase SQL Editor (in order: `20260728_0000` → `20260731_0006`). No Prisma/ORM — plain SQL.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (+ prerender of public routes) |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` / `test:watch` | Vitest |

## Docs

- `md/ARCHITECTURE.md` — structure, routes, data flow, SQL functions, tables
- `md/ROADMAP.md` — status and history
- `md/CHANGELOG.md` — release notes

## Screenshots
<img width="1904" height="935" alt="1" src="https://github.com/user-attachments/assets/5344330a-97a3-493a-b002-ff087fa4c277" />
<img width="1915" height="935" alt="17" src="https://github.com/user-attachments/assets/d23dd19a-6f67-4e55-81f5-16d11468497d" />
<img width="1915" height="935" alt="16" src="https://github.com/user-attachments/assets/cd1b7aad-3c37-471e-b07d-e8807e5afeb3" />
<img width="1912" height="933" alt="15" src="https://github.com/user-attachments/assets/35ed21af-21b8-4a55-8f13-600ec2832925" />
<img width="1900" height="933" alt="14" src="https://github.com/user-attachments/assets/53718e03-cbad-4cee-949a-771052aa5480" />
<img width="1915" height="936" alt="13" src="https://github.com/user-attachments/assets/af3e5c16-c01f-4eac-8e38-ce4a47947116" />
<img width="1790" height="879" alt="12" src="https://github.com/user-attachments/assets/800e9597-fa71-46af-ac69-e55880b3332d" />
<img width="1899" height="930" alt="11" src="https://github.com/user-attachments/assets/cc4faed2-ac22-4c89-9233-8e795e2fcf16" />
<img width="1904" height="908" alt="10" src="https://github.com/user-attachments/assets/baa8add2-9042-4f28-9c92-f203290a58f4" />
<img width="1898" height="934" alt="9" src="https://github.com/user-attachments/assets/c23cfc26-c90a-4dc4-9788-d5d40c005351" />
<img width="1899" height="932" alt="8" src="https://github.com/user-attachments/assets/7fb1704e-de3d-45d4-a88a-41888584f47e" />
<img width="1903" height="937" alt="7" src="https://github.com/user-attachments/assets/47d8bfad-d28d-4a80-85b8-d799f0b6bb8d" />
<img width="1904" height="937" alt="6" src="https://github.com/user-attachments/assets/a51217dc-f6e4-40fa-b1a9-a2a432dfd442" />
<img width="1907" height="932" alt="5" src="https://github.com/user-attachments/assets/4f551b3d-f74d-426b-b72c-0c709edf82c2" />
<img width="1903" height="933" alt="2" src="https://github.com/user-attachments/assets/0b69835c-a027-4e79-bf19-cbd4594bf289" />
