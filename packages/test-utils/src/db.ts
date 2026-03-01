import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'

const DEFAULT_DATABASE_URL = 'postgresql://datagrok:datagrok_local@localhost:5433/datagrok_dev'

/**
 * Creates a Drizzle database instance for integration tests.
 * Uses a single connection (max: 1) so BEGIN/ROLLBACK isolation works correctly.
 */
export function createTestDb() {
  const url = process.env['DATABASE_URL'] ?? DEFAULT_DATABASE_URL
  const client = postgres(url, { max: 1 })
  const db = drizzle({ client })

  return { db, client }
}

/**
 * Wraps a test callback in a BEGIN/ROLLBACK transaction so no data is committed.
 * Each test gets a clean database state.
 */
export async function withTestTransaction(
  db: ReturnType<typeof drizzle>,
  fn: (db: ReturnType<typeof drizzle>) => Promise<void>,
): Promise<void> {
  await db.execute(sql`BEGIN`)
  try {
    await fn(db)
  } finally {
    await db.execute(sql`ROLLBACK`)
  }
}
