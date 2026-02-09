import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '../../shared/schema'

// For local dev without Postgres, the server still starts but DB calls will fail gracefully.
// Set DATABASE_URL in .env (see .env.example).
const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://send:send_local@localhost:5433/send_dev'

const client = postgres(connectionString, {
  // Lazy connection: don't fail on startup if DB isn't available
  idle_timeout: 20,
  max_lifetime: 60 * 30,
})

export const db = drizzle(client, { schema })
