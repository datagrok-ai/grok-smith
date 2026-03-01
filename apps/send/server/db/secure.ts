import type { Context } from 'hono'
import { createSecureDb, type SecureDb, type AppVariables } from '@datagrok/server-kit'

import { db } from './client'
import * as schema from '../../shared/schema'

type SendSchema = typeof schema

const ENTITY_TYPE_MAP: Record<string, string> = { studies: 'Study' }

/**
 * Creates a permission-aware SecureDb for the current request.
 * Use `sdb.entity.studies.*` for entity operations (permission-filtered)
 * and `sdb.select().from(...)` for detail/lookup tables (raw Drizzle).
 */
export function getSecureDb(
  c: Context<{ Variables: AppVariables }>,
): SecureDb<SendSchema> {
  return createSecureDb(db, schema as unknown as SendSchema, ENTITY_TYPE_MAP, () => ({
    userId: c.var.userId,
    personalGroupId: c.var.personalGroupId,
  }))
}
