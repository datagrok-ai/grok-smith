# GRIT App — Agent Instructions

Read before any work:
- /docs/CODING.md
- /docs/DATABASE.md
- /docs/DESIGN.md
- ./docs/DOMAIN.md
- ./docs/ARCHITECTURE.md
- ./docs/STATUS.md

## App-specific rules
- All database tables in the `grit` schema
- Issue status uses `varchar` + Zod validation — do not use `pgEnum`
- `projects` and `issues` are entity tables — use `auditColumns()` from `@datagrok/core-schema`
- Import `SYSTEM_USER_ID`, `ADMIN_USER_ID` from `@datagrok/core-schema`, not from local constants
- Update STATUS.md when completing features
