import {
  eq,
  gt,
  gte,
  lt,
  lte,
  ne,
  inArray,
  notInArray,
  like,
  isNull,
  isNotNull,
  and,
  or,
  not,
  type SQL,
  type Column,
} from 'drizzle-orm'
import type { WhereClause, WhereField, WhereOperators, WhereValue } from './types.js'

/**
 * Compiles a Prisma-shaped where clause into a Drizzle SQL condition.
 * columnMap maps JS camelCase field names to Drizzle Column objects.
 */
export function compileWhere(
  where: WhereClause | undefined,
  columnMap: Map<string, Column>,
): SQL | undefined {
  if (!where) return undefined

  const conditions: SQL[] = []

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue

    if (key === 'AND') {
      const andClauses = value as WhereClause[]
      const compiled = andClauses
        .map((c) => compileWhere(c, columnMap))
        .filter((c): c is SQL => c !== undefined)
      if (compiled.length > 0) {
        conditions.push(and(...compiled)!)
      }
      continue
    }

    if (key === 'OR') {
      const orClauses = value as WhereClause[]
      const compiled = orClauses
        .map((c) => compileWhere(c, columnMap))
        .filter((c): c is SQL => c !== undefined)
      if (compiled.length > 0) {
        conditions.push(or(...compiled)!)
      }
      continue
    }

    if (key === 'NOT') {
      const notClause = compileWhere(value as WhereClause, columnMap)
      if (notClause) {
        conditions.push(not(notClause))
      }
      continue
    }

    const column = columnMap.get(key)
    if (!column) {
      throw new Error(`Unknown field in where clause: ${key}`)
    }

    conditions.push(compileFieldCondition(column, value as WhereField))
  }

  if (conditions.length === 0) return undefined
  if (conditions.length === 1) return conditions[0]
  return and(...conditions)
}

function compileFieldCondition(column: Column, value: WhereField): SQL {
  // Direct value: exact match or null check
  if (value === null) {
    return isNull(column)
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) {
    return eq(column, value)
  }

  // Operator object
  const ops = value as WhereOperators
  const conditions: SQL[] = []

  if ('eq' in ops && ops.eq !== undefined) {
    conditions.push(eq(column, ops.eq))
  }
  if ('gt' in ops && ops.gt !== undefined) {
    conditions.push(gt(column, ops.gt))
  }
  if ('gte' in ops && ops.gte !== undefined) {
    conditions.push(gte(column, ops.gte))
  }
  if ('lt' in ops && ops.lt !== undefined) {
    conditions.push(lt(column, ops.lt))
  }
  if ('lte' in ops && ops.lte !== undefined) {
    conditions.push(lte(column, ops.lte))
  }
  if ('not' in ops) {
    if (ops.not === null) {
      conditions.push(isNotNull(column))
    } else if (typeof ops.not === 'object' && ops.not !== null) {
      // { not: { gt: 10 } } → NOT (col > 10)
      conditions.push(not(compileFieldCondition(column, ops.not as WhereField)))
    } else {
      conditions.push(ne(column, ops.not as WhereValue))
    }
  }
  if ('in' in ops && ops.in !== undefined) {
    conditions.push(inArray(column, ops.in as (string | number)[] ))
  }
  if ('notIn' in ops && ops.notIn !== undefined) {
    conditions.push(notInArray(column, ops.notIn as (string | number)[]))
  }
  if ('contains' in ops && ops.contains !== undefined) {
    conditions.push(like(column, `%${escLike(ops.contains)}%`))
  }
  if ('startsWith' in ops && ops.startsWith !== undefined) {
    conditions.push(like(column, `${escLike(ops.startsWith)}%`))
  }
  if ('endsWith' in ops && ops.endsWith !== undefined) {
    conditions.push(like(column, `%${escLike(ops.endsWith)}`))
  }

  if (conditions.length === 0) {
    throw new Error('Empty operator object in where clause')
  }
  if (conditions.length === 1) return conditions[0]
  return and(...conditions)!
}

/** Escape LIKE-special characters */
function escLike(s: string): string {
  return s.replace(/[%_\\]/g, (c) => `\\${c}`)
}
