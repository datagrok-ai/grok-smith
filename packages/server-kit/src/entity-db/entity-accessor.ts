import {
  sql,
  eq,
  and,
  inArray,
  getTableColumns,
  type Column,
  type SQL,
} from 'drizzle-orm'
import type { PgColumn, PgTable, SelectedFields } from 'drizzle-orm/pg-core'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { batchCheckPermissions, isAdmin } from '../permissions/check.js'
import { PermissionDeniedError } from '../permissions/errors.js'
import { visibleEntitiesSql, isAdminSql } from '../permissions/visibility.js'
import type { UserContext } from '../permissions/types.js'

import { compileWhere } from './where-compiler.js'
import { compileOrderBy } from './orderby-compiler.js'
import { compileSelect } from './select-compiler.js'
import type {
  EntityAccessor,
  EntityTableConfig,
  FindManyArgs,
  FindUniqueArgs,
  FindFirstArgs,
  CountArgs,
  CreateArgs,
  CreateManyArgs,
  UpdateArgs,
  UpdateManyArgs,
  DeleteArgs,
  DeleteManyArgs,
  RowPermissions,
} from './types.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPgColumn = PgColumn<any, any, any>

/**
 * Creates a Prisma-shaped accessor for an entity table.
 * All reads are filtered by visibility; all writes check permissions.
 */
