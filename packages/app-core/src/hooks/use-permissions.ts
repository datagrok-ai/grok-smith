import { useCallback, useEffect, useState } from 'react'

import { usePrivilegesApi } from '../api/privileges'

interface UseCanDoResult {
  allowed: boolean
  isLoading: boolean
}

/**
 * Check if the current user can perform a specific action on an entity.
 * Calls `/api/privileges/check` and caches the result for the component lifetime.
 */
export function useCanDo(
  entityId: string | undefined,
  permissionName: string,
  entityTypeName: string,
): UseCanDoResult {
  const api = usePrivilegesApi()
  const [allowed, setAllowed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const check = useCallback(async () => {
    if (!entityId) {
      setAllowed(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await api.checkPermission({
        entityId,
        permissionName,
        entityTypeName,
      })
      setAllowed(result.allowed)
    } catch {
      setAllowed(false)
    } finally {
      setIsLoading(false)
    }
  }, [entityId, permissionName, entityTypeName]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void check()
  }, [check])

  return { allowed, isLoading }
}

interface UseEntityPermissionsResult {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canShare: boolean
  isLoading: boolean
}

/**
 * Get all standard permissions the current user has on an entity.
 * Calls `/api/privileges/check-batch` for View/Edit/Delete/Share.
 */
export function useEntityPermissions(
  entityId: string | undefined,
  entityTypeName: string,
): UseEntityPermissionsResult {
  const api = usePrivilegesApi()
  const [permissions, setPermissions] = useState({
    canView: false,
    canEdit: false,
    canDelete: false,
    canShare: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  const check = useCallback(async () => {
    if (!entityId) {
      setPermissions({ canView: false, canEdit: false, canDelete: false, canShare: false })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await api.checkPermissionBatch(
        ['View', 'Edit', 'Delete', 'Share'].map((p) => ({
          entityId,
          permissionName: p,
          entityTypeName,
        })),
      )

      const perms = { canView: false, canEdit: false, canDelete: false, canShare: false }
      for (const r of result.results) {
        if (r.permissionName === 'View') perms.canView = r.allowed
        else if (r.permissionName === 'Edit') perms.canEdit = r.allowed
        else if (r.permissionName === 'Delete') perms.canDelete = r.allowed
        else if (r.permissionName === 'Share') perms.canShare = r.allowed
      }
      setPermissions(perms)
    } catch {
      setPermissions({ canView: false, canEdit: false, canDelete: false, canShare: false })
    } finally {
      setIsLoading(false)
    }
  }, [entityId, entityTypeName]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void check()
  }, [check])

  return { ...permissions, isLoading }
}
