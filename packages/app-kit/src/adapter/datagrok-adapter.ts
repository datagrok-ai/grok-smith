import type { DatagrokContext } from './types'

/**
 * Creates a DatagrokContext that integrates with the real Datagrok platform.
 * This will eventually call the Datagrok JS API to get the current user and context.
 */
export function createDatagrokAdapter(): DatagrokContext {
  throw new Error('Not implemented — use mock adapter for local development.')
}
