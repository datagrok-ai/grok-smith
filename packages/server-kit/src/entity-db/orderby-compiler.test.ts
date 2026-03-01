import { describe, it, expect } from 'vitest'
import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core'
import { getTableColumns, type Column } from 'drizzle-orm'

import { compileOrderBy } from './orderby-compiler'

const testTable = pgTable('test_items', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  priority: integer('priority'),
})

function buildColumnMap(): Map<string, Column> {
  const cols = getTableColumns(testTable)
  const map = new Map<string, Column>()
  for (const [key, col] of Object.entries(cols)) {
    map.set(key, col as Column)
  }
  return map
}

describe('compileOrderBy', () => {
  const columnMap = buildColumnMap()

  it('returns empty array for undefined input', () => {
    expect(compileOrderBy(undefined, columnMap)).toEqual([])
  })

  it('compiles single field ascending', () => {
    const result = compileOrderBy({ name: 'asc' }, columnMap)
    expect(result).toHaveLength(1)
  })

  it('compiles single field descending', () => {
    const result = compileOrderBy({ priority: 'desc' }, columnMap)
    expect(result).toHaveLength(1)
  })

  it('compiles array of multiple order clauses', () => {
    const result = compileOrderBy(
      [{ name: 'asc' }, { priority: 'desc' }],
      columnMap,
    )
    expect(result).toHaveLength(2)
  })

  it('throws on unknown column', () => {
    expect(() => compileOrderBy({ nonexistent: 'asc' }, columnMap)).toThrow(
      'Unknown field in orderBy: nonexistent',
    )
  })
})
