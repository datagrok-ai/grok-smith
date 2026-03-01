import { describe, it, expect, afterAll } from 'vitest'
import { pgTable, varchar } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import {
  createTestDb,
  withTestTransaction,
  setupPermissionTestData,
  TEST_ENTITY_TYPE,
} from '@datagrok/test-utils'
import { auditColumns } from '@datagrok/core-schema'

import { createEntityAccessor } from './entity-accessor'
import { PermissionDeniedError } from '../permissions/errors'
import type { UserContext } from '../permissions/types'

// ── Test table: a simple "test_widgets" table in the public schema ──────────

const widgets = pgTable('test_widgets', {
  ...auditColumns(),
  title: varchar('title', { length: 255 }).notNull(),
})

const { db, client } = createTestDb()

afterAll(async () => {
  await client.end()
})

// Ensure the test_widgets table exists before all tests
async function ensureTestTable(db: Parameters<typeof createEntityAccessor>[0]) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS test_widgets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by UUID NOT NULL REFERENCES users(id),
      title VARCHAR(255) NOT NULL
    )
  `)
}

function makeAccessor(
  db: Parameters<typeof createEntityAccessor>[0],
  userContext: UserContext,
) {
  return createEntityAccessor(db, {
    table: widgets,
    tableName: 'test_widgets',
    accessorName: 'testWidgets',
    columns: [],
    entityTypeName: TEST_ENTITY_TYPE.name,
  }, () => userContext)
}

describe('createEntityAccessor', () => {
  describe('create', () => {
    it('creates an entity and domain row', async () => {
      await withTestTransaction(db, async (db) => {
        await ensureTestTable(db)
        const { userA } = await setupPermissionTestData(db)

        const accessor = makeAccessor(db, {
          userId: userA.userId,
          personalGroupId: userA.personalGroupId,
        })

        const row = await accessor.create({ data: { title: 'My Widget' } })
        expect(row['title']).toBe('My Widget')
        expect(row['id']).toBeDefined()
        expect(row['entityId']).toBeDefined()
        expect(row['createdBy']).toBe(userA.userId)
      })
    })
  })

  describe('findMany', () => {
    it('creator can see their own entity', async () => {
      await withTestTransaction(db, async (db) => {
        await ensureTestTable(db)
        const { userA } = await setupPermissionTestData(db)

        const accessor = makeAccessor(db, {
          userId: userA.userId,
          personalGroupId: userA.personalGroupId,
        })

        await accessor.create({ data: { title: 'Visible Widget' } })
        const rows = await accessor.findMany()
        expect(rows.length).toBeGreaterThanOrEqual(1)
        expect(rows.some((r) => r['title'] === 'Visible Widget')).toBe(true)
      })
    })

    it('another user cannot see entities they have no access to', async () => {
      await withTestTransaction(db, async (db) => {
        await ensureTestTable(db)
        const { userA, userB } = await setupPermissionTestData(db)

        // Create as User A
        const accessorA = makeAccessor(db, {
          userId: userA.userId,
          personalGroupId: userA.personalGroupId,
        })
        await accessorA.create({ data: { title: 'Private Widget' } })

        // Query as User B
        const accessorB = makeAccessor(db, {
          userId: userB.userId,
          personalGroupId: userB.personalGroupId,
        })
        const rows = await accessorB.findMany()
        expect(rows.some((r) => r['title'] === 'Private Widget')).toBe(false)
      })
    })
  })

  describe('findUnique', () => {
    it('returns null for entity user cannot see', async () => {
      await withTestTransaction(db, async (db) => {
        await ensureTestTable(db)
        const { userA, userB } = await setupPermissionTestData(db)

        const accessorA = makeAccessor(db, {
          userId: userA.userId,
          personalGroupId: userA.personalGroupId,
        })
        const created = await accessorA.create({ data: { title: 'Hidden' } })

        const accessorB = makeAccessor(db, {
          userId: userB.userId,
          personalGroupId: userB.personalGroupId,
        })
        const found = await accessorB.findUnique({ where: { id: created['id'] as string } })
        expect(found).toBeNull()
      })
    })
  })

  describe('update', () => {
    it('creator can edit their own entity', async () => {
      await withTestTransaction(db, async (db) => {
        await ensureTestTable(db)
        const { userA } = await setupPermissionTestData(db)

        const accessor = makeAccessor(db, {
          userId: userA.userId,
          personalGroupId: userA.personalGroupId,
        })

        const row = await accessor.create({ data: { title: 'Original' } })
        const updated = await accessor.update({
          where: { id: row['id'] as string },
          data: { title: 'Updated' },
        })
        expect(updated['title']).toBe('Updated')
      })
    })

    it('non-owner gets PermissionDeniedError', async () => {
      await withTestTransaction(db, async (db) => {
        await ensureTestTable(db)
        const { userA, userB } = await setupPermissionTestData(db)

        const accessorA = makeAccessor(db, {
          userId: userA.userId,
          personalGroupId: userA.personalGroupId,
        })
        const row = await accessorA.create({ data: { title: 'Protected' } })

        const accessorB = makeAccessor(db, {
          userId: userB.userId,
          personalGroupId: userB.personalGroupId,
        })
        await expect(
          accessorB.update({ where: { id: row['id'] as string }, data: { title: 'Hacked' } }),
        ).rejects.toThrow(PermissionDeniedError)
      })
    })
  })

  describe('delete', () => {
    it('cascade removes entity and permissions', async () => {
      await withTestTransaction(db, async (db) => {
        await ensureTestTable(db)
        const { userA } = await setupPermissionTestData(db)

        const accessor = makeAccessor(db, {
          userId: userA.userId,
          personalGroupId: userA.personalGroupId,
        })

        const row = await accessor.create({ data: { title: 'ToDelete' } })
        const entityId = row['entityId'] as string

        await accessor.delete({ where: { id: row['id'] as string } })

        // Entity row should be gone
        const entities = await db.execute<{ cnt: number }>(sql`
          SELECT count(*)::int AS cnt FROM entities WHERE id = ${entityId}::uuid
        `)
        expect(entities[0]!.cnt).toBe(0)

        // Permissions should be gone too (CASCADE)
        const perms = await db.execute<{ cnt: number }>(sql`
          SELECT count(*)::int AS cnt FROM permissions WHERE entity_id = ${entityId}::uuid
        `)
        expect(perms[0]!.cnt).toBe(0)
      })
    })
  })

  describe('count', () => {
    it('respects visibility filter', async () => {
      await withTestTransaction(db, async (db) => {
        await ensureTestTable(db)
        const { userA, userB } = await setupPermissionTestData(db)

        const accessorA = makeAccessor(db, {
          userId: userA.userId,
          personalGroupId: userA.personalGroupId,
        })
        await accessorA.create({ data: { title: 'Counted Widget' } })

        // User A sees it
        const countA = await accessorA.count()
        expect(countA).toBeGreaterThanOrEqual(1)

        // User B does not
        const accessorB = makeAccessor(db, {
          userId: userB.userId,
          personalGroupId: userB.personalGroupId,
        })
        const countB = await accessorB.count()
        expect(countB).toBe(0)
      })
    })
  })
})
