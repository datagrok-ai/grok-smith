import { describe, it, expect } from 'vitest'
import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core'
import { getTableColumns, type Column } from 'drizzle-orm'

import { compileWhere } from './where-compiler'

// ── Test table for building a column map ────────────────────────────────────

const testTable = pgTable('test_items', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  status: varchar('status', { length: 50 }),
  priority: integer('priority'),
  createdAt: timestamp('created_at'),
})

function buildColumnMap(): Map<string, Column> {
  const cols = getTableColumns(testTable)
  const map = new Map<string, Column>()
  for (const [key, col] of Object.entries(cols)) {
    map.set(key, col as Column)
  }
  return map
}

describe('compileWhere', () => {
  const columnMap = buildColumnMap()

  // ── Basic cases ─────────────────────────────────────────────────────────

  it('returns undefined for undefined input', () => {
    expect(compileWhere(undefined, columnMap)).toBeUndefined()
  })

  it('returns undefined for empty where object', () => {
    expect(compileWhere({}, columnMap)).toBeUndefined()
  })

  it('skips undefined values in where clause', () => {
    expect(compileWhere({ name: undefined }, columnMap)).toBeUndefined()
  })

  // ── Direct value matching ───────────────────────────────────────────────

  it('compiles direct string equality', () => {
    const result = compileWhere({ name: 'hello' }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles direct number equality', () => {
    const result = compileWhere({ priority: 5 }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles direct boolean equality', () => {
    // Using a non-boolean column with boolean value — compileWhere doesn't type-check the value
    const result = compileWhere({ priority: true as unknown as number }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles null to isNull', () => {
    const result = compileWhere({ name: null }, columnMap)
    expect(result).toBeDefined()
  })

  // ── Operator objects ────────────────────────────────────────────────────

  it('compiles eq operator', () => {
    const result = compileWhere({ name: { eq: 'test' } }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles gt operator', () => {
    const result = compileWhere({ priority: { gt: 3 } }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles gte operator', () => {
    const result = compileWhere({ priority: { gte: 3 } }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles lt operator', () => {
    const result = compileWhere({ priority: { lt: 10 } }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles lte operator', () => {
    const result = compileWhere({ priority: { lte: 10 } }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles not operator with value', () => {
    const result = compileWhere({ name: { not: 'excluded' } }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles not null to isNotNull', () => {
    const result = compileWhere({ name: { not: null } }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles in operator', () => {
    const result = compileWhere({ status: { in: ['active', 'pending'] } }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles notIn operator', () => {
    const result = compileWhere({ status: { notIn: ['deleted', 'archived'] } }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles contains operator', () => {
    const result = compileWhere({ name: { contains: 'test' } }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles startsWith operator', () => {
    const result = compileWhere({ name: { startsWith: 'pre' } }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles endsWith operator', () => {
    const result = compileWhere({ name: { endsWith: 'fix' } }, columnMap)
    expect(result).toBeDefined()
  })

  // ── Combinators ─────────────────────────────────────────────────────────

  it('compiles AND combinator', () => {
    const result = compileWhere({
      AND: [{ name: 'a' }, { priority: 1 }],
    }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles OR combinator', () => {
    const result = compileWhere({
      OR: [{ status: 'active' }, { status: 'pending' }],
    }, columnMap)
    expect(result).toBeDefined()
  })

  it('compiles NOT combinator', () => {
    const result = compileWhere({
      NOT: { status: 'deleted' },
    }, columnMap)
    expect(result).toBeDefined()
  })

  it('combines multiple field conditions with AND', () => {
    const result = compileWhere({ name: 'test', priority: 5 }, columnMap)
    expect(result).toBeDefined()
  })

  it('handles nested AND/OR', () => {
    const result = compileWhere({
      AND: [
        { OR: [{ name: 'a' }, { name: 'b' }] },
        { priority: { gt: 0 } },
      ],
    }, columnMap)
    expect(result).toBeDefined()
  })

  // ── Error cases ─────────────────────────────────────────────────────────

  it('throws on unknown field', () => {
    expect(() => compileWhere({ unknown_field: 'val' }, columnMap)).toThrow(
      'Unknown field in where clause: unknown_field',
    )
  })

  it('throws on empty operator object', () => {
    expect(() => compileWhere({ name: {} }, columnMap)).toThrow(
      'Empty operator object in where clause',
    )
  })
})
