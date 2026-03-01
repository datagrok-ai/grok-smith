# Entity Permissions System — Implementation Handoff

> **For:** Claude Code agent implementing this feature in `datagrok-ai/grok-smith`
> **Context:** Read this document fully before writing any code. It is the result of an extensive
> architecture/design session between the CEO and an architect. Every decision here was made
> deliberately. Do not deviate from the design without discussing with the user first.

---

## 1. What We're Building

A centralized entity permission system for grok-smith — the Datagrok app factory. Apps (SEND,
MolTrack, inventory, plate management, etc.) ship database tables. Some tables are "entities"
that need row-level access control. The permission system must be:

- **Central** — permission logic lives in `server-kit`, not in each app
- **Invisible to app developers** — apps write near-standard ORM queries; permissions are injected by middleware
- **Compatible with Datagrok's model** — groups, roles, recursive hierarchy, entity types, privileges
- **AI-agent friendly** — the API surface must be familiar (Prisma-shaped) so Claude Code agents building future apps get it right without special training

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  App (e.g., SEND)                                           │
│  shared/schema.ts  ← Drizzle schema (source of truth)      │
│  server/           ← Hono routes, uses db.entity.*          │
│  client/           ← React, calls server routes             │
│                                                             │
│  Agent-written code uses Prisma-shaped API:                 │
│    db.entity.sendStudies.findMany({ where: {...} })         │
│    db.entity.sendStudies.create({ data: {...} })            │
│                                                             │
│  For non-entity tables (lookups, config), use raw Drizzle:  │
│    db.select().from(species).where(...)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  server-kit middleware (THE PERMISSION LAYER)                │
│                                                             │
│  On reads:  injects WHERE entity_id IN (visible_entities)   │
│  On create: wraps in transaction — creates entities row     │
│             (trigger grants permissions), then domain row   │
│  On update: checks Edit permission, then executes           │
│  On delete: checks Delete permission, then deletes          │
│             entities row (CASCADE cleans up)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL                                                  │
│                                                             │
│  Core tables: entities, entity_types, groups,                │
│    groups_relations, entity_types_permissions, permissions   │
│                                                             │
│  Trigger: on_entity_created → auto-grants all permissions   │
│           for that entity type to the creator's group        │
│                                                             │
│  Plugin tables: send_studies, compounds, plates, etc.        │
│    (each has entity_id UUID REFERENCES entities(id))         │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions (DO NOT CHANGE)

1. **No projects layer.** Datagrok uses wrapper projects for indirect permission grants.
   We deliberately removed this for simplicity. Permissions are granted directly on entities.
   Projects will be added back later as an additive feature. Design the permission CTE so
   that adding a project_relations join later is straightforward (i.e., keep the permission
   check in a clearly isolated function/CTE).

2. **Prisma-shaped API over Drizzle internals.** The `db.entity.*` API uses Prisma's
   `findMany`/`create`/`update`/`delete` shape because AI agents know it from training data.
   Under the hood, it compiles to Drizzle queries. App developers never import Prisma.

3. **Entity tables identified by convention.** Any Drizzle table with an `entity_id` column
   that references `public.entities(id)` is an entity table. No explicit registration needed.
   The middleware detects this by introspecting the Drizzle schema at startup.

4. **Trigger-based permission grants on entity creation.** A Postgres trigger on the
   `entities` table auto-inserts permission rows for the creator. This keeps the middleware
   simple (just two inserts in a transaction) and ensures the invariant is never violated.

5. **CASCADE-based cleanup on delete.** `permissions.entity_id` has `ON DELETE CASCADE`.
   Deleting the `entities` row cleans up all permissions automatically.

---

## 3. Database Schema

Create a migration for these tables. They all live in the `public` schema.
Follow existing grok-smith conventions from `docs/DATABASE.md` (snake_case, UUID PKs,
audit columns, etc.).

### 3.1 entity_types

Registers what kinds of entities exist. Seeded with initial types; apps register more.

