# Datagrok App Factory

This is a harness for developing Datagrok lightweight applications, along with apps. The idea is to make
developing apps by AI a straightforward process. All apps share the same logical structure, same database approaches,
and they share a core database schema with users, groups, security, etc.

## Before starting any task
1. Read /docs/CODING.md and /docs/DATABASE.md and /docs/DESIGN.md (they are short)
2. Read the app-specific docs in the app you're working on: ./docs/DOMAIN.md, ./docs/ARCHITECTURE.md, ./docs/STATUS.md
3. Check ./docs/STATUS.md for what's already built

## Monorepo structure

```
packages/
  app-kit/           # Client UI components, theme, hooks (useApi, useCurrentUser)
  core-schema/       # Drizzle tables + types for core Datagrok entities, auditColumns() helper
  server-kit/        # Server harness: createApp(), createDb(), standard middleware & routes
apps/
  send/              # SEND nonclinical study app
tools/
  create-app/        # Scaffolding tool for new apps
```

## Shared infrastructure

- **Database**: All apps share one PostgreSQL instance (`datagrok_dev`). Core tables are auto-created by `packages/core-schema/sql/` mounted into Docker's init directory. App tables live in app-specific schemas (e.g. `send.*`).
- **DATABASE_URL**: `postgresql://datagrok:datagrok_local@localhost:5433/datagrok_dev` — defined in root `.env.example`, used everywhere.
- **Server setup**: Use `createApp()` from `@datagrok/server-kit` — provides CORS, logging, request-id, auth middleware, error handler, and `/api/health` + `/api/auth/me` routes out of the box.
- **DB connection**: Use `createDb({ schema })` from `@datagrok/server-kit` — reads `DATABASE_URL` from env.
- **Audit columns**: Use `auditColumns()` from `@datagrok/core-schema` on **entity tables** (top-level things users create/own) — returns `id`, `entity_id` (FK → `entities.id` for the privilege system), `created_at`, `updated_at`, `created_by` (FK → `users.id`). Detail/child tables that cascade-delete with a parent only need `id`.
- **Auth**: `X-User-Id` header validated as UUID by server-kit middleware, available as `c.var.userId` in Hono handlers.
- **Well-known UUIDs**: Import `SYSTEM_USER_ID`, `ADMIN_USER_ID` from `@datagrok/core-schema` — never define local copies.

## Always
- Use `<Shell>` + `<View>` from `@datagrok/app-kit` for app layout
- Use `<DataGrid>` from `@datagrok/app-kit` for all tabular data (powered by AG Grid Community)
- Use `@datagrok/app-kit` components, never raw HTML or direct Shadcn imports
- Use `createApp()` from `@datagrok/server-kit` for server setup, never manual Hono boilerplate
- Use `createDb()` from `@datagrok/server-kit` for DB connections
- Use `auditColumns()` from `@datagrok/core-schema` on entity tables (not on detail/child tables)
- Define types in `/shared/schema.ts` using Drizzle, derive Zod and TS types from it
- Run `npm run typecheck` and `npm run lint` before considering a task done
- Keep shared/ as the single source of truth for types

## Never
- Use `any` type
- Add dependencies without checking if app-kit, server-kit, or an existing package already covers the need
- Modify shared/ types without considering impact on other code that imports them
- Skip Zod validation on API endpoints
- Hardcode colors, spacing, or other design tokens — use app-kit theme
- Use `pgEnum()` — use `varchar` + Zod validation instead (pgEnum leaks into public schema)
- Define local `SYSTEM_USER_ID` / `ADMIN_USER_ID` constants — import from `@datagrok/core-schema`
- Hardcode database connection strings — use `DATABASE_URL` env var via `createDb()`
- Deprecate code — just delete it. No `@deprecated`, no backwards-compat shims. We iterate quickly with no external consumers.
