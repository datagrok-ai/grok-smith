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

## Testing
- Use Vitest
- Test files co-located: `foo.ts` → `foo.test.ts`
- Server: test services (business logic), not routes
- Client: test complex hooks and utils, not simple components
