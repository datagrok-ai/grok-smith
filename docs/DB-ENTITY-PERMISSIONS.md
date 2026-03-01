# Entity Permissions: Conceptual Guide

This document explains the core concepts of the Datagrok permission system and how they relate
to each other. For database table schemas and built-in constants, see `PERMISSIONS.md`.

## Five Core Concepts

### 1. Groups (organizing users)

A **group** is a collection of users. Groups form a hierarchy via the `groups_relations` table:
each relation links a child group to a parent group.

Every user has a **personal group** (`personal = true`) that acts as a proxy for the user
in the permission system. When you "grant permission to a user," you are actually granting it
to their personal group. Personal groups are then nested inside organizational groups:

```
Alice's personal group  ─┐
Bob's personal group    ─┼─> Chemists group ─┐
Carol's personal group  ─┘                    ├─> All users
Dave's personal group   ─── IT group ────────┘
```

A user's effective permissions are the **union** of all permissions granted to every group
in the chain from their personal group up to the root. The server resolves this with a
recursive CTE (`getAllParentIds()` in `groups_repository.dart`).

The `is_admin` flag in `groups_relations` allows a member to manage the parent group's
membership without being a system administrator.

### 2. Entity types (classifying objects)

Every first-class object in Datagrok has an **entity type** — a row in `entity_types`.
Core types include `TableInfo`, `DataConnection`, `DataQuery`, `Script`, `Project`,
`Package`, `ViewLayout`, `FileInfo`, and others.

Packages can register their own entity types by setting `is_package_entity = true`.
This allows custom domain objects to participate in the same permission system as built-in ones.

Entity types matter for permissions because different types can have different sets of
available permissions (see "Privileges" below).

### 3. Projects (organizing entities)

A **project** groups entities together. The `project_relations` table links entities to projects:

```sql
CREATE TABLE project_relations (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  entity_id UUID REFERENCES entities(id),
  is_link BOOL
);
```

- `is_link = false`: the entity is a **member** (permanent ownership)
- `is_link = true`: the entity is a **reference** (temporary inclusion)

Projects serve as the primary unit for sharing collections of entities. Granting a permission
on a project effectively grants it on the project's member entities.

Every entity can also have an **entity project** — a wrapper project with `is_entity = true`
that contains just that one entity. This is the mechanism for sharing individual entities:
the permission is stored against the wrapper project, and the system maps it to the wrapped
entity during permission resolution.

The `project_relations_all` materialized view maintains the transitive closure of project
membership with a `level` column tracking hierarchical depth.

### 4. Privileges (what you can do)

A **privilege** (or permission type) is defined in `entity_types_permissions`. There are
two kinds:

**Global privileges** (`entity_type_id IS NULL`) control system-wide capabilities: creating
users, publishing packages, browsing connections, sending emails, etc. These are not tied to
any specific entity.

**Entity privileges** (`entity_type_id` references a type) control per-object access.
The standard set available on all entity types is View, Edit, Delete, and Share.
Some entity types define additional privileges:

- DataConnection: Query, GetSchema, ListFiles
- DataQuery: Execute
- Script: Execute
- TableInfo: ReadData

The `project_permission_id` column links an entity-level privilege to its project-level
counterpart, enabling the project permission cascade described above.

A privilege is **granted** by inserting a row into the `permissions` table:

```
permissions.entity_id      = NULL          → global privilege grant
permissions.entity_id      = <project_id>  → entity/project privilege grant
permissions.user_group_id  = <group_id>    → the group receiving the privilege
permissions.permission_id  = <priv_id>     → which privilege is being granted
```

### 5. Roles (combining privileges into a profile)

A **role** is a group with `is_role = true` in the `groups` table. Structurally, it is
identical to a regular group — same table, same hierarchy mechanics, same permission
resolution. The `is_role` flag is purely a **UI/semantic distinction**.

The intended usage pattern is:

1. **Create a role** (a group with `is_role = true`), e.g., "Data Analyst".
2. **Assign privileges to the role**: grant global and entity-type permissions to it,
   defining what the role can do.
3. **Add the role as a child of a group**: via `groups_relations`, make the role a
   subgroup of an organizational group.

All members of that group (and its descendant groups) now inherit the role's privileges.

```
Data Analyst role (is_role=true)
  ├── has privilege: BrowseDatabaseConnections
  ├── has privilege: CreateDataQuery
  └── has privilege: BrowseQueries

Chemists group
  ├── member: Alice
  ├── member: Bob
  └── child: Data Analyst role   ← all Chemists inherit Data Analyst privileges
```

This lets administrators define reusable permission profiles (roles) and apply them to
organizational units (groups) without granting privileges one by one.

## How It All Fits Together

```
User
 └─ personal group
      └─ organizational group(s)
           └─ role(s)                → define what you can do (privileges)

Entity
 └─ entity project (wrapper)
      └─ project                    → define who can access (permission grants to groups)
```

**Permission check flow** (e.g., "can Alice edit Query X?"):

1. Find Alice's personal group and all its ancestors (recursive CTE).
2. Find Query X's entity project (or the project it belongs to).
3. Check if any row in `permissions` matches:
   - `entity_id` = the project/entity-project ID
   - `user_group_id` IN (Alice's group chain)
   - `permission_id` = the Edit permission for DataQuery type

If a match exists, access is granted.