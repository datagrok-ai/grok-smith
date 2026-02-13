import { createMiddleware } from 'hono/factory'
import { randomUUID } from 'crypto'

import type { AppVariables } from '../types.js'

export const requestId = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const id = c.req.header('X-Request-Id') ?? randomUUID()
  c.set('requestId', id)
  c.header('X-Request-Id', id)
  await next()
})
