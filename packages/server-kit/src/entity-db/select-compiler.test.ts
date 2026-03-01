import { describe, it, expect } from 'vitest'
import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core'
import { getTableColumns, type Column } from 'drizzle-orm'

import { compileSelect } from './select-compiler'

const testTable = pgTable('test_items', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  priority: integer('priority'),
  status: varchar('status', { length: 50 }),
})

function buildColumnMap(): Map<string, Column> {
  const cols = getTableColumns(testTable)
  const map = new Map<string, Column>()
  for (const [key, col] of Object.entries(cols)) {
    map.set(key, col as Column)
  }
  return map
}

describe('compileSelect', () => {
  const columnMap = buildColumnMap()

  it('returns undefined when no select is provided', () => {
    expect(compileSelect(undefined, columnMap)).toBeUndefined()
  })

  it('always includes id column', () => {
    const result = compileSelect({ name: true }, columnMap)
    expect(result).toBeDefined()
    expect(result!['id']).toBeDefined()
    expect(result!['name']).toBeDefined()
  })

  it('selects only requested columns plus id', () => {
    const result = compileSelect({ name: true, priority: true }, columnMap)
    expect(result).toBeDefined()
    expect(Object.keys(result!)).toHaveLength(3) // id + name + priority
    expect(result!['id']).toBeDefined()
    expect(result!['name']).toBeDefined()
    expect(result!['priority']).toBeDefined()
    expect(result!['status']).toBeUndefined()
  })

  it('throws on unknown column', () => {
    expect(() => compileSelect({ nonexistent: true }, columnMap)).toThrow(
      'Unknown field in select: nonexistent',
    )
  })

  it('skips fields set to false', () => {
    const result = compileSelect(
      { name: true, priority: false as unknown as true },
      columnMap,
    )
    expect(result).toBeDefined()
    expect(Object.keys(result!)).toHaveLength(2) // id + name
  })
})
