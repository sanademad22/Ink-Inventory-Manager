---
name: Auth session setup
description: How session auth is wired in the Express API server and React frontend
---

## The rule
Session auth uses express-session + connect-pg-simple (PostgreSQL session store) + bcryptjs.

**Why:** Simple internal tool with user management; no OAuth needed. SESSION_SECRET already provisioned as a Replit secret.

**How to apply:**
- Backend: `app.ts` installs session middleware before routes; `SESSION_SECRET` env var consumed there; `secure: true` only in production.
- Session store: `connect-pg-simple` with `createTableIfMissing: true` — creates the `session` table automatically on first boot.
- Auth middleware: `requireAuth` checks `req.session.userId`; `requireAdmin` also checks `req.session.userRole === 'admin'`.
- Frontend: `main.tsx` patches `window.fetch` with `credentials: 'include'` globally so all API hooks send the session cookie automatically.
- Login/logout/me use raw `fetch` (not generated hooks) because they manage the session cookie handshake.
- Default admin seeded: username `admin`, password `admin123`, role `admin`.
