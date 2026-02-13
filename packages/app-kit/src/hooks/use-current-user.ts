import { useCallback, useEffect, useState } from 'react'

import { useApi } from './use-api'

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
 * Returns loading/error state and the typed user object.
 */
export function useCurrentUser(): UseCurrentUserResult {
  const api = useApi()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<CurrentUser>('/auth/me')
      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch current user')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  return { user, loading, error, refetch: () => void fetchUser() }
}
