# /create-app — Full App Scaffolding & Implementation

Create a new Datagrok lightweight application from scratch. This skill scaffolds the app, then interactively builds out the domain model, database schema, server routes, and client pages — all following the monorepo's established conventions.

## Arguments

`/create-app <app-name>` — kebab-case app name (e.g., `compound-reg`, `batch-tracker`)

If no app name is provided, ask the user for one.

## Workflow

Execute these steps in order. After each major step, briefly confirm what was done before moving on.

### Step 1: Gather Requirements

Ask the user to describe the application in a few sentences:
- What does this app do?
- Who are the primary users?
- What are the main entities (the "things" users create and manage)?

Wait for the user's response before proceeding.

### Step 2: Run the Scaffolding Tool

```bash
npx tsx tools/create-app/index.ts <app-name>
```

This creates `apps/<app-name>/` with the standard template structure.

### Step 3: Create drizzle.config.ts

The template does not include a Drizzle Kit config. Create `apps/<app-name>/drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './shared/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://datagrok:datagrok_local@localhost:5433/datagrok_dev',
  },
})
```

### Step 4: Install Dependencies

```bash
npm install
```

Run from the repo root so the new workspace is linked.

### Step 5: Fill In Documentation

Based on the user's description from Step 1, write the four doc files under `apps/<app-name>/docs/`:

**VISION.md** — Purpose, target users, key capabilities, and what's out of scope for now.

**DOMAIN.md** — Core domain concepts and business rules. List each entity with a short description, its key fields, and relationships. Number business rules (BR-001, BR-002, etc.).

**ARCHITECTURE.md** — Fill in the Data Flow and API Design sections. List every planned REST endpoint (`GET /api/<resource>`, `POST /api/<resource>`, etc.). Keep the existing Stack and Integration Points sections.

**STATUS.md** — Mark "Project scaffolded" as done, leave the rest as TODO. List what's next.

### Step 6: Define shared/constants.ts

If the domain has status fields or enumerated values, define them in `apps/<app-name>/shared/constants.ts` following this pattern:

```ts
export const <ENTITY>_STATUS = ['draft', 'active', 'archived'] as const
export type <Entity>Status = (typeof <ENTITY>_STATUS)[number]
```

Use `as const` arrays and derived types. Never use `pgEnum`.

### Step 7: Define shared/schema.ts

Write the Drizzle schema in `apps/<app-name>/shared/schema.ts`. Follow these rules exactly:

**Imports:**
```ts
import { pgSchema, uuid, varchar, text, timestamp, integer, ... } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { z } from 'zod'
import { entities, users } from '@datagrok/core-schema'
```

**Schema namespace:**
```ts
export const appSchema = pgSchema('<app-name>')
```

**Entity tables** (top-level things users create/own) get full audit columns:
```ts
export const <table> = appSchema.table('<table_name>', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').references(() => entities.id),
  // ... domain columns ...
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid('created_by').notNull().references(() => users.id),
})
```

**Detail/child tables** (cascade-delete with parent) only need `id` and a FK to the parent:
```ts
export const <child> = appSchema.table('<child_name>', {
  id: uuid('id').primaryKey().defaultRandom(),
  <parentSingular>Id: uuid('<parent_singular>_id')
    .notNull()
    .references(() => <parent>.id, { onDelete: 'cascade' }),
  // ... domain columns ...
})
```

**Naming rules:**
- Tables: snake_case, plural (`compounds`, `batch_records`)
- Columns: snake_case (`created_at`, `mol_weight`)
- Foreign keys: `{referenced_table_singular}_id`
- All primary keys: UUID with `defaultRandom()`
- Status/enum columns: `varchar` + Zod validation, never `pgEnum`
- Timestamps: always `{ withTimezone: true }`

**After tables, export Zod schemas and TS types for every table:**
```ts
export const insert<Entity>Schema = createInsertSchema(<table>)
export const select<Entity>Schema = createSelectSchema(<table>)
export type Insert<Entity> = InferInsertModel<typeof <table>>
export type <Entity> = InferSelectModel<typeof <table>>
```

### Step 8: Generate and Run Migrations

```bash
npm run db:generate --workspace=apps/<app-name>
npm run db:migrate --workspace=apps/<app-name>
```

If the database is not running, skip the migrate step and tell the user they can run it later.

### Step 9: Build Server Routes

Create route files in `apps/<app-name>/server/routes/`, one file per main resource. Follow this pattern:

```ts
import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import { db } from '../db/client'
import { <table>, insert<Entity>Schema } from '../../shared/schema'

export const <resource>Route = new Hono()

// GET /<resource> — list all
<resource>Route.get('/<resource>', async (c) => {
  const rows = await db.select().from(<table>).orderBy(desc(<table>.createdAt))
  return c.json(rows)
})

// GET /<resource>/:id — get one
<resource>Route.get('/<resource>/:id', async (c) => {
  const [row] = await db.select().from(<table>).where(eq(<table>.id, c.req.param('id')))
  if (!row) throw new HTTPException(404, { message: '<Entity> not found' })
  return c.json(row)
})

// POST /<resource> — create
<resource>Route.post(
  '/<resource>',
  zValidator('json', insert<Entity>Schema.omit({ id: true, createdAt: true, updatedAt: true })),
  async (c) => {
    const body = c.req.valid('json')
    const [row] = await db.insert(<table>).values({ ...body, createdBy: c.var.userId }).returning()
    return c.json(row, 201)
  },
)

// DELETE /<resource>/:id — delete
<resource>Route.delete('/<resource>/:id', async (c) => {
  const [row] = await db.select({ id: <table>.id }).from(<table>).where(eq(<table>.id, c.req.param('id')))
  if (!row) throw new HTTPException(404, { message: '<Entity> not found' })
  await db.delete(<table>).where(eq(<table>.id, c.req.param('id')))
  return c.json({ success: true })
})
```

