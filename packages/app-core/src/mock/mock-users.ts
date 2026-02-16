import type { DatagrokUser } from '../adapter/types'

/** Well-known UUIDs from core-schema seed data */
export const ADMIN_USER_ID = '878c42b0-9a50-11e6-c537-6bf8e9ab02ee'
export const SYSTEM_USER_ID = '3e32c5fa-ac9c-4d39-8b4b-4db3e576b3c3'

export const mockUsers: DatagrokUser[] = [
  {
    id: ADMIN_USER_ID,
    login: 'admin',
    displayName: 'Admin',
  },
  {
    id: SYSTEM_USER_ID,
    login: 'system',
    displayName: 'System',
  },
]
