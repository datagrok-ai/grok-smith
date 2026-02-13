import type { Hono } from 'hono'

export interface AppVariables {
  userId: string
  requestId: string
}

export interface AppConfig {
  /** Display name for logging (e.g. 'send', 'compound-reg') */
  name: string
  /** Register app-specific routes on the Hono instance */
  configure?: (app: Hono<{ Variables: AppVariables }>) => void
}
