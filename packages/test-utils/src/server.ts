import { ADMIN_USER_ID } from '@datagrok/core-schema'

/**
 * Creates headers for authenticated Hono app.request() calls.
 * Defaults to the admin user if no userId is provided.
 */
export function createTestHeaders(userId?: string): Record<string, string> {
  return {
    'X-User-Id': userId ?? ADMIN_USER_ID,
    'Content-Type': 'application/json',
  }
}
