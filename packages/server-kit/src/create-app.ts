import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import type { AppConfig, AppVariables } from './types.js'
import { requestId } from './middleware/request-id.js'
import { auth } from './middleware/auth.js'
import { userContext } from './middleware/user-context.js'
import { errorHandler } from './middleware/error-handler.js'
import { healthRoutes } from './routes/health.js'
import { privilegeRoutes } from './routes/privileges.js'

export function createApp(config: AppConfig) {
  const app = new Hono<{ Variables: AppVariables }>()

  // Error handler
  app.onError(errorHandler)

  // Standard middleware
  app.use('*', logger())
  app.use(
    '*',
    cors({
      origin: config.corsOrigin ?? 'http://localhost:5173',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowHeaders: ['Content-Type', 'X-User-Id', 'X-Request-Id'],
    }),
  )
  app.use('*', requestId)
  app.use('*', auth)

  // When db is provided, mount user context middleware and privilege routes
  if (config.db) {
    app.use('*', userContext(config.db))
    app.route('/', privilegeRoutes(config.db))
  }

  // Standard routes
  app.route('/', healthRoutes())

  // App-specific routes
  if (config.configure) {
    config.configure(app)
  }

  console.log(`${config.name} server ready`)

  return app
}
