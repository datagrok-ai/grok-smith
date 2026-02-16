import type { DatagrokContext } from '../adapter/types'
import { mockUsers } from './mock-users'

/**
 * Creates a mock DatagrokContext for local development.
 * Returns a fake admin user in standalone mode.
 */
export function createMockAdapter(): DatagrokContext {
  return {
    currentUser: mockUsers[0],
    mode: 'standalone',
  }
}
