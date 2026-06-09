---
name: Session persistence behind Replit proxy
description: Express sessions don't persist unless you call req.session.save() and set trust proxy on Replit.
---

## Rule
In any Express app on Replit using express-session:
1. Call `app.set("trust proxy", 1)` before session middleware.
2. In the login handler, call `req.session.save(cb)` and send the response inside the callback — not after the assignment.

## Why
Replit uses a reverse HTTPS proxy. Without `trust proxy`, Express doesn't trust forwarded headers and cookie behavior can break. Without `req.session.save()`, the session may not be flushed to the store (PostgreSQL via connect-pg-simple) before the response is sent, causing the next request to see no session.

## How to apply
Always apply both fixes together when adding session auth to an Express app on Replit. This affects any route that creates a session (login, OAuth callback, etc.).
