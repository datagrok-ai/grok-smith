# Datagrok App Factory

You are building applications for the Datagrok platform — a browser-native analytics platform for pharma/biotech.

## Before starting any task
1. Read /docs/CODING.md and /docs/DATABASE.md and /docs/DESIGN.md (they are short)
2. Read the app-specific docs in the app you're working on: ./docs/DOMAIN.md, ./docs/ARCHITECTURE.md, ./docs/STATUS.md
3. Check ./docs/STATUS.md for what's already built

## Always
- Use @datagrok/app-kit components, never raw HTML or direct Shadcn imports
- Define types in /shared/schema.ts using Drizzle, derive Zod and TS types from it
- Include created_by and audit fields on all database tables
- Run `npm run typecheck` and `npm run lint` before considering a task done
- Keep shared/ as the single source of truth for types

## Never
- Use `any` type
- Add dependencies without checking if app-kit or an existing package already covers the need
- Modify shared/ types without considering impact on other code that imports them
- Skip Zod validation on API endpoints
- Hardcode colors, spacing, or other design tokens — use app-kit theme
