import { asc, desc, type Column, type SQL } from 'drizzle-orm'
import type { OrderByClause } from './types.js'

/**
 * Compiles a Prisma-shaped orderBy clause into Drizzle asc/desc calls.
 * Supports single object `{ createdAt: 'desc' }` or array `[{ name: 'asc' }, { createdAt: 'desc' }]`.
 */
export function compileOrderBy(
  orderBy: OrderByClause | undefined,
  columnMap: Map<string, Column>,
): SQL[] {
  if (!orderBy) return []

  const entries = Array.isArray(orderBy)
    ? orderBy.flatMap((o) => Object.entries(o))
    : Object.entries(orderBy)

  return entries.map(([field, direction]) => {
    const column = columnMap.get(field)
    if (!column) {
      throw new Error(`Unknown field in orderBy: ${field}`)
    }
    return direction === 'desc' ? desc(column) : asc(column)
  })
}
