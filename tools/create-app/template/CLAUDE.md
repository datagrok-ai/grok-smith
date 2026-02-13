# {{APP_NAME_PASCAL}} App — Agent Instructions

Read before any work:
- /docs/CODING.md
- /docs/DATABASE.md
- /docs/DESIGN.md
- /docs/DATA-MODEL.md
- ./docs/DOMAIN.md
- ./docs/ARCHITECTURE.md
- ./docs/STATUS.md

## App-specific rules
- All database tables in the `{{APP_NAME}}` schema
- Update STATUS.md when completing features

## Harness usage
- Server entry (`server/index.ts`) uses `createApp()` from `@datagrok/server-kit` — do not add manual CORS, logging, or health routes
- DB client (`server/db/client.ts`) uses `createDb()` from `@datagrok/server-kit` — do not hardcode connection strings
- Use `auditColumns()` from `@datagrok/core-schema` on entity tables (top-level things users create/own) — provides `id`, `created_at`, `updated_at`, `created_by` (FK → `users.id`). Detail/child tables only need `id`.
- Import `SYSTEM_USER_ID`, `ADMIN_USER_ID` from `@datagrok/core-schema` — never define local copies
- Use `varchar` + Zod validation for status/enum columns — do not use `pgEnum`
