import type { Hono } from 'hono'

export interface AppVariables {
  userId: string
  requestId: string
  personalGroupId: string
}

export interface AppConfig {
  /** Display name for logging (e.g. 'send', 'compound-reg') */
  name: string
  /** Register app-specific routes on the Hono instance */
  configure?: (app: Hono<{ Variables: AppVariables }>) => void
  /** CORS allowed origin (default: 'http://localhost:5173') */
  corsOrigin?: string
  /** Database instance — when provided, mounts userContext middleware and privilege routes */
  db?: import('drizzle-orm/postgres-js').PostgresJsDatabase<Record<string, unknown>>
}

export interface ServerAppDefinition {
  id: string
  name: string
  routes: Hono<{ Variables: AppVariables }>
}
