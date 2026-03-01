import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { errorHandler } from './error-handler'
import { PermissionDeniedError } from '../permissions/errors'

function createTestApp() {
  const app = new Hono()
  app.onError(errorHandler)
  return app
}

describe('errorHandler', () => {
  it('formats HTTPException as JSON with status code', async () => {
    const app = createTestApp()
    app.get('/test', () => {
      throw new HTTPException(404, { message: 'Not found' })
    })

    const res = await app.request('/test')
    expect(res.status).toBe(404)

    const body = (await res.json()) as { error: string; details: undefined }
    expect(body).toEqual({ error: 'Not found', details: undefined })
  })

  it('formats PermissionDeniedError as 403', async () => {
    const app = createTestApp()
    app.get('/test', () => {
      throw new PermissionDeniedError('entity-123', 'edit')
    })

    const res = await app.request('/test')
    expect(res.status).toBe(403)

    const body = (await res.json()) as { error: string; entityId: string; requiredPermission: string }
    expect(body.error).toBe('permission_denied')
    expect(body.entityId).toBe('entity-123')
    expect(body.requiredPermission).toBe('edit')
  })

  it('formats unknown errors as 500 with message', async () => {
    const app = createTestApp()
    app.get('/test', () => {
      throw new Error('Something broke')
    })

    const res = await app.request('/test')
    expect(res.status).toBe(500)

    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('Internal server error: Something broke')
  })

  it('provides helpful message for ECONNREFUSED', async () => {
    const app = createTestApp()
    app.get('/test', () => {
      const err = new Error('connect failed') as Error & { code: string }
      err.code = 'ECONNREFUSED'
      throw err
    })

    const res = await app.request('/test')
    expect(res.status).toBe(500)

    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('Database connection refused')
  })
})
