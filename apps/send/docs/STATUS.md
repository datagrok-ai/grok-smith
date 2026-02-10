# SEND App Status

## Current State
- [x] Project scaffolded
- [x] Full stack wiring: React client <-> Hono server <-> Drizzle/Postgres
- [x] Dev environment: `npm run dev` runs client + server with hot reload
- [x] Docker Compose for PostgreSQL (port 5433)
- [x] Database schema — 12 tables covering all SEND domains (Drizzle ORM)
- [x] Seed script — reads XPT files from PointCross study via xport-js
- [x] Documentation: DATABASE-SETUP.md, SCHEMA-MAP.md, DOMAIN.md
- [x] Reusable import service — extracted from seed script into `server/services/import-study.ts`
- [x] Zip upload endpoint — `POST /api/studies/upload` accepts multipart .zip of XPT files
- [x] Drag-and-drop upload page — `/upload` route with dropzone UI and result display
- [ ] Database migration (run after Docker Desktop is installed)
- [x] API endpoint: `GET /api/studies` with subject counts
- [x] API endpoint: `GET /api/studies/:id` with domain counts
- [x] API endpoint: `GET /api/studies/:id/domains/:domain` — domain data rows
- [ ] API endpoints (subjects, findings CRUD)
- [x] UI page: study list with grid + upload link
- [x] UI page: study detail with domain tabs and data grid
- [ ] UI pages (subject detail, findings viewer)

## Database Schema

12 tables in the `send` PostgreSQL schema:

| Table | Source | Rows (est.) |
|-------|--------|------------|
| studies | TS | 1 |
| trial_summary_parameters | TS | ~40 |
| trial_arms | TA | ~20 |
| trial_sets | TX | ~30 |
| subjects | DM | ~80 |
| subject_elements | SE | ~160 |
| exposures | EX | ~800 |
| dispositions | DS | ~80 |
| findings | 16 domains | ~15,000+ |
| comments | CO | varies |
| supplemental_qualifiers | SUPP-- | varies |
| related_records | RELREC | varies |

Key design decision: All 16 findings domains share a unified `findings` table with `domain` discriminator + `domain_data` JSONB for extras.

## Next Up
1. Install Docker Desktop and run initial migration + seed
2. Build subject detail page with findings by domain

## Open Questions
- How to handle SEND controlled terminology validation — bundle the CDISC codelist or fetch from API?
- File storage strategy for uploaded datasets — local filesystem or object storage?
