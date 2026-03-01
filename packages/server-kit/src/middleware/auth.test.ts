import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'

import { auth } from './auth'
import type { AppVariables } from '../types'

function createTestApp() {
  const app = new Hono<{ Variables: AppVariables }>()
  app.use('*', auth)
  app.get('/api/health', (c) => c.json({ status: 'ok' }))
  app.get('/api/test', (c) => c.json({ userId: c.get('userId') }))
  return app
}

describe('auth middleware', () => {
  it('allows /api/health without auth header', async () => {
    const app = createTestApp()

    const res = await app.request('/api/health')
    expect(res.status).toBe(200)

    const body = (await res.json()) as { status: string }
    expect(body.status).toBe('ok')
  })

  it('rejects requests without X-User-Id header', async () => {
    const app = createTestApp()

    const res = await app.request('/api/test')
    expect(res.status).toBe(401)
  })

  it('rejects requests with invalid UUID in X-User-Id', async () => {
    const app = createTestApp()

    const res = await app.request('/api/test', {
      headers: { 'X-User-Id': 'not-a-uuid' },
    })
    expect(res.status).toBe(400)
  })

  it('accepts requests with valid UUID and sets userId on context', async () => {
    const app = createTestApp()
    const testUuid = '878c42b0-9a50-11e6-c537-6bf8e9ab02ee'

    const res = await app.request('/api/test', {
      headers: { 'X-User-Id': testUuid },
    })
    expect(res.status).toBe(200)

    const body = (await res.json()) as { userId: string }
    expect(body.userId).toBe(testUuid)
  })
})
