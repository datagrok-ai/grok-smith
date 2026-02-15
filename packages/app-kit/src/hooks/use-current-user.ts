import { useCallback, useEffect, useState } from 'react'

import { useDatagrok } from '../adapter/datagrok-provider'

interface CurrentUser {
  id: string
  login: string | null
  firstName: string | null
  lastName: string | null
  friendlyName: string | null
  email: string | null
  status: string | null
}

interface UseCurrentUserResult {
  user: CurrentUser | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetches the current user from `GET /api/auth/me` (provided by server-kit).
 * Uses raw fetch to `/api/auth/me` instead of useApi so auth is always at the
 * root, not scoped per app in platform mode.
 */
export function useCurrentUser(): UseCurrentUserResult {
  const { currentUser } = useDatagrok()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
      })
      if (!res.ok) {
        throw new Error(`Failed to fetch current user (${String(res.status)})`)
      }
      const data = (await res.json()) as CurrentUser
      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch current user')
    } finally {
      setLoading(false)
    }
  }, [currentUser.id])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  return { user, loading, error, refetch: () => void fetchUser() }
}
