import { Hono } from 'hono'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { sql } from 'drizzle-orm'
import type { Context } from 'hono'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import type { AppVariables } from '../types.js'
import { canDo, batchCheckPermissions } from '../permissions/check.js'
import {
  grantPermission,
  revokePermission,
} from '../permissions/grant.js'

const checkSchema = z.object({
  entityId: z.string().uuid(),
  permissionName: z.string(),
  entityTypeName: z.string(),
})

const checkBatchSchema = z.object({
  checks: z.array(checkSchema),
})

const grantRevokeSchema = z.object({
  entityId: z.string().uuid(),
  permissionName: z.string(),
  entityTypeName: z.string(),
  groupId: z.string().uuid(),
})

function requirePersonalGroupId(c: Context<{ Variables: AppVariables }>): string {
  const id = c.get('personalGroupId')
  if (!id) throw new HTTPException(401, { message: 'User context not available' })
  return id
}

export function privilegeRoutes(db: PostgresJsDatabase<Record<string, unknown>>) {
  const routes = new Hono<{ Variables: AppVariables }>()

  // List all entity types with their permissions
  routes.get('/api/privileges/entity-types', async (c) => {
    const result = await db.execute<{
      id: string
      name: string
      permissions: string
    }>(sql`
      SELECT et.id, et.name,
        COALESCE(json_agg(json_build_object('id', etp.id, 'name', etp.name))
          FILTER (WHERE etp.id IS NOT NULL), '[]') AS permissions
      FROM entity_types et
      LEFT JOIN entity_types_permissions etp ON etp.entity_type_id = et.id
      GROUP BY et.id, et.name
      ORDER BY et.name
    `)

    return c.json(result)
  })

  // Single permission check
  routes.post('/api/privileges/check', async (c) => {
    const body = checkSchema.parse(await c.req.json())
    const personalGroupId = requirePersonalGroupId(c)

    const allowed = await canDo(
      db,
      personalGroupId,
      body.entityId,
      body.permissionName,
      body.entityTypeName,
    )

    return c.json({ allowed })
  })

  // Batch permission check — single query instead of N separate canDo calls
  routes.post('/api/privileges/check-batch', async (c) => {
    const body = checkBatchSchema.parse(await c.req.json())
    const personalGroupId = requirePersonalGroupId(c)

    // Group checks by entityTypeName for efficient batching
    const byType = new Map<string, { entityIds: Set<string>; permNames: Set<string> }>()
    for (const check of body.checks) {
      let group = byType.get(check.entityTypeName)
      if (!group) {
        group = { entityIds: new Set(), permNames: new Set() }
        byType.set(check.entityTypeName, group)
      }
      group.entityIds.add(check.entityId)
      group.permNames.add(check.permissionName)
    }

    // Run batch queries (one per entity type)
    const allGrants = new Map<string, Set<string>>()
    for (const [entityTypeName, { entityIds, permNames }] of byType) {
      const grants = await batchCheckPermissions(
        db,
        personalGroupId,
        [...entityIds],
        [...permNames],
        entityTypeName,
      )
      for (const [entityId, perms] of grants) {
        const existing = allGrants.get(entityId)
        if (existing) {
          for (const p of perms) existing.add(p)
        } else {
          allGrants.set(entityId, perms)
        }
      }
    }

    const results = body.checks.map((check) => ({
      entityId: check.entityId,
      permissionName: check.permissionName,
      allowed: allGrants.get(check.entityId)?.has(check.permissionName) ?? false,
    }))

    return c.json({ results })
  })

  // Grant permission (requires Share)
  routes.post('/api/privileges/grant', async (c) => {
    const body = grantRevokeSchema.parse(await c.req.json())
    const personalGroupId = requirePersonalGroupId(c)

    await grantPermission(
      db,
      personalGroupId,
      body.entityId,
      body.permissionName,
      body.entityTypeName,
      body.groupId,
    )

    return c.json({ ok: true })
  })

  // Revoke permission (requires Share)
  routes.post('/api/privileges/revoke', async (c) => {
    const body = grantRevokeSchema.parse(await c.req.json())
    const personalGroupId = requirePersonalGroupId(c)

    await revokePermission(
      db,
      personalGroupId,
      body.entityId,
      body.permissionName,
      body.entityTypeName,
      body.groupId,
    )

    return c.json({ ok: true })
  })

  // List permissions for an entity (requires Share)
  routes.get('/api/privileges/entity/:entityId/permissions', async (c) => {
    const entityId = c.req.param('entityId')
    const parseResult = z.string().uuid().safeParse(entityId)
    if (!parseResult.success) {
      throw new HTTPException(400, { message: 'entityId must be a valid UUID' })
    }

    const personalGroupId = requirePersonalGroupId(c)

    // Get the entity's type to check Share permission
    const entityResult = await db.execute<{ entity_type_name: string }>(sql`
      SELECT et.name AS entity_type_name
      FROM entities e
      INNER JOIN entity_types et ON et.id = e.entity_type_id
      WHERE e.id = ${entityId}::uuid
    `)
    const entityTypeName = entityResult[0]?.entity_type_name
    if (!entityTypeName) {
      throw new HTTPException(404, { message: 'Entity not found' })
    }

    const canShare = await canDo(db, personalGroupId, entityId, 'Share', entityTypeName)
    if (!canShare) {
      throw new HTTPException(403, { message: 'Requires Share permission to view grants' })
    }

    const grants = await db.execute<{
      id: string
      group_id: string
      group_name: string
      permission_name: string
    }>(sql`
      SELECT p.id, p.user_group_id AS group_id, g.name AS group_name, etp.name AS permission_name
      FROM permissions p
      INNER JOIN entity_types_permissions etp ON etp.id = p.permission_id
      INNER JOIN groups g ON g.id = p.user_group_id
      WHERE p.entity_id = ${entityId}::uuid
      ORDER BY g.name, etp.name
    `)

    return c.json(grants)
  })

  return routes
}
