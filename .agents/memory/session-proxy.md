---
name: Session persistence behind Replit proxy
description: Express sessions don't persist unless you call req.session.save() and set trust proxy on Replit.
---

## Rule
Cookie-based sessions are NOT reliable in the Replit preview iframe (cross-site iframe context). Use a hybrid approach:

1. `app.set("trust proxy", 1)` — required for the reverse proxy.
2. `req.session.save(cb)` — save session before responding in login.
3. Return `sessionToken: req.sessionID` in the login JSON body.
4. Frontend stores it: `localStorage.setItem("cst_session_token", data.sessionToken)`.
5. Frontend sends it: `setAuthTokenGetter(() => localStorage.getItem("cst_session_token"))`.
6. Backend `requireAuth` middleware checks: cookie session → falls back to Bearer token → looks up session in DB by SID.

Cookie settings: `sameSite: "none", secure: true` (Replit is always HTTPS via proxy, `trust proxy: 1` makes it work).

## Why
The Replit preview pane embeds the app in a cross-site iframe. `SameSite=Lax` cookies are blocked in this context. `SameSite=None; Secure` should work but is unreliable across different Replit preview modes. The localStorage Bearer token approach bypasses all cookie/SameSite issues entirely and is the most robust solution.

## How to apply
Any new Express session auth on Replit: always implement hybrid cookie + localStorage Bearer token. The `requireAuth` middleware pattern in `artifacts/api-server/src/middleware/requireAuth.ts` is the reference implementation.
