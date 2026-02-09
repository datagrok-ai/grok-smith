# Database Setup

## Quick Start

```bash
# 1. Start PostgreSQL (from repo root)
docker compose up -d postgres

# 2. Run migrations
npm run db:migrate --workspace=apps/send

# 3. Seed with PointCross study data
npm run db:seed --workspace=apps/send
```

## Connection Details

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5433` (mapped from container 5432) |
| Database | `send_dev` |
| User | `send` |
| Password | `send_local` |
| Schema | `send` |
| URL | `postgresql://send:send_local@localhost:5433/send_dev` |

Connect with psql:
```bash
docker compose exec postgres psql -U send -d send_dev
```

## Docker Commands

```bash
# Start Postgres (detached)
npm run db:up          # or: docker compose up -d postgres

# Stop Postgres (data preserved)
npm run db:down        # or: docker compose down

# Full reset (destroys data, re-creates volume)
npm run db:reset       # or: docker compose down -v && docker compose up -d postgres
```

## Drizzle ORM Commands

```bash
# Generate a migration after schema changes
npm run db:generate --workspace=apps/send

# Apply pending migrations
npm run db:migrate --workspace=apps/send

# Seed database with XPT data
npm run db:seed --workspace=apps/send
```

## Tables Overview

All tables live in the `send` PostgreSQL schema.

| Table | Source Domain | Description | Expected Rows (PointCross) |
|-------|-------------|-------------|---------------------------|
| `studies` | TS | Study metadata | 1 |
| `trial_summary_parameters` | TS | Study design key/value pairs | ~40 |
| `trial_arms` | TA | Treatment group definitions | ~20 |
| `trial_sets` | TX | Dose group parameters | ~30 |
| `subjects` | DM | Individual animals | ~80 |
| `subject_elements` | SE | Epoch/element assignments | ~160 |
| `exposures` | EX | Dosing records | ~800+ |
| `dispositions` | DS | Subject disposition events | ~80 |
| `findings` | BW,CL,LB,MI,MA,OM,... | Unified observation data | ~15,000+ |
| `comments` | CO | Cross-domain comments | varies |
| `supplemental_qualifiers` | SUPPMA,SUPPMI | Extra qualifier values | varies |
| `related_records` | RELREC | Record relationships | varies |

## Common Drizzle Queries

```typescript
import { db } from '../server/db/client'
import { studies, subjects, findings } from '../shared/schema'
import { eq, and, count } from 'drizzle-orm'

// Get all studies
const allStudies = await db.select().from(studies)

// Get subjects for a study
const studySubjects = await db
  .select()
  .from(subjects)
  .where(eq(subjects.studyId, someStudyId))

// Get body weight findings for a subject
const bwFindings = await db
  .select()
  .from(findings)
  .where(
    and(
      eq(findings.subjectId, someSubjectId),
      eq(findings.domain, 'BW'),
    ),
  )

// Count findings per domain for a study
const domainCounts = await db
  .select({
    domain: findings.domain,
    count: count(),
  })
  .from(findings)
  .where(eq(findings.studyId, someStudyId))
  .groupBy(findings.domain)
```

## Seed Data

The seed script reads XPT (SAS Transport v5) files from `apps/send/data/PointCross/` using the `xport-js` library and inserts them in dependency order:

1. Study + trial summary parameters (from `ts.xpt`)
2. Trial arms (from `ta.xpt`)
3. Trial sets (from `tx.xpt`)
4. Subjects / demographics (from `dm.xpt`)
5. Subject elements (from `se.xpt`)
6. Exposures (from `ex.xpt`)
7. Dispositions (from `ds.xpt`)
8. Findings — all 16 domains (from `bw.xpt`, `cl.xpt`, `lb.xpt`, etc.)
9. Comments, supplemental qualifiers, related records

The seed is idempotent — it uses `onConflictDoNothing()` so re-running is safe.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `postgresql://send:send_local@localhost:5433/send_dev` | PostgreSQL connection string |

Set in `apps/send/.env` (gitignored) or export in shell.
