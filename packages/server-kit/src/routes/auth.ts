import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { users } from '@datagrok/core-schema'

import type { AppVariables } from '../types.js'

export function authRoutes(db: PostgresJsDatabase<Record<string, unknown>>) {
  const routes = new Hono<{ Variables: AppVariables }>()

  routes.get('/api/auth/me', async (c) => {
    const userId = c.get('userId')

    const [user] = await db
      .select({
        id: users.id,
        login: users.login,
        firstName: users.firstName,
        lastName: users.lastName,
        friendlyName: users.friendlyName,
        email: users.email,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))

    if (!user) {
      throw new HTTPException(404, { message: 'User not found' })
    }

    return c.json(user)
  })

  return routes
}
