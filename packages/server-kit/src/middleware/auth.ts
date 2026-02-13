import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

import type { AppVariables } from '../types.js'

const uuidSchema = z.string().uuid()

export const auth = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  // Health endpoint is public
  if (c.req.path === '/api/health') {
    await next()
    return
  }

  const userIdHeader = c.req.header('X-User-Id')
  if (!userIdHeader) {
    throw new HTTPException(401, { message: 'Missing X-User-Id header' })
  }

  const result = uuidSchema.safeParse(userIdHeader)
  if (!result.success) {
    throw new HTTPException(400, { message: 'X-User-Id must be a valid UUID' })
  }

  c.set('userId', result.data)
  await next()
})
