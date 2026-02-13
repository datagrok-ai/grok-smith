# @datagrok/core-schema

Shared Drizzle ORM schema for the 15 core Datagrok tables that grok-smith apps reference
via foreign keys (e.g. `created_by → users.id`).

## Tables

| Group | Tables |
|-------|--------|
| Identity & Auth | `entity_types`, `entities`, `groups`, `users`, `users_sessions`, `groups_relations` |
| Permissions | `entity_types_permissions`, `permissions` |
| Projects | `projects`, `project_relations`, `project_relations_all` |
| Entity Properties | `entity_properties`, `entity_property_schemas`, `properties_schemas`, `entity_types_schemas` |

## Usage

```ts
import { users, groups, projects, SYSTEM_USER_ID, ADMIN_USER_ID } from '@datagrok/core-schema'
```

### auditColumns() helper

Use on **entity tables** — top-level things users create and own (studies, compounds, projects). Returns `id`, `entity_id` (FK → `entities.id` for the privilege system), `created_at`, `updated_at`, `created_by` (FK → `users.id`):

```ts
import { auditColumns } from '@datagrok/core-schema'

export const studies = appSchema.table('studies', {
  ...auditColumns(),
  title: varchar('title', { length: 500 }).notNull(),
})
```

**Do not use on detail/child tables** (findings, trial_arms, exposures, etc.) that cascade-delete with a parent entity. Those only need `id` — the parent tracks ownership.

### Well-known UUIDs

Always import from this package — never define local copies:

- `SYSTEM_USER_ID` — `3e32c5fa-ac9c-4d39-8b4b-4db3e576b3c3`
- `ADMIN_USER_ID` — `878c42b0-9a50-11e6-c537-6bf8e9ab02ee`

## Deployment modes

| Mode | Core tables | App tables |
|------|-------------|------------|
| **Standalone** | Created by `sql/01-core-tables.sql` + seeded by `sql/02-core-seed.sql` (auto-mounted into Docker) | Created by app's Drizzle migrations |
| **Integrated** | Already exist in the Datagrok PostgreSQL database | Created by app's Drizzle migrations |

## Updating

When `core/server/db/init_db.sql` changes columns for any of the 15 tables:

1. Update `src/schema.ts` (Drizzle table definition)
2. Update `src/relations.ts` if FK structure changed
3. Update `sql/01-core-tables.sql` (raw DDL)
4. Update `sql/02-core-seed.sql` if seed data changed
5. Update `src/helpers.ts` if audit column conventions change
6. Run `npm run typecheck` from grok-smith root

## Source of truth

- Column types and constraints: `core/server/db/init_db.sql`
- Well-known UUIDs: `core/server/db/create_system.sql`, `create_admin.sql`
- Entity type IDs: `core/shared/grok_shared/lib/src/entity.dart`
- Permission IDs: `core/shared/grok_shared/lib/src/privileges.dart`
