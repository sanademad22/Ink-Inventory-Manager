# Printer Ink Inventory Management System

A full-stack internal tool for tracking printer ink stock, issuing cartridges to employees, and maintaining a complete audit trail with downloadable PDF vouchers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/ink-inventory run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter (routing), TanStack Query, Recharts, jsPDF + jspdf-autotable
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (employees, inventory, transactions)
- `artifacts/api-server/src/routes/` — Express route handlers (employees, inventory, transactions, dashboard)
- `artifacts/ink-inventory/src/` — React frontend (pages: dashboard, inventory, employees, transactions)
- `artifacts/ink-inventory/src/lib/pdf.ts` — PDF voucher generation (client-side, jsPDF)

## Architecture decisions

- OpenAPI-first: spec gates codegen which produces typed React Query hooks and Zod validators used by both frontend and backend
- Transaction safety: `POST /transactions` uses a raw `pg` client with `BEGIN / FOR UPDATE / COMMIT` to prevent concurrent stock overdraw
- PDF vouchers generated fully client-side with jsPDF — no server-side PDF rendering needed
- `isLowStock` computed at query time in the API (not stored) — stock_quantity ≤ min_threshold_limit

## Product

- **Dashboard** — inventory health stats, low-stock alert count, recent activity feed, consumption bar charts by employee and ink model
- **Inventory** — full CRUD for ink models with low-stock badge alerts
- **Employees** — full CRUD with per-employee transaction history view
- **Transactions (Audit Log)** — immutable log of all issuances with timestamps and download-voucher action
- **Issue Ink** — form to issue ink to an employee: validates stock, deducts atomically, creates transaction record
- **PDF Voucher** — downloadable professional voucher with employee info, ink details, quantity, date/time, and signature lines

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any `lib/*` schema change, run `pnpm run typecheck:libs` before leaf artifact typechecks or you'll see stale-declaration errors
- After any `lib/api-spec/openapi.yaml` change, run codegen before using the updated types
- The `/inventory/low-stock` route must come before `/inventory/:id` in the router to avoid Express treating "low-stock" as an ID

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
