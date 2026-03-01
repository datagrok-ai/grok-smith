import { sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import {
  ALL_USERS_GROUP_ID,
  ADMIN_GROUP_ID,
  ADMIN_USER_ID,
} from '@datagrok/core-schema'

// ── Deterministic UUIDs for test users ──────────────────────────────────────

export const TEST_USER_A = {
  userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  personalGroupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
}

export const TEST_USER_B = {
  userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  personalGroupId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
}

export const TEST_ENTITY_TYPE = {
  id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  name: 'TestWidget',
}

export interface PermissionTestData {
  userA: { userId: string; personalGroupId: string }
  userB: { userId: string; personalGroupId: string }
  entityTypeId: string
  entityTypeName: string
}

/**
 * Inserts canonical test data for permission tests.
 * Must be called within a transaction (use withTestTransaction).
 *
 * Creates:
 * - Two regular users (A and B) with personal groups linked to All Users
 * - A "TestWidget" entity type with View/Edit/Delete/Share permissions
 */
export async function setupPermissionTestData(
  db: PostgresJsDatabase<Record<string, unknown>>,
): Promise<PermissionTestData> {
  // ── User A: personal group → user → link to All Users ─────────────────
  await db.execute(sql`
    INSERT INTO groups (id, friendly_name, name, personal, hidden, created_on, updated_on)
    VALUES (${TEST_USER_A.personalGroupId}::uuid, 'Test User A', 'test-user-a', true, false, now(), now())
  `)
  await db.execute(sql`
    INSERT INTO users (id, email, first_name, last_name, friendly_name, login, group_id, status, has_password, email_confirmed)
    VALUES (
      ${TEST_USER_A.userId}::uuid, 'usera@test.local', 'Test', 'UserA', 'Test UserA', 'test-user-a',
      ${TEST_USER_A.personalGroupId}::uuid, 'active', false, true
    )
  `)
  await db.execute(sql`
    INSERT INTO groups_relations (id, parent_id, child_id)
    VALUES (gen_random_uuid(), ${ALL_USERS_GROUP_ID}::uuid, ${TEST_USER_A.personalGroupId}::uuid)
  `)

  // ── User B: personal group → user → link to All Users ─────────────────
  await db.execute(sql`
    INSERT INTO groups (id, friendly_name, name, personal, hidden, created_on, updated_on)
    VALUES (${TEST_USER_B.personalGroupId}::uuid, 'Test User B', 'test-user-b', true, false, now(), now())
  `)
  await db.execute(sql`
    INSERT INTO users (id, email, first_name, last_name, friendly_name, login, group_id, status, has_password, email_confirmed)
    VALUES (
      ${TEST_USER_B.userId}::uuid, 'userb@test.local', 'Test', 'UserB', 'Test UserB', 'test-user-b',
      ${TEST_USER_B.personalGroupId}::uuid, 'active', false, true
    )
  `)
  await db.execute(sql`
    INSERT INTO groups_relations (id, parent_id, child_id)
    VALUES (gen_random_uuid(), ${ALL_USERS_GROUP_ID}::uuid, ${TEST_USER_B.personalGroupId}::uuid)
  `)

  // ── TestWidget entity type + standard permissions ─────────────────────
  await db.execute(sql`
    INSERT INTO entity_types (id, name, is_package_entity)
    VALUES (${TEST_ENTITY_TYPE.id}::uuid, ${TEST_ENTITY_TYPE.name}, true)
    ON CONFLICT (name) DO NOTHING
  `)
  for (const permName of ['View', 'Edit', 'Delete', 'Share']) {
    await db.execute(sql`
      INSERT INTO entity_types_permissions (id, name, entity_type_id)
      VALUES (gen_random_uuid(), ${permName}, ${TEST_ENTITY_TYPE.id}::uuid)
      ON CONFLICT (name, entity_type_id) DO NOTHING
    `)
  }

  return {
    userA: TEST_USER_A,
    userB: TEST_USER_B,
    entityTypeId: TEST_ENTITY_TYPE.id,
    entityTypeName: TEST_ENTITY_TYPE.name,
  }
}

/**
 * Creates an entity owned by the specified user group and returns its entity ID.
 * The DB trigger auto-grants all permissions to the creator's group.
 */
export async function createTestEntity(
  db: PostgresJsDatabase<Record<string, unknown>>,
  entityTypeId: string,
  creatorGroupId: string,
): Promise<string> {
  const result = await db.execute<{ id: string }>(sql`
    INSERT INTO entities (id, entity_type_id, created_by_group_id)
    VALUES (gen_random_uuid(), ${entityTypeId}::uuid, ${creatorGroupId}::uuid)
    RETURNING id
  `)
  const entityId = result[0]?.id
  if (!entityId) throw new Error('Failed to create test entity')
  return entityId
}

// Re-export well-known IDs for convenience in test files
export { ALL_USERS_GROUP_ID, ADMIN_GROUP_ID, ADMIN_USER_ID }
