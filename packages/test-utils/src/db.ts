import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

const DEFAULT_DATABASE_URL = 'postgresql://datagrok:datagrok_local@localhost:5433/datagrok_dev'

/**
 * Creates a Drizzle database instance for integration tests.
 * Uses a single connection (max: 1) to keep things simple.
 */
export function createTestDb() {
  const url = process.env['DATABASE_URL'] ?? DEFAULT_DATABASE_URL
  const client = postgres(url, { max: 1 })
  const db = drizzle({ client })

  return { db, client }
}

/** Sentinel error used to force a transaction rollback without indicating a real failure. */
class TestRollback extends Error {
  constructor() {
    super('test-rollback')
  }
}

/**
 * Wraps a test callback in a Drizzle-managed transaction, then rolls back.
 *
 * Uses Drizzle's `db.transaction()` so that any nested `tx.transaction()` calls
 * inside the code-under-test become SAVEPOINTs instead of new top-level transactions.
 * At the end, a sentinel error is thrown to trigger ROLLBACK, ensuring no data is committed.
 */
export async function withTestTransaction(
  db: PostgresJsDatabase<Record<string, unknown>>,
  fn: (tx: PostgresJsDatabase<Record<string, unknown>>) => Promise<void>,
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Cast: tx (PostgresJsTransaction) is a superset of PostgresJsDatabase
      // for all query methods. Safe for test use.
      await fn(tx as unknown as PostgresJsDatabase<Record<string, unknown>>)
      throw new TestRollback()
    })
  } catch (e) {
    if (e instanceof TestRollback) return
    throw e
  }
}
