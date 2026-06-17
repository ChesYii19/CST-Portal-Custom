---
name: Security decisions — CST Portal API
description: Security architecture decisions made during the security hardening sprint
---

## Rate Limiting
- Global: 300 req/15min per IP via `express-rate-limit` v8 (globalLimiter in lib/rateLimiters.ts)
- Auth endpoints: 10 req/15min per IP (authLimiter applied to POST /auth/login)
- Rate limiters in separate file to avoid circular dep: app.ts → routes/auth.ts → app.ts

## Circular Dependency Pattern
- `authLimiter` must NOT be exported from `app.ts` — causes circular dep with routes that import it
- Always put shared middleware in `src/lib/` (e.g., `lib/rateLimiters.ts`)

## Session Cookie
- Cookie renamed from `connect.sid` to `cst.sid` (obscures framework)
- maxAge reduced from 7 days to 8 hours (least-privilege)
- `sessionToken` (sessionID) was removed from login response body — lives in httpOnly cookie only

## session.regenerate() breaks Set-Cookie behind Replit proxy
- **DO NOT use `session.regenerate()` in the login handler.**
- express-session only sends `Set-Cookie` when `secure: true` AND `X-Forwarded-Proto: https` is present.
- `session.regenerate()` inside an async callback creates a race: `onHeaders` fires before the new session ID is ready → no cookie is sent → every subsequent `GET /auth/me` returns 401.
- **Fix**: set `req.session.userId` directly, then call `req.session.save()`. Session-fixation risk is mitigated by `httpOnly` cookie (JS cannot read session ID) + `saveUninitialized: false`.
- **How to verify**: `python3 -c "import http.client, json; ..."` with `X-Forwarded-Proto: https` header — the Set-Cookie must appear in the response headers.

## Self-update vs Admin Update
- PATCH /auth/me — any authenticated user, updates name/dept/color only
- PATCH /users/:id — admin only, can change role/status/email
- Profile.tsx uses fetch('/api/auth/me') not useUpdateUser hook

## Authorization Pattern
- requireAuth now caches user.role as req.authUserRole (avoids repeated DB lookups)
- requireAdmin in users.ts checks authUserRole directly
- GET /users restricted to admin (was leaking all emails to any authenticated user)

## User Enumeration Fix
- DUMMY_HASH = bcrypt.hashSync('__cst_timing_sentinel__', 10) computed at startup
- Always call bcrypt.compare() even for non-existent users to equalize response timing

## Input Validation
- POST /documents was missing Zod — now has manual validation (ext allowlist, name length)
- Message text max 2000 chars (chat.ts)
- Task title max 300 chars (tasks.ts)
- User name max 100 chars, password max 128 chars, min 8 + complexity rules

## Access Control
- DELETE /tasks — admin or sector_manager only
- DELETE /documents — admin or sector_manager only
- DELETE /users — admin only, self-delete prevented on backend
