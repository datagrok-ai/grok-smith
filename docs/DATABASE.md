# Database Conventions

## Naming
- Tables: snake_case, plural (`compounds`, `batch_records`)
- Columns: snake_case (`created_at`, `mol_weight`)
- Junction tables: alphabetical (`compound_projects`, not `project_compounds`)
- Indexes: `idx_{table}_{columns}` (`idx_compounds_project_id`)
- Foreign keys: `{referenced_table_singular}_id` (`project_id`, `user_id`)
- Never abbreviate (`organizations` not `orgs`)

## Required Columns

Every table gets:
- `id` — UUID, primary key, default `gen_random_uuid()`

**Entity tables** (top-level things users create/own — studies, compounds, projects) also get:
- `entity_id` — UUID, FK to `entities.id` (links to the Datagrok privilege system)
- `created_at` — timestamptz, default `now()`
- `updated_at` — timestamptz, managed by Drizzle `.$onUpdate()`
- `created_by` — UUID, FK to `users.id`

Use `auditColumns()` from `@datagrok/core-schema` to add all five at once.

**Detail/child tables** (rows that belong to and cascade-delete with a parent entity — findings, trial_arms, exposures) only need `id`. The parent entity tracks ownership. Add timestamps if independently useful, but `created_by` is redundant.

## Datagrok Integration
- Reference Datagrok users via a local `datagrok_users` table that syncs id, login, and display_name
- Do not directly join to Datagrok's internal schema
- App-specific tables live in a schema named after the app (`send.*`, `compound_reg.*`)

## Schema Definition
- Define all schemas in `/shared/schema.ts` using Drizzle
- Export Zod schemas via `drizzle-zod` for validation
- Export inferred TypeScript types from Zod schemas
- This is the single source of truth for types across client and server

## Migrations
- One migration per feature
- Never modify an existing migration that has been committed
- Name: `NNNN_description.sql` (`0001_create_studies.sql`)

## Rules
- Always use UUID primary keys, never auto-increment
- Soft deletes via `deleted_at` timestamptz column when needed
- JSONB columns only for truly unstructured/variable data, not to avoid normalization
- All monetary values stored as integers (cents), never floats
- All timestamps stored as timestamptz (with timezone)
