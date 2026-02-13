import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const DEFAULT_DATABASE_URL = 'postgresql://datagrok:datagrok_local@localhost:5433/datagrok_dev'

interface CreateDbOptions {
  /** Drizzle schema object (import * as schema from '...') */
  schema: Record<string, unknown>
  /** Override DATABASE_URL (defaults to env var or standard local dev URL) */
  connectionString?: string
}

export function createDb<TSchema extends Record<string, unknown>>(
  options: CreateDbOptions & { schema: TSchema },
) {
  const url = options.connectionString ?? process.env['DATABASE_URL'] ?? DEFAULT_DATABASE_URL

  const client = postgres(url, {
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  })

  return drizzle({ client, schema: options.schema })
}