```sql
CREATE TABLE entity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,            -- 'Study', 'Compound', 'Plate', etc.
  is_package_entity BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.2 entities

Central registry. Every permissioned object gets a row here.

```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type_id UUID NOT NULL REFERENCES entity_types(id),
  created_by_group_id UUID NOT NULL REFERENCES groups(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_entities_type ON entities(entity_type_id);
CREATE INDEX idx_entities_created_by ON entities(created_by_group_id);
```

### 3.3 groups

Users, roles, organizational units. Every user has a personal group.

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_personal BOOLEAN NOT NULL DEFAULT false,
  is_role BOOLEAN NOT NULL DEFAULT false,
  is_admin_group BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.4 groups_relations

DAG hierarchy. A group can have multiple parents.

```sql
CREATE TABLE groups_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, parent_id)
);

CREATE INDEX idx_groups_relations_child ON groups_relations(child_id);
CREATE INDEX idx_groups_relations_parent ON groups_relations(parent_id);
```

### 3.5 entity_types_permissions

Defines what privileges exist, per entity type or globally.

```sql
CREATE TABLE entity_types_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                   -- 'View', 'Edit', 'Delete', 'Share', 'Execute', etc.
  entity_type_id UUID REFERENCES entity_types(id), -- NULL = global privilege
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, entity_type_id)
);
```

### 3.6 permissions

Actual permission grants. The core of the system.

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,  -- NULL = global privilege grant
  user_group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES entity_types_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_id, user_group_id, permission_id)
);

CREATE INDEX idx_permissions_entity ON permissions(entity_id);
CREATE INDEX idx_permissions_group ON permissions(user_group_id);
CREATE INDEX idx_permissions_entity_group ON permissions(entity_id, user_group_id);
```

### 3.7 users table linkage

