import { describe, it, expect } from 'vitest'

import { auditColumns } from './helpers'

describe('auditColumns', () => {
  it('returns the five standard audit columns', () => {
    const cols = auditColumns()
    const keys = Object.keys(cols)

    expect(keys).toEqual(['id', 'entityId', 'createdAt', 'updatedAt', 'createdBy'])
  })

  it('returns Drizzle column builder objects for each column', () => {
    const cols = auditColumns()

    // Each column should be a Drizzle column builder (object with config or similar)
    expect(cols.id).toBeDefined()
    expect(cols.entityId).toBeDefined()
    expect(cols.createdAt).toBeDefined()
    expect(cols.updatedAt).toBeDefined()
    expect(cols.createdBy).toBeDefined()
  })
})