export function createEntityAccessor(
  db: PostgresJsDatabase<Record<string, unknown>>,
  config: EntityTableConfig,
  getUserContext: () => UserContext,
): EntityAccessor {
  const table = config.table as PgTable
  const columns = getTableColumns(table)
  const columnMap = new Map<string, Column>()
  for (const [name, col] of Object.entries(columns)) {
    columnMap.set(name, col as Column)
  }

  const maybeEntityIdCol = columns['entityId' as keyof typeof columns] as AnyPgColumn | undefined
  const maybeIdCol = columns['id' as keyof typeof columns] as AnyPgColumn | undefined
  if (!maybeEntityIdCol || !maybeIdCol) {
    throw new Error(`Table ${config.tableName} missing required columns (id, entityId)`)
  }
  const entityIdCol: AnyPgColumn = maybeEntityIdCol
  const idCol: AnyPgColumn = maybeIdCol

  // ── Helpers ───────────────────────────────────────────────────────────────

  function visibilityFilter(): SQL {
    const ctx = getUserContext()
    return sql`(${isAdminSql(ctx.personalGroupId)} OR ${entityIdCol} IN ${visibleEntitiesSql(ctx.personalGroupId, config.entityTypeName)})`
  }

  async function fetchPermissionsForRows(
    rows: Record<string, unknown>[],
  ): Promise<Map<string, RowPermissions>> {
    const ctx = getUserContext()
    const result = new Map<string, RowPermissions>()

    if (rows.length === 0) return result

    // Check if admin — if so, all permissions are true
    const admin = await isAdmin(db, ctx.personalGroupId)
    if (admin) {
      for (const row of rows) {
        result.set(row['id'] as string, { canEdit: true, canDelete: true, canShare: true })
      }
      return result
    }

    // Batch-check all entities at once — single query instead of 3N
    const entityIds = rows
      .map((r) => r['entityId'] as string)
      .filter(Boolean)

    const grantsMap = await batchCheckPermissions(
      db,
      ctx.personalGroupId,
      entityIds,
      ['Edit', 'Delete', 'Share'],
      config.entityTypeName,
    )

    for (const row of rows) {
      const entityId = row['entityId'] as string
      const grants = entityId ? grantsMap.get(entityId) : undefined
      result.set(row['id'] as string, {
        canEdit: grants?.has('Edit') ?? false,
        canDelete: grants?.has('Delete') ?? false,
        canShare: grants?.has('Share') ?? false,
      })
    }

    return result
  }

  /**
   * Asserts that the user has a specific permission on all given entities.
   * Skips the check for admins. Throws PermissionDeniedError on first failure.
   */
  async function assertBulkPermission(
    rows: { id: string; entityId: string }[],
    permissionName: string,
  ): Promise<void> {
    const ctx = getUserContext()
    const adminUser = await isAdmin(db, ctx.personalGroupId)
    if (adminUser) return

    const entityIds = rows.map((r) => r.entityId)
    const grantsMap = await batchCheckPermissions(
      db,
      ctx.personalGroupId,
      entityIds,
      [permissionName],
      config.entityTypeName,
    )

    for (const row of rows) {
      if (!grantsMap.get(row.entityId)?.has(permissionName)) {
        throw new PermissionDeniedError(row.entityId, permissionName, config.entityTypeName)
      }
    }
  }

  /**
   * Creates an entity row (entities table + trigger) and returns the entity ID.
   * Reused by create() and createMany().
   */
  async function createEntityRow(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    entityTypeId: string,
    personalGroupId: string,
  ): Promise<string> {
    const entityResult = await tx.execute<{ id: string }>(sql`
      INSERT INTO entities (id, entity_type_id, created_by_group_id)
      VALUES (gen_random_uuid(), ${entityTypeId}::uuid, ${personalGroupId}::uuid)
      RETURNING id
    `)
    const entityId = entityResult[0]?.id
    if (!entityId) throw new Error('Failed to create entity row')
    return entityId
  }

  // ── Read Operations ───────────────────────────────────────────────────────

  async function findMany(args?: FindManyArgs): Promise<Record<string, unknown>[]> {
    const whereCondition = compileWhere(args?.where, columnMap)
    const orderByClause = compileOrderBy(args?.orderBy, columnMap)
    const selectCols = compileSelect(args?.select, columnMap, args?.includePermissions)

    const conditions = [visibilityFilter()]
    if (whereCondition) conditions.push(whereCondition)

    const selection = (selectCols ?? columns) as SelectedFields
    let query = db
      .select(selection)
      .from(table)
      .where(and(...conditions))

    if (orderByClause.length > 0) {
      query = query.orderBy(...orderByClause) as typeof query
    }
    if (args?.take !== undefined) {
      query = query.limit(args.take) as typeof query
    }
    if (args?.skip !== undefined) {
      query = query.offset(args.skip) as typeof query
    }

    const rows = await query as Record<string, unknown>[]

    if (args?.includePermissions) {
      const permsMap = await fetchPermissionsForRows(rows)
      for (const row of rows) {
        row['_permissions'] = permsMap.get(row['id'] as string) ?? {
          canEdit: false,
          canDelete: false,
          canShare: false,
        }
      }
    }

    return rows
  }

  async function findUnique(args: FindUniqueArgs): Promise<Record<string, unknown> | null> {
    const selectCols = compileSelect(args.select, columnMap, args.includePermissions)
    const selection = (selectCols ?? columns) as SelectedFields
    const rows = await db
      .select(selection)
      .from(table)
      .where(and(eq(idCol, args.where.id), visibilityFilter())) as Record<string, unknown>[]

    const row = rows[0] ?? null
    if (row && args.includePermissions) {
      const permsMap = await fetchPermissionsForRows([row])
      row['_permissions'] = permsMap.get(row['id'] as string) ?? {
        canEdit: false,
        canDelete: false,
        canShare: false,
      }
    }

    return row
  }

  async function findFirst(args?: FindFirstArgs): Promise<Record<string, unknown> | null> {
    const results = await findMany({
      where: args?.where,
      orderBy: args?.orderBy,
      select: args?.select,
      includePermissions: args?.includePermissions,
      take: 1,
    })
    return results[0] ?? null
  }

  async function count(args?: CountArgs): Promise<number> {
    const whereCondition = compileWhere(args?.where, columnMap)
    const conditions = [visibilityFilter()]
    if (whereCondition) conditions.push(whereCondition)

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(table)
      .where(and(...conditions))

    return result[0]?.count ?? 0
  }

  // ── Write Operations ──────────────────────────────────────────────────────

  async function create(args: CreateArgs): Promise<Record<string, unknown>> {
    const ctx = getUserContext()

    return await db.transaction(async (tx) => {
      const etResult = await tx.execute<{ id: string }>(sql`
        SELECT id FROM entity_types WHERE name = ${config.entityTypeName}
      `)
      const entityTypeId = etResult[0]?.id
      if (!entityTypeId) {
        throw new Error(`Entity type '${config.entityTypeName}' not registered`)
      }

      const entityId = await createEntityRow(tx, entityTypeId, ctx.personalGroupId)

      const insertData = {
        ...args.data,
        entityId,
        createdBy: ctx.userId,
      }

      const [row] = await tx
        .insert(table)
        .values(insertData as Record<string, unknown>)
        .returning() as Record<string, unknown>[]

      return row
    })
  }

  async function createMany(args: CreateManyArgs): Promise<Record<string, unknown>[]> {
    const ctx = getUserContext()

    return await db.transaction(async (tx) => {
      const etResult = await tx.execute<{ id: string }>(sql`
        SELECT id FROM entity_types WHERE name = ${config.entityTypeName}
      `)
      const entityTypeId = etResult[0]?.id
      if (!entityTypeId) {
        throw new Error(`Entity type '${config.entityTypeName}' not registered`)
      }

      const results: Record<string, unknown>[] = []
      for (const data of args.data) {
        const entityId = await createEntityRow(tx, entityTypeId, ctx.personalGroupId)
        const insertData = { ...data, entityId, createdBy: ctx.userId }
        const [row] = await tx
          .insert(table)
          .values(insertData as Record<string, unknown>)
          .returning() as Record<string, unknown>[]
        results.push(row)
      }

      return results
    })
  }

  async function update(args: UpdateArgs): Promise<Record<string, unknown>> {
    // Find the row to get its entityId
    const [existing] = await db
      .select({ id: idCol, entityId: entityIdCol })
      .from(table)
      .where(eq(idCol, args.where.id)) as unknown as { id: string; entityId: string }[]

    if (!existing) {
      throw new Error(`Row not found: ${args.where.id}`)
    }

    await assertBulkPermission([existing], 'Edit')

    const [row] = await db
      .update(table)
      .set(args.data)
      .where(eq(idCol, args.where.id))
      .returning() as Record<string, unknown>[]

    return row
  }

  async function updateMany(args: UpdateManyArgs): Promise<{ count: number }> {
    const whereCondition = compileWhere(args.where, columnMap)
    const conditions = [visibilityFilter()]
    if (whereCondition) conditions.push(whereCondition)

    const rows = await db
      .select({ id: idCol, entityId: entityIdCol })
      .from(table)
      .where(and(...conditions)) as unknown as { id: string; entityId: string }[]

    if (rows.length === 0) return { count: 0 }

    await assertBulkPermission(rows, 'Edit')

    const ids = rows.map((r) => r.id)
    await db
      .update(table)
      .set(args.data)
      .where(inArray(idCol, ids))

    return { count: ids.length }
  }

  async function del(args: DeleteArgs): Promise<Record<string, unknown>> {
    // Find the row
    const [existing] = await db
      .select(columns as SelectedFields)
      .from(table)
      .where(eq(idCol, args.where.id)) as Record<string, unknown>[]

    if (!existing) {
      throw new Error(`Row not found: ${args.where.id}`)
    }

    const entityId = existing['entityId'] as string
    await assertBulkPermission([{ id: existing['id'] as string, entityId }], 'Delete')

    // Delete the entities row — CASCADE removes permissions + domain row (via onDelete cascade)
    await db.execute(sql`DELETE FROM entities WHERE id = ${entityId}::uuid`)

    return existing
  }

  async function deleteMany(args: DeleteManyArgs): Promise<{ count: number }> {
    const whereCondition = compileWhere(args.where, columnMap)
    const conditions = [visibilityFilter()]
    if (whereCondition) conditions.push(whereCondition)

    const rows = await db
      .select({ id: idCol, entityId: entityIdCol })
      .from(table)
      .where(and(...conditions)) as unknown as { id: string; entityId: string }[]

    if (rows.length === 0) return { count: 0 }

    await assertBulkPermission(rows, 'Delete')

    // Delete entities rows — CASCADE handles the rest
    const entityIds = rows.map((r) => r.entityId)
    await db.execute(sql`
      DELETE FROM entities WHERE id IN ${sql`(${sql.join(entityIds.map(id => sql`${id}::uuid`), sql`, `)})`}
    `)

    return { count: rows.length }
  }

  return {
    findMany,
    findUnique,
    findFirst,
    count,
    create,
    createMany,
    update,
    updateMany,
    delete: del,
    deleteMany,
  }
}
