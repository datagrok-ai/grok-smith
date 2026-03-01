import type { Column } from 'drizzle-orm'
import type { SelectClause } from './types.js'

/**
 * Compiles a Prisma-shaped select clause into a Drizzle column selection object.
 * When select is provided, only returns the specified columns (plus `id` always,
 * and `entityId` when includePermissions is true).
 * When select is undefined, returns all columns.
 */
export function compileSelect(
  select: SelectClause | undefined,
  columnMap: Map<string, Column>,
  includePermissions?: boolean,
): Record<string, Column> | undefined {
  if (!select) return undefined

  const result: Record<string, Column> = {}

  // Always include id
  const idCol = columnMap.get('id')
  if (idCol) {
    result['id'] = idCol
  }

  // Always include entityId when permissions are requested
  if (includePermissions) {
    const entityIdCol = columnMap.get('entityId')
    if (entityIdCol) {
      result['entityId'] = entityIdCol
    }
  }

  for (const [field, included] of Object.entries(select)) {
    if (!included) continue
    const column = columnMap.get(field)
    if (!column) {
      throw new Error(`Unknown field in select: ${field}`)
    }
    result[field] = column
  }

  return result
}
