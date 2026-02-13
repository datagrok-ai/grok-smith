# SEND App — Agent Instructions

Read before any work:
- /docs/CODING.md
- /docs/DATABASE.md
- /docs/DESIGN.md
- /docs/DATA-MODEL.md
- ./docs/DOMAIN.md
- ./docs/ARCHITECTURE.md
- ./docs/STATUS.md

## App-specific rules
- All database tables in the `send` schema
- Use SEND controlled terminology from CDISC where applicable
- USUBJID is the primary subject identifier, always display it
- Domain codes (BW, CL, LB, etc.) should use the constants from shared/constants.ts
- Update STATUS.md when completing features

## Harness usage
- Server entry (`server/index.ts`) uses `createApp()` from `@datagrok/server-kit` — do not add manual CORS, logging, or health routes
- DB client (`server/db/client.ts`) uses `createDb()` from `@datagrok/server-kit` — do not hardcode connection strings
- Study status uses `varchar` + Zod validation (`studyStatusSchema` in shared/schema.ts) — do not use `pgEnum`
- `studies` is the entity table — uses `auditColumns()` with `created_by` FK to `users.id`. Detail tables (findings, trial_arms, subjects, etc.) only need `id`.
- Import `SYSTEM_USER_ID` from `@datagrok/core-schema`, not from a local constant
