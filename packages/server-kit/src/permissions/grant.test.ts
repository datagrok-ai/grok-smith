import { describe, it, expect, afterAll } from 'vitest'

import {
  createTestDb,
  withTestTransaction,
  setupPermissionTestData,
  createTestEntity,
} from '@datagrok/test-utils'

import { grantPermission, revokePermission } from './grant'
import { canDo } from './check'
import { PermissionDeniedError } from './errors'

const { db, client } = createTestDb()

afterAll(async () => {
  await client.end()
})

describe('grantPermission', () => {
  it('grants View to another user', async () => {
    await withTestTransaction(db, async (db) => {
      const { userA, userB, entityTypeId, entityTypeName } = await setupPermissionTestData(db)
      const entityId = await createTestEntity(db, entityTypeId, userA.personalGroupId)

      // User B cannot view initially
      expect(await canDo(db, userB.personalGroupId, entityId, 'View', entityTypeName)).toBe(false)

      // User A grants View to User B (User A has Share permission as creator)
      await grantPermission(db, userA.personalGroupId, entityId, 'View', entityTypeName, userB.personalGroupId)

      // User B can now view
      expect(await canDo(db, userB.personalGroupId, entityId, 'View', entityTypeName)).toBe(true)
    })
  })

  it('throws PermissionDeniedError when granter lacks Share', async () => {
    await withTestTransaction(db, async (db) => {
      const { userA, userB, entityTypeId, entityTypeName } = await setupPermissionTestData(db)
      const entityId = await createTestEntity(db, entityTypeId, userA.personalGroupId)

      // User B tries to grant on User A's entity — no Share permission
      await expect(
        grantPermission(db, userB.personalGroupId, entityId, 'View', entityTypeName, userA.personalGroupId),
      ).rejects.toThrow(PermissionDeniedError)
    })
  })

  it('is idempotent — double grant does not error', async () => {
    await withTestTransaction(db, async (db) => {
      const { userA, userB, entityTypeId, entityTypeName } = await setupPermissionTestData(db)
      const entityId = await createTestEntity(db, entityTypeId, userA.personalGroupId)

      await grantPermission(db, userA.personalGroupId, entityId, 'View', entityTypeName, userB.personalGroupId)
      await grantPermission(db, userA.personalGroupId, entityId, 'View', entityTypeName, userB.personalGroupId)

      expect(await canDo(db, userB.personalGroupId, entityId, 'View', entityTypeName)).toBe(true)
    })
  })
})

describe('revokePermission', () => {
  it('revokes a previously granted permission', async () => {
    await withTestTransaction(db, async (db) => {
      const { userA, userB, entityTypeId, entityTypeName } = await setupPermissionTestData(db)
      const entityId = await createTestEntity(db, entityTypeId, userA.personalGroupId)

      // Grant then revoke
      await grantPermission(db, userA.personalGroupId, entityId, 'View', entityTypeName, userB.personalGroupId)
      expect(await canDo(db, userB.personalGroupId, entityId, 'View', entityTypeName)).toBe(true)

      await revokePermission(db, userA.personalGroupId, entityId, 'View', entityTypeName, userB.personalGroupId)
      expect(await canDo(db, userB.personalGroupId, entityId, 'View', entityTypeName)).toBe(false)
    })
  })

  it('throws PermissionDeniedError when revoker lacks Share', async () => {
    await withTestTransaction(db, async (db) => {
      const { userA, userB, entityTypeId, entityTypeName } = await setupPermissionTestData(db)
      const entityId = await createTestEntity(db, entityTypeId, userA.personalGroupId)

      await expect(
        revokePermission(db, userB.personalGroupId, entityId, 'View', entityTypeName, userA.personalGroupId),
      ).rejects.toThrow(PermissionDeniedError)
    })
  })
})