**Rules:**
- Always validate POST/PUT bodies with `zValidator` and the Zod schema from shared/schema.ts
- Use `c.var.userId` for the `createdBy` field (comes from server-kit auth middleware)
- Throw `HTTPException` for not-found and validation errors
- Return 201 for successful creates

### Step 10: Wire Routes into the Server

Update `apps/<app-name>/server/index.ts` to import and register all route files:

```ts
import { serve } from '@hono/node-server'
import { createApp } from '@datagrok/server-kit'

import { <resource>Route } from './routes/<resource>'

const app = createApp({
  name: '<AppNamePascal>',
  configure: (app) => {
    app.route('/api', <resource>Route)
  },
})

serve({ fetch: app.fetch, hostname: '0.0.0.0', port: 3000 })
```

### Step 11: Create Navigation

Create `apps/<app-name>/client/src/nav.ts`:

```ts
import type { NavItem } from '@datagrok/app-kit'

export const nav: NavItem[] = [
  { label: '<Entity List>', href: '/', icon: '<emoji>' },
  // Add one entry per page
]
```

### Step 12: Build Client Pages

Create page files in `apps/<app-name>/client/src/pages/`. Each page follows this structure:

**List page (home.tsx):**
```tsx
import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PageLayout,
  useApi,
  ApiRequestError,
  Button,
  Skeleton,
  Alert,
  AlertDescription,
  EmptyState,
  DataTable,
} from '@datagrok/app-kit'
import type { ColumnDef } from '@datagrok/app-kit'
import { nav } from '../nav'

// Define the row type inline or import from shared
interface <Entity>Row { ... }

export default function HomePage() {
  const api = useApi()
  // fetch data, define columns, render with DataTable
  return (
    <PageLayout title="<App Title>" nav={nav}>
      ...
    </PageLayout>
  )
}
```

**Detail/form page:**
```tsx
import { useParams } from 'react-router-dom'
import { PageLayout, useApi, Card, ... } from '@datagrok/app-kit'
import { nav } from '../nav'

export default function <Entity>Page() {
  const { id } = useParams()
  // fetch and display entity detail
  return (
    <PageLayout title="<Entity> Detail" nav={nav}>
      ...
    </PageLayout>
  )
}
```

**Component rules:**
- Always import from `@datagrok/app-kit`, never from Shadcn directly
- Use `PageLayout` as the outermost wrapper on every page, always pass `nav`
- Use `DataTable` for any tabular data with `ColumnDef<T>[]` for column definitions
- Use `useApi()` for all fetch calls — it prefixes `/api` and sends the auth header
- Use `EmptyState` for empty list views
- Use `Skeleton` for loading states
- Show toast on mutation success, inline error on failure
- Default sort: most recently created first
- Always show `createdAt` and `createdBy` in list views

### Step 13: Update Client Routing

Update `apps/<app-name>/client/src/App.tsx` to add routes for all new pages:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/home'
import <Entity>Page from './pages/<entity>'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/<entity>/:id" element={<<Entity>Page />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Step 14: Run Typecheck and Lint

```bash
npm run typecheck --workspace=apps/<app-name>
```

Fix any errors until the typecheck passes cleanly. If lint is configured:

```bash
npm run lint --workspace=apps/<app-name>
```

### Step 15: Update STATUS.md

Mark completed items in `apps/<app-name>/docs/STATUS.md`:
- [x] Project scaffolded
- [x] Database schema
- [x] API endpoints
- [x] UI pages

## Important Conventions

Read these files before generating any code:
- `/docs/CODING.md` — TypeScript, file naming, imports, error handling, project structure
- `/docs/DATABASE.md` — Table naming, required columns, migration rules
- `/docs/DESIGN.md` — Layout, forms, data display, colors, feedback patterns

**Always:**
- Use `@datagrok/app-kit` components, never raw HTML or direct Shadcn imports
- Use `createApp()` from `@datagrok/server-kit` for server setup
- Use `createDb()` from `@datagrok/server-kit` for DB connections
- Define types in `shared/schema.ts` using Drizzle, derive Zod and TS types from it
- Use `varchar` + Zod validation for status/enum columns, never `pgEnum`
- Use UUID primary keys, never auto-increment
- Named exports only (except React page components which use default export for routing)
- Strict TypeScript — no `any`, no unnecessary `as` assertions

**Never:**
- Hardcode colors, spacing, or design tokens — use app-kit theme CSS variables
- Hardcode database connection strings — use `DATABASE_URL` via `createDb()`
- Define local `SYSTEM_USER_ID` / `ADMIN_USER_ID` — import from `@datagrok/core-schema`
- Use `.then()` chains — use async/await everywhere
- Modify shared/ types without considering impact on other code
