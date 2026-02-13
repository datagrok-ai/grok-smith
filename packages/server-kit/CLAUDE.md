# @datagrok/server-kit

Server harness for grok-smith apps. Provides standard middleware, routes, and a DB connection factory so app servers are ~10 lines of setup.

## What it provides

### `createApp(config)` — Hono app factory

Returns a Hono instance with everything pre-wired:
- CORS (configured for Vite dev server on localhost:5173)
- Request logging
- `X-Request-Id` injection (via `c.var.requestId`)
- Auth middleware: validates `X-User-Id` header as UUID, sets `c.var.userId`
- Error handler: catches `HTTPException` → `{ error, details? }` JSON
- `GET /api/health` — public, no auth required
- App routes registered via `config.configure(app)`

```ts
import { createApp } from '@datagrok/server-kit'
const app = createApp({
  name: 'my-app',
  configure: (app) => { app.route('/api', myRoutes) },
})
```

### `createDb({ schema })` — Drizzle connection factory

Reads `DATABASE_URL` from env (falls back to standard local dev URL). Returns a typed Drizzle client.

```ts
import { createDb } from '@datagrok/server-kit'
import * as schema from '../../shared/schema'
export const db = createDb({ schema })
```

### `authRoutes(db)` — `/api/auth/me` route

Returns current user from core `users` table. Requires a Drizzle DB instance. Not mounted by default in `createApp()` — apps opt in if they need it.

## Auth approach

The `X-User-Id` header is validated as a UUID and set on the Hono context. The `/api/health` endpoint is excluded from auth. This is intentionally simple — Datagrok provides real auth in plugin mode, so any session system built now would be throwaway. The middleware design allows swapping in real auth later without changing app code.

## Modifying this package

- Changes here affect all apps — test carefully
- Middleware order matters: request-id → auth → app routes
- The health endpoint must remain public (no auth)
- Run `npm run typecheck` from the repo root after changes
