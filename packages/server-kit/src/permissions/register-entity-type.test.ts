import { describe, it, expect, afterAll } from 'vitest'
import { sql } from 'drizzle-orm'

import { createTestDb, withTestTransaction } from '@datagrok/test-utils'

import { registerEntityType } from './register-entity-type'

const { db, client } = createTestDb()

afterAll(async () => {
  await client.end()
})

describe('registerEntityType', () => {
  it('creates entity type with standard permissions', async () => {
    await withTestTransaction(db, async (db) => {
      await registerEntityType(db, 'RegTestType')

      // Verify entity type exists
      const types = await db.execute<{ name: string }>(sql`
        SELECT name FROM entity_types WHERE name = 'RegTestType'
      `)
      expect(types).toHaveLength(1)
      expect(types[0]!.name).toBe('RegTestType')

      // Verify standard permissions
      const perms = await db.execute<{ name: string }>(sql`
        SELECT etp.name
        FROM entity_types_permissions etp
        INNER JOIN entity_types et ON et.id = etp.entity_type_id
        WHERE et.name = 'RegTestType'
        ORDER BY etp.name
      `)
      expect(perms.map((p) => p.name)).toEqual(['Delete', 'Edit', 'Share', 'View'])
    })
  })

  it('is idempotent — re-registering does not error or duplicate', async () => {
    await withTestTransaction(db, async (db) => {
      await registerEntityType(db, 'IdempotentType')
      await registerEntityType(db, 'IdempotentType')

      const types = await db.execute<{ cnt: number }>(sql`
        SELECT count(*)::int AS cnt FROM entity_types WHERE name = 'IdempotentType'
      `)
      expect(types[0]!.cnt).toBe(1)

      const perms = await db.execute<{ cnt: number }>(sql`
        SELECT count(*)::int AS cnt
        FROM entity_types_permissions etp
        INNER JOIN entity_types et ON et.id = etp.entity_type_id
        WHERE et.name = 'IdempotentType'
      `)
      expect(perms[0]!.cnt).toBe(4) // View, Edit, Delete, Share
    })
  })

  it('registers additional permissions beyond the standard four', async () => {
    await withTestTransaction(db, async (db) => {
      await registerEntityType(db, 'ExtraPermType', ['Execute', 'Approve'])

      const perms = await db.execute<{ name: string }>(sql`
        SELECT etp.name
        FROM entity_types_permissions etp
        INNER JOIN entity_types et ON et.id = etp.entity_type_id
        WHERE et.name = 'ExtraPermType'
        ORDER BY etp.name
      `)
      expect(perms.map((p) => p.name)).toEqual([
        'Approve', 'Delete', 'Edit', 'Execute', 'Share', 'View',
      ])
    })
  })
})
