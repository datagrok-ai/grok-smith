import { describe, it, expect, afterAll } from 'vitest'

import {
  createTestDb,
  withTestTransaction,
  setupPermissionTestData,
  createTestEntity,
} from '@datagrok/test-utils'
import { ADMIN_GROUP_ID } from '@datagrok/core-schema'

import { canDo, isAdmin } from './check'

const { db, client } = createTestDb()

afterAll(async () => {
  await client.end()
})

describe('canDo', () => {
  it('returns true for creator who has been auto-granted permissions', async () => {
    await withTestTransaction(db, async (db) => {
      const { userA, entityTypeId, entityTypeName } = await setupPermissionTestData(db)
      const entityId = await createTestEntity(db, entityTypeId, userA.personalGroupId)

      const result = await canDo(db, userA.personalGroupId, entityId, 'Edit', entityTypeName)
      expect(result).toBe(true)
    })
  })

  it('returns false for user without a grant', async () => {
    await withTestTransaction(db, async (db) => {
      const { userA, userB, entityTypeId, entityTypeName } = await setupPermissionTestData(db)
      const entityId = await createTestEntity(db, entityTypeId, userA.personalGroupId)

      const result = await canDo(db, userB.personalGroupId, entityId, 'Edit', entityTypeName)
      expect(result).toBe(false)
    })
  })

  it('returns true for admin user (admin bypass)', async () => {
    await withTestTransaction(db, async (db) => {
      const { userA, entityTypeId, entityTypeName } = await setupPermissionTestData(db)
      const entityId = await createTestEntity(db, entityTypeId, userA.personalGroupId)

      const result = await canDo(db, ADMIN_GROUP_ID, entityId, 'View', entityTypeName)
      expect(result).toBe(true)
    })
  })

  it('creator has all four standard permissions', async () => {
    await withTestTransaction(db, async (db) => {
      const { userA, entityTypeId, entityTypeName } = await setupPermissionTestData(db)
      const entityId = await createTestEntity(db, entityTypeId, userA.personalGroupId)

      for (const perm of ['View', 'Edit', 'Delete', 'Share']) {
        const result = await canDo(db, userA.personalGroupId, entityId, perm, entityTypeName)
        expect(result, `expected ${perm} to be true`).toBe(true)
      }
    })
  })
})

describe('isAdmin', () => {
  it('returns true for admin group', async () => {
    await withTestTransaction(db, async (db) => {
      const result = await isAdmin(db, ADMIN_GROUP_ID)
      expect(result).toBe(true)
    })
  })

  it('returns false for regular user', async () => {
    await withTestTransaction(db, async (db) => {
      const { userA } = await setupPermissionTestData(db)
      const result = await isAdmin(db, userA.personalGroupId)
      expect(result).toBe(false)
    })
  })
})