The system needs a `users` table that links to personal groups. If grok-smith already has a
users table, add a `personal_group_id` FK. If not, create one:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  personal_group_id UUID NOT NULL UNIQUE REFERENCES groups(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.8 Trigger: auto-grant permissions on entity creation

```sql
CREATE OR REPLACE FUNCTION on_entity_created()
RETURNS TRIGGER AS $$
DECLARE
  perm RECORD;
BEGIN
  -- Grant all permissions for this entity type to the creator's personal group
  FOR perm IN
    SELECT id FROM entity_types_permissions
    WHERE entity_type_id = NEW.entity_type_id
  LOOP
    INSERT INTO permissions (id, entity_id, user_group_id, permission_id)
    VALUES (gen_random_uuid(), NEW.id, NEW.created_by_group_id, perm.id);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_entity_created
  AFTER INSERT ON entities
  FOR EACH ROW EXECUTE FUNCTION on_entity_created();
```

### 3.9 Seed Data

```sql
-- Standard permissions that apply to ALL entity types
-- (entity_type_id = NULL means "for every entity type")
-- NOTE: You may also want to insert type-specific permissions per entity type.
-- The standard four should be inserted for each entity type when the type is registered.
-- Keeping a set with entity_type_id = NULL is useful for global privilege checks.

-- Insert default entity types (extend as apps are added)
INSERT INTO entity_types (id, name, is_package_entity) VALUES
  (gen_random_uuid(), 'Study', true),
  (gen_random_uuid(), 'Compound', true),
  (gen_random_uuid(), 'Plate', true);

-- For EACH entity type, insert the four standard permissions:
-- (Run this in a loop or use a function; shown here for Study as example)
DO $$
DECLARE
  et RECORD;
  perms TEXT[] := ARRAY['View', 'Edit', 'Delete', 'Share'];
  p TEXT;
BEGIN
  FOR et IN SELECT id FROM entity_types LOOP
    FOREACH p IN ARRAY perms LOOP
      INSERT INTO entity_types_permissions (id, name, entity_type_id)
      VALUES (gen_random_uuid(), p, et.id)
      ON CONFLICT (name, entity_type_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Admin group
INSERT INTO groups (id, name, is_admin_group) VALUES
  (gen_random_uuid(), 'Administrators', true);

-- "All Users" group (every personal group is a child of this)
INSERT INTO groups (id, name) VALUES
  (gen_random_uuid(), 'All Users');
```

---

## 4. Permission Engine (server-kit)

### 4.1 Core SQL: Recursive Group Resolution

This CTE resolves all groups a user belongs to (directly or through hierarchy):

```typescript
// packages/server-kit/src/permissions/group-resolution.ts

/**
 * Returns a SQL fragment (as a Drizzle sql`` template) that produces
 * a CTE named `user_groups` containing all group IDs the given user
 * belongs to (personal group + all ancestors).
 */
export function userGroupsCTE(userGroupId: string) {
  return sql`
    WITH RECURSIVE user_groups(id) AS (
      SELECT ${userGroupId}::uuid
      UNION ALL
      SELECT r.parent_id
      FROM user_groups ug
      INNER JOIN groups_relations r ON r.child_id = ug.id
    )
  `;
}
```

### 4.2 Core SQL: Permission Check

```typescript
// packages/server-kit/src/permissions/check.ts

/**
 * Check if a user can perform a specific action on a specific entity.
 * Returns true/false.
 */
export async function canDo(
  tx: DrizzleTransaction,
  userGroupId: string,
  entityId: string,
  permissionName: string,
  entityTypeName: string
): Promise<boolean> {
  const result = await tx.execute(sql`
    WITH RECURSIVE user_groups(id) AS (
      SELECT ${userGroupId}::uuid
      UNION ALL
      SELECT r.parent_id
      FROM user_groups ug
      INNER JOIN groups_relations r ON r.child_id = ug.id
    )
    SELECT EXISTS(
      SELECT 1
      FROM permissions p
      INNER JOIN entity_types_permissions etp ON etp.id = p.permission_id
      INNER JOIN entity_types et ON et.id = etp.entity_type_id
      WHERE p.entity_id = ${entityId}::uuid
        AND etp.name = ${permissionName}
        AND et.name = ${entityTypeName}
        AND p.user_group_id IN (SELECT id FROM user_groups)
    ) AS has_permission
  `);
  return result.rows[0]?.has_permission ?? false;
}
```

### 4.3 Core SQL: Visible Entity IDs

```typescript
// packages/server-kit/src/permissions/visibility.ts

/**
 * Returns a SQL subquery that produces entity IDs visible to the user
 * for a given entity type. Used to inject into WHERE clauses.
 */
export function visibleEntitiesSql(userGroupId: string, entityTypeName: string) {
  return sql`
    SELECT p.entity_id
    FROM permissions p
    INNER JOIN entity_types_permissions etp ON etp.id = p.permission_id
    INNER JOIN entity_types et ON et.id = etp.entity_type_id
    WHERE etp.name = 'View'
      AND et.name = ${entityTypeName}
      AND p.user_group_id IN (
        WITH RECURSIVE user_groups(id) AS (
          SELECT ${userGroupId}::uuid
          UNION ALL
          SELECT r.parent_id
          FROM user_groups ug
          INNER JOIN groups_relations r ON r.child_id = ug.id
        )
        SELECT id FROM user_groups
      )
  `;
}
```

---

## 5. Prisma-Shaped API (`db.entity`)

This is the developer-facing API. It lives in `server-kit` and is consumed by app servers.

### 5.1 API Surface

The `db.entity` object provides accessors for each entity table, auto-discovered from the
Drizzle schema. Each accessor exposes Prisma-shaped methods:

```typescript
// What app developers (and AI agents) write:

// READ — findMany
const studies = await db.entity.sendStudies.findMany({
  where: {
    species: 'rat',
    phase: { in: ['Phase I', 'Phase II'] },
    createdAt: { gte: new Date('2024-01-01') },
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
  skip: 0,
});

// READ — findUnique
const study = await db.entity.sendStudies.findUnique({
  where: { id: 'some-uuid' },
});

// READ — findFirst
const latest = await db.entity.sendStudies.findFirst({
  where: { species: 'rat' },
  orderBy: { createdAt: 'desc' },
});

// READ — count
const total = await db.entity.sendStudies.count({
  where: { species: 'rat' },
});

// CREATE — single
const study = await db.entity.sendStudies.create({
  data: {
    studyName: 'ABC-001',
    species: 'rat',
    protocol: 'Some protocol',
  },
});

// CREATE — batch
const studies = await db.entity.sendStudies.createMany({
  data: [
    { studyName: 'ABC-001', species: 'rat' },
    { studyName: 'ABC-002', species: 'mouse' },
  ],
});

// UPDATE — single
const updated = await db.entity.sendStudies.update({
  where: { id: 'some-uuid' },
  data: { species: 'mouse' },
});

// UPDATE — batch
const count = await db.entity.sendStudies.updateMany({
  where: { species: 'rat' },
  data: { species: 'mouse' },
});

// DELETE — single
await db.entity.sendStudies.delete({
  where: { id: 'some-uuid' },
});

// DELETE — batch
await db.entity.sendStudies.deleteMany({
  where: { species: 'rat' },
});
```

### 5.2 Where Clause Operators

Support these Prisma where operators (start with this set, extend later if needed):

```typescript
// Exact match (implicit)
{ species: 'rat' }                        // species = 'rat'

// Comparison operators
{ count: { gt: 10 } }                     // count > 10
{ count: { gte: 10 } }                    // count >= 10
{ count: { lt: 100 } }                    // count < 100
{ count: { lte: 100 } }                   // count <= 100
{ name: { not: 'ABC' } }                  // name != 'ABC'

// List operators
{ phase: { in: ['Phase I', 'Phase II'] } }    // phase IN (...)
{ phase: { notIn: ['Phase III'] } }            // phase NOT IN (...)

// String operators
{ name: { contains: 'ABC' } }             // name LIKE '%ABC%'
{ name: { startsWith: 'ABC' } }           // name LIKE 'ABC%'
{ name: { endsWith: '001' } }             // name LIKE '%001'

// Null checks
{ protocol: null }                         // protocol IS NULL
{ protocol: { not: null } }               // protocol IS NOT NULL

// Logical combinators
{ AND: [{ species: 'rat' }, { phase: 'Phase I' }] }
{ OR: [{ species: 'rat' }, { species: 'mouse' }] }
{ NOT: { species: 'rat' } }
```

### 5.3 Additional Options

```typescript
// orderBy — single or multiple
{ orderBy: { createdAt: 'desc' } }
{ orderBy: [{ species: 'asc' }, { createdAt: 'desc' }] }

// Pagination
{ take: 50, skip: 100 }

// Select specific columns (default: all visible columns)
{ select: { studyName: true, species: true } }

// Include permission info per row
// This adds a _permissions field to each returned object
{ includePermissions: true }
// Returns: { ...data, _permissions: { canEdit: true, canDelete: false, canShare: true } }
```

### 5.4 Relations / Joins (`include`)

> **IMPLEMENTATION NOTE:** Ship without `include` support first (Phase 1). Apps do multiple
> flat queries in the meantime. Add `include` in a follow-up pass — everything below is the
> target design, not the initial implementation.

Three join scenarios exist, each with different permission semantics:

| Join Type | Example | Permission Behavior |
|-----------|---------|-------------------|
| Entity → Lookup | Study → Species list | No filtering on lookup side |
| Entity → Entity | Study → Subjects | Visibility CTE applied to BOTH sides |
| Entity → Detail | Study → StudyMetadata (1:1, not an entity) | No filtering on detail side |

The middleware distinguishes these by checking whether the target table has an `entity_id`
column. If yes, it's an entity table and gets permission-filtered. If no, it's a plain join.

**Relation definitions come from standard Drizzle `relations()`:**

```typescript
// shared/schema.ts — define relations the standard Drizzle way
export const sendStudiesRelations = relations(sendStudies, ({ many, one }) => ({
  subjects: many(sendSubjects),
  protocol: one(protocols, {
    fields: [sendStudies.protocolId],
    references: [protocols.id],
  }),
}));

export const sendSubjectsRelations = relations(sendSubjects, ({ one, many }) => ({
  study: one(sendStudies, {
    fields: [sendSubjects.studyEntityId],
    references: [sendStudies.entityId],
  }),
  findings: many(sendFindings),
}));
```

**Client usage — Prisma-shaped `include`:**

```typescript
// Entity → Lookup (no permissions on lookup side)
const studies = await db.entity.sendStudies.findMany({
  where: { species: 'rat' },
  include: {
    protocol: true,           // lookup table — plain join, no permission check
  },
});
// Returns: { id, studyName, species, protocol: { id, name, version } }

// Entity → Entity (permissions applied to BOTH sides)
const studies = await db.entity.sendStudies.findMany({
  where: { phase: 'Phase I' },
  include: {
    subjects: {               // entity table — permission-filtered automatically
      where: { sex: 'M' },   // domain filter ON TOP of permission filter
      orderBy: { subjectId: 'asc' },
      take: 100,
    },
  },
});
// Returns only studies you can View, with only subjects you can View

// Deep nesting: Entity → Entity → Entity
const studies = await db.entity.sendStudies.findMany({
  include: {
    subjects: {
      include: {
        findings: {           // also entity — also permission-filtered
          where: { domain: 'BW' },
        },
      },
    },
  },
  includePermissions: true,
});

// Selecting specific fields from relations
const studies = await db.entity.sendStudies.findMany({
  select: {
    studyName: true,
    species: true,
    subjects: {
      select: {
        subjectId: true,
        sex: true,
      },
    },
  },
});
```

**Phase 1 workaround (before `include` is implemented):**

Apps that need related data do two sequential queries. Both are permission-filtered
independently. This is correct, simple, and agent-friendly:

```typescript
// ✅ Phase 1 approach — two flat queries, both permission-aware
const studies = await db.entity.sendStudies.findMany({
  where: { phase: 'Phase I' },
});

const subjects = await db.entity.sendSubjects.findMany({
  where: {
    studyEntityId: { in: studies.map(s => s.entityId) },
    sex: 'M',
  },
  orderBy: { subjectId: 'asc' },
});
```

This pattern should be documented in CLAUDE.md as the standard approach until `include`
is shipped.

### 5.5 Implementation Strategy

The `db.entity` accessor is built at server startup by introspecting the Drizzle schema:

```typescript
// packages/server-kit/src/entity-db/create-entity-db.ts

import { getTableConfig } from 'drizzle-orm/pg-core';

/**
 * Scans all tables in the Drizzle schema. For each table that has an
 * `entity_id` column referencing `entities(id)`, creates a Prisma-shaped
 * accessor with permission-aware CRUD methods.
 *
 * Returns an object like:
 *   { sendStudies: { findMany, findUnique, create, update, delete, ... } }
 *
 * The property name is the camelCase version of the Drizzle table variable name.
 */
export function createEntityDb(
  drizzleDb: DrizzleDatabase,
  schema: Record<string, Table>,
  getUserContext: () => UserContext  // provides current user's personalGroupId
): EntityDb {
  const entityTables = new Map<string, EntityTableConfig>();

  for (const [name, table] of Object.entries(schema)) {
    const config = getTableConfig(table);
    const entityIdCol = config.columns.find(c => c.name === 'entity_id');
    if (entityIdCol) {
      // This is an entity table — look up its entity type name
      entityTables.set(name, {
        table,
        tableName: config.name,  // SQL table name (snake_case)
        accessorName: name,       // JS variable name (camelCase)
        columns: config.columns,
      });
    }
  }

  // Build the accessor object
  const entity: Record<string, EntityAccessor> = {};
  for (const [name, config] of entityTables) {
    entity[name] = createEntityAccessor(drizzleDb, config, getUserContext);
  }

  return entity as EntityDb;
}
```

The `createEntityAccessor` function builds each method (`findMany`, `create`, etc.) by:

1. **Translating** the Prisma-shaped where/orderBy/select into Drizzle query builder calls
2. **Injecting** the visibility filter (for reads) or permission check (for writes)
3. **Wrapping** creates in a transaction that inserts the `entities` row first
4. **Wrapping** deletes in a transaction that removes the `entities` row (CASCADE handles the rest)

### 5.5 User Context

The middleware needs to know who the current user is. This comes from Hono's context:

```typescript
// In app's server/index.ts (or server-kit's auth middleware)

app.use('*', async (c, next) => {
  const user = await authenticateRequest(c);
  const db = createSecureDb(drizzleInstance, schema, () => ({
    userId: user.id,
    personalGroupId: user.personalGroupId,
  }));
  c.set('db', db);
  await next();
});

// In route handlers:
app.get('/api/studies', async (c) => {
  const db = c.get('db');
  const studies = await db.entity.sendStudies.findMany({
    where: { species: c.req.query('species') },
    orderBy: { createdAt: 'desc' },
    take: 50,
    includePermissions: true,
  });
  return c.json(studies);
});
```

The `createSecureDb` function returns an object that has both:
- `db.entity.*` — the Prisma-shaped permission-aware accessors
- All standard Drizzle methods (`db.select()`, `db.insert()`, etc.) — for non-entity tables

---

## 6. Permission Management API Routes

In addition to the entity CRUD (which goes through `db.entity`), server-kit exposes explicit
routes for managing permissions. These live under `/api/privileges/`.

### 6.1 Routes

```
GET  /api/privileges/global
  → Returns all global privileges and whether the current user has them.

GET  /api/privileges/entity-types
  → Returns all registered entity types with their available permissions.

POST /api/privileges/check
  Body: { entityId: string, permissionName: string, entityTypeName: string }
  → Returns { allowed: boolean }

POST /api/privileges/check-batch
  Body: { checks: Array<{ entityId, permissionName, entityTypeName }> }
  → Returns { results: Array<{ entityId, permissionName, allowed }> }

POST /api/privileges/grant
  Body: { entityId: string, permissionName: string, entityTypeName: string, groupId: string }
  → Requires 'Share' permission on the entity. Creates a permission row.

POST /api/privileges/revoke
  Body: { entityId: string, permissionName: string, entityTypeName: string, groupId: string }
  → Requires 'Share' permission on the entity. Deletes the permission row.

GET  /api/privileges/entity/:entityId/permissions
  → Returns all permission grants for an entity (requires 'Share' permission to see).
```

### 6.2 Entity Type Registration

Apps register their entity types at startup. Provide a utility:

```typescript
// packages/server-kit/src/permissions/register-entity-type.ts

/**
 * Registers an entity type if it doesn't exist.
 * Creates the standard View/Edit/Delete/Share permissions for it.
 * Idempotent — safe to call on every app startup.
 *
 * @param name - Entity type name, e.g., 'Study'
 * @param additionalPermissions - Extra permissions beyond the standard four,
 *        e.g., ['Execute', 'Approve'] for workflow-enabled entities
 */
export async function registerEntityType(
  db: DrizzleDatabase,
  name: string,
  additionalPermissions?: string[]
): Promise<void>;
```

---

## 7. Client-Side SDK (app-core)

The client package (`packages/app-core`) provides typed helpers for calling the server.

### 7.1 Permission Hooks

```typescript
// packages/app-core/src/hooks/usePermissions.ts

/**
 * Check if current user can perform an action on a specific entity.
 * Uses SWR/React Query for caching.
 */
export function useCanDo(entityId: string, permission: string): {
  allowed: boolean;
  isLoading: boolean;
};

/**
 * Get all permissions the current user has on an entity.
 * Useful for conditionally rendering UI actions.
 */
export function useEntityPermissions(entityId: string): {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  isLoading: boolean;
};
```

### 7.2 Permission-Aware UI Patterns

Document these patterns in app-kit or CLAUDE.md so AI agents use them:

```tsx
// Pattern: Conditional action buttons based on permissions
function StudyActions({ study }: { study: StudyWithPermissions }) {
  // When includePermissions: true was used in the query,
  // each row has _permissions attached
  const { _permissions: perms } = study;

  return (
    <DropdownMenu>
      <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
      {perms.canEdit && <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>}
      {perms.canDelete && <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>}
      {perms.canShare && <DropdownMenuItem onClick={onShare}>Share</DropdownMenuItem>}
    </DropdownMenu>
  );
}
```

---

## 8. Error Handling

Define a clear error type for permission failures:

```typescript
// packages/server-kit/src/permissions/errors.ts

export class PermissionDeniedError extends Error {
  constructor(
    public readonly entityId: string,
    public readonly requiredPermission: string,
    public readonly entityTypeName?: string,
  ) {
    super(`Permission denied: requires '${requiredPermission}' on entity ${entityId}`);
    this.name = 'PermissionDeniedError';
  }
}
```

In Hono error handler, catch this and return 403:

```typescript
app.onError((err, c) => {
  if (err instanceof PermissionDeniedError) {
    return c.json({
      error: 'permission_denied',
      message: err.message,
      entityId: err.entityId,
      requiredPermission: err.requiredPermission,
    }, 403);
  }
  // ... other error handling
});
```

For reads, permission filtering is silent (invisible rows just don't appear). For writes,
permission failures throw `PermissionDeniedError` with a 403 response. This distinction is
deliberate — reads should never reveal the existence of entities the user can't see.

---

## 9. File Organization

```
packages/
  server-kit/
    src/
      permissions/
        group-resolution.ts      ← recursive group CTE builder
        check.ts                 ← canDo() function
        visibility.ts            ← visibleEntitiesSql() function
        grant.ts                 ← grant/revoke logic
        register-entity-type.ts  ← entity type + permission seeding
        errors.ts                ← PermissionDeniedError
        types.ts                 ← TypeScript interfaces
      entity-db/
        create-entity-db.ts      ← schema introspection, accessor builder
        entity-accessor.ts       ← findMany/create/update/delete impl
        where-compiler.ts        ← Prisma where → Drizzle SQL compiler
        orderby-compiler.ts      ← orderBy → Drizzle SQL compiler
        select-compiler.ts       ← select → Drizzle SQL compiler
        types.ts                 ← Prisma-shaped type definitions
      routes/
        privileges.ts            ← /api/privileges/* Hono routes
      middleware/
        auth.ts                  ← user context extraction (if not existing)
      db/
        migrations/
          XXXX_entity_permissions.sql  ← the migration
        schema/
          permissions.ts         ← Drizzle schema for permission tables
          seed.ts                ← seed data

  app-core/
    src/
      hooks/
        usePermissions.ts        ← useCanDo, useEntityPermissions
      api/
        privileges.ts            ← client-side API calls to /api/privileges/*
```

---

## 10. Implementation Order

Do these in order. Each step should be a working, testable increment.

### Step 1: Database schema + migration
- Create Drizzle schema definitions for all permission tables (section 3)
- Generate and run migration
- Create seed data (admin group, All Users group, standard permissions)
- Create the trigger function and trigger

### Step 2: Permission engine functions
- Implement `userGroupsCTE` (group resolution)
- Implement `canDo` (single permission check)
- Implement `visibleEntitiesSql` (visibility filter for reads)
- Write tests with a small group hierarchy (user → team → org → admin)

### Step 3: Entity DB — read operations
- Implement `createEntityDb` (schema introspection)
- Implement `where-compiler.ts` (Prisma where → Drizzle SQL)
- Implement `findMany` with visibility filter injection
- Implement `findUnique`, `findFirst`, `count`
- Implement `orderBy` and `select` compilation
- Implement `includePermissions` option
- Write tests: user A can see their entities, cannot see user B's

### Step 4: Entity DB — write operations
- Implement `create` (transaction: entities row → trigger → domain row)
- Implement `createMany` (batch variant)
- Implement `update` and `updateMany` (permission check → execute)
- Implement `delete` and `deleteMany` (permission check → CASCADE)
- Write tests: permission denied on unauthorized writes

### Step 5: API routes
- Implement `/api/privileges/*` routes (section 6)
- Implement `registerEntityType` utility
- Wire up error handling (PermissionDeniedError → 403)

### Step 6: Client SDK
- Implement `useCanDo` and `useEntityPermissions` hooks
- Implement client-side API helpers for `/api/privileges/*`

### Step 7: Retrofit SEND app
- Register 'Study' entity type on SEND server startup
- Replace direct Drizzle queries in SEND routes with `db.entity.sendStudies.*`
- Add `includePermissions: true` to list queries
- Update UI to conditionally render actions based on permissions
- Verify: create a study as user A, confirm user B cannot see/edit/delete it

---

## 11. Testing Strategy

### Unit tests (no DB)
- Where compiler: Prisma where → SQL for all operator combinations
- OrderBy compiler: single, multiple, nested
- Select compiler: projection

### Integration tests (with DB)
- Group hierarchy resolution: user in nested groups sees correct effective permissions
- Entity creation: entities row + permissions created in single transaction
- Visibility: user A's entities invisible to user B
- Permission check: Edit/Delete/Share correctly enforced
- Grant/revoke: granting View to user B makes entity visible
- CASCADE: deleting entity removes all permission rows
- Trigger: new entity auto-gets all permissions for creator

### Scenario tests
- Multi-tenant: two users, each creates entities, neither sees the other's
- Admin: admin group member can see/edit all entities
- Sharing: user A shares entity with user B (View only), B can see but not edit
- Role: create a "Viewer" role with only View permission, assign to group, verify

---

## 12. CLAUDE.md Additions

Add these rules to the project's CLAUDE.md so future AI agents follow the patterns:

```markdown
## Entity Permissions

### Entity Tables
Any table with `entity_id UUID REFERENCES public.entities(id)` is an entity table.
Entity tables get automatic row-level permission filtering.

### Querying Entity Tables
ALWAYS use `db.entity.<tableName>` for entity tables. NEVER query entity tables
directly with `db.select().from(...)` — this bypasses permission checks.

```typescript
// ✅ CORRECT — uses permission-aware accessor
const studies = await db.entity.sendStudies.findMany({
  where: { species: 'rat' },
  orderBy: { createdAt: 'desc' },
});

// ❌ WRONG — bypasses permission checks
const studies = await db.select().from(sendStudies).where(eq(sendStudies.species, 'rat'));
```

### Non-Entity Tables
For tables WITHOUT entity_id (lookup tables, config, etc.), use standard Drizzle:

```typescript
// ✅ CORRECT — lookup tables use regular Drizzle
const speciesList = await db.select().from(species);
```

### Creating Entities
Use `db.entity.<tableName>.create()`. Do NOT manually insert into the `entities` table.
The middleware handles entity creation, project setup, and initial permission grants
automatically.

### Joining Entity Tables
Until `include` is supported, use two flat queries for related entity data.
Both queries are permission-filtered independently:

```typescript
// ✅ CORRECT — two flat queries, both permission-aware
const studies = await db.entity.sendStudies.findMany({
  where: { phase: 'Phase I' },
});
const subjects = await db.entity.sendSubjects.findMany({
  where: { studyEntityId: { in: studies.map(s => s.entityId) } },
});

// ❌ WRONG — raw SQL join bypasses permission checks
const result = await db.execute(sql`
  SELECT * FROM send_studies s JOIN send_subjects sub ON ...
`);
```

### Permissions in UI
Always use `includePermissions: true` when listing entities for display.
Use the `_permissions` object on each row to conditionally render actions.
```

---

## 13. Future Considerations (DO NOT IMPLEMENT NOW)

Keep these in mind during implementation so the design doesn't paint us into a corner:

1. **Projects layer** — Will be added back for sharing collections of entities. The permission
   check CTE will expand to also check through project_relations. Keep the permission check
   logic in an isolated function that can be extended.

2. **Column/property-level privileges** — The `select` compiler should be designed so that
   column filtering can be injected later (intersecting requested columns with allowed columns
   per group). The property registry concept (static columns + JSON paths) will be added.

3. **Centralized REST endpoint** — Eventually, `db.entity` CRUD may be exposed as a generic
   REST API so apps can go serverless. The Prisma-shaped types will map directly to request
   bodies.

4. **Permission caching** — The recursive group CTE runs on every query. If this becomes a
   bottleneck, cache the user's effective group set with a short TTL. Design the group
   resolution function so a cache layer can wrap it transparently.

5. **Datagrok integration** — Route structure and data model should stay close to Datagrok's
   for eventual integration. Keep the same table names and column names where possible.
```
