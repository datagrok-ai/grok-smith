/**
 * Seed script — reads XPT files from data/PointCross/ and loads into PostgreSQL.
 *
 * Usage: npx tsx tools/seed.ts
 *
 * Prerequisites:
 *   1. Postgres running: docker compose up -d postgres (from repo root)
 *   2. Migrations applied: npm run db:migrate
 */

import path from 'path'
import { fileURLToPath } from 'url'

import { importStudyFromDirectory } from '../server/services/import-study'
import { SYSTEM_USER_ID } from '../shared/schema'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../data/PointCross')

async function main() {
  console.log('=== SEND Database Seed ===')
  console.log(`Data directory: ${DATA_DIR}`)
  console.log()

  const result = await importStudyFromDirectory(DATA_DIR, SYSTEM_USER_ID)

  console.log()
  console.log(`Study: ${result.studyCode} — ${result.studyTitle}`)
  console.log(`Study DB ID: ${result.studyId}`)
  console.log(`Subjects: ${String(result.subjectCount)}`)
  console.log('Domain counts:')
  for (const [domain, count] of Object.entries(result.domainCounts)) {
    console.log(`  ${domain}: ${String(count)} rows`)
  }

  console.log()
  console.log('=== Seed complete! ===')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
