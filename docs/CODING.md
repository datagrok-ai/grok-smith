# Coding Conventions

## TypeScript
- Strict mode, no `any`, no `as` type assertions unless unavoidable (add comment explaining why)
- Use `type` for data shapes, `interface` for things that can be extended
- Async/await everywhere, never `.then()` chains
- Named exports only, no default exports (except React page components for routing)

## File Naming
- Files: kebab-case (`compound-form.tsx`, `audit-service.ts`)
- React components: PascalCase export, kebab-case file
- One component per file for anything non-trivial

## Imports
- Order: node builtins → external packages → @datagrok/app-kit → relative imports
- Use `type` imports for type-only imports: `import type { Compound } from '...'`

## Error Handling
- Server: throw `HTTPException` from Hono with structured error body `{ error: string, details?: Record<string, string> }`
- Client: all API calls go through a shared `api` client that handles errors uniformly
- Never swallow errors silently

## Project Structure (per app)
- `/shared/` — Drizzle schema, Zod schemas, derived types, constants. Imported by both client and server.
- `/client/src/pages/` — route-level components
- `/client/src/components/` — reusable UI within this app
- `/client/src/hooks/` — custom React hooks
- `/server/routes/` — Hono route handlers, one file per resource
- `/server/services/` — business logic, called by routes
- `/server/db/` — Drizzle client, migrations

## Removing Code
- Do not deprecate — just delete. We iterate quickly and there are no external consumers.
- When replacing a component/module, remove the old one in the same PR. No `@deprecated` annotations, no re-exports for backwards compatibility.

## Testing
- **Runner**: Vitest v3, configured via `vitest.config.ts` in root + each package/app
- **Test files**: co-located — `foo.ts` → `foo.test.ts`
- **Run**: `npm test` (root runs all), or `npm test --workspace=packages/server-kit` (single package)
- **Shared helpers**: `@datagrok/test-utils` provides `createTestHeaders()`, `renderWithProviders()`, `createTestDb()`, `withTestTransaction()`, and permission fixtures
- **Server tests**: use Hono `app.request()` — no HTTP server needed. Example:
  ```ts
  const res = await app.request('/api/test', { headers: createTestHeaders() })
  ```
- **Client tests**: use `renderWithProviders()` from test-utils — wraps component in `DatagrokProvider` with mock context. Environment is `jsdom` (set per-package in vitest config, or per-file with `// @vitest-environment jsdom`)
- **DB tests**: use `createTestDb()` and `withTestTransaction()` for isolated, auto-rolled-back database tests
- Server: test middleware and services, not boilerplate
- Client: test complex hooks and utils, not simple components
