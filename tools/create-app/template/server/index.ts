import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { healthRoute } from './routes/health'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'X-User-Id'],
  }),
)

// Routes
app.route('/api', healthRoute)

// Start server
const port = 3000
console.log(`{{APP_NAME_PASCAL}} server running on http://localhost:${String(port)}`)

serve({
  fetch: app.fetch,
  port,
})
