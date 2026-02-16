/**
 * Shared User type matching the datagrok_users table structure.
 * This is the canonical user representation across all apps.
 */
export type User = {
  id: string
  login: string
  displayName: string
}
