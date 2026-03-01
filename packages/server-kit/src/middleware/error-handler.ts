import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { PermissionDeniedError } from '../permissions/errors.js'

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof PermissionDeniedError) {
    return c.json(
      {
        error: 'permission_denied',
        message: err.message,
        entityId: err.entityId,
        requiredPermission: err.requiredPermission,
      },
      403,
    )
  }

  if (err instanceof HTTPException) {
    return c.json(
      { error: err.message, details: undefined },
      err.status,
    )
  }

  console.error('Unhandled error:', err)

  // Provide a meaningful message for known error categories
  const code = (err as { code?: string }).code
  let message = 'Internal server error'

  if (code === 'ECONNREFUSED') {
    message = 'Database connection refused — is PostgreSQL running?'
  } else if (code === 'ENOTFOUND') {
    message = 'Database host not found — check DATABASE_URL'
  } else if (code === '28P01') {
    message = 'Database authentication failed — check credentials'
  } else if (code === '3D000') {
    message = 'Database does not exist — check DATABASE_URL'
  } else if (err instanceof Error && err.message) {
    message = `Internal server error: ${err.message}`
  }

  return c.json({ error: message }, 500)
}
