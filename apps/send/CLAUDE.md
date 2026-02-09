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
