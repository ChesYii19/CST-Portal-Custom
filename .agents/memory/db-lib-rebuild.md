---
name: DB lib rebuild order for TypeScript
description: When the DB schema changes, typecheck:libs must run before leaf package typechecks.
---

## Rule
After any change to `lib/db/src/schema/index.ts` (or any lib), run:
```
pnpm run typecheck:libs
```
before running `pnpm --filter @workspace/api-server run typecheck`.

## Why
Lib packages are composite and emit declarations. Leaf packages (api-server, cst-portal) import from the generated `.d.ts` files. If declarations are stale, the leaf typecheck sees the old exports and reports "X is not exported from @workspace/db" even though the code is correct.

## How to apply
Whenever CI or local typecheck shows mysterious "not exported" errors from a lib package, run typecheck:libs first to rebuild declarations, then re-run the leaf check.
