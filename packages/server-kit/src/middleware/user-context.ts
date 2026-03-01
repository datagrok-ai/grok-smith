import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { users } from '@datagrok/core-schema'

import type { AppVariables } from '../types.js'

interface CacheEntry {
  personalGroupId: string
  expiresAt: number
}

const TTL_MS = 60_000 // 60 seconds
const cache = new Map<string, CacheEntry>()

/**
 * Middleware that resolves the user's personal group ID from the database.
 * Caches results in memory with a 60s TTL.
 * Sets `c.var.personalGroupId` for downstream use.
 */
export function userContext(db: PostgresJsDatabase<Record<string, unknown>>) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    // Skip for health endpoint
    if (c.req.path === '/api/health') {
      await next()
      return
    }

    const userId = c.get('userId')
    if (!userId) {
      await next()
      return
    }

    // Check cache
    const cached = cache.get(userId)
    if (cached && cached.expiresAt > Date.now()) {
      c.set('personalGroupId', cached.personalGroupId)
      await next()
      return
    }

    // Query database
    const [user] = await db
      .select({ groupId: users.groupId })
      .from(users)
      .where(eq(users.id, userId))

    if (!user?.groupId) {
      throw new HTTPException(404, { message: 'User not found or has no personal group' })
    }

    // Cache the result
    cache.set(userId, {
      personalGroupId: user.groupId,
      expiresAt: Date.now() + TTL_MS,
    })

    c.set('personalGroupId', user.groupId)
    await next()
  })
}
