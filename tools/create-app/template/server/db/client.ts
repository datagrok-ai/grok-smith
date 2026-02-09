import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '../../shared/schema'

const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/{{APP_NAME}}_dev'

const client = postgres(connectionString, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
})

export const db = drizzle(client, { schema })
