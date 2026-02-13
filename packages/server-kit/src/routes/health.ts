import { Hono } from 'hono'

import type { AppVariables } from '../types.js'

export function healthRoutes() {
  const routes = new Hono<{ Variables: AppVariables }>()

  routes.get('/api/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  })

  return routes
}
