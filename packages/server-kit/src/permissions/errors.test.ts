import { describe, it, expect } from 'vitest'

import { PermissionDeniedError } from './errors'

describe('PermissionDeniedError', () => {
  it('formats the message correctly', () => {
    const err = new PermissionDeniedError('ent-123', 'Edit', 'Study')
    expect(err.message).toBe("Permission denied: requires 'Edit' on entity ent-123")
  })

  it('exposes entityId property', () => {
    const err = new PermissionDeniedError('ent-456', 'View')
    expect(err.entityId).toBe('ent-456')
  })

  it('exposes requiredPermission property', () => {
    const err = new PermissionDeniedError('ent-456', 'Delete')
    expect(err.requiredPermission).toBe('Delete')
  })

  it('exposes optional entityTypeName property', () => {
    const err = new PermissionDeniedError('ent-789', 'Share', 'Widget')
    expect(err.entityTypeName).toBe('Widget')
  })

  it('entityTypeName is undefined when not provided', () => {
    const err = new PermissionDeniedError('ent-789', 'Share')
    expect(err.entityTypeName).toBeUndefined()
  })

  it('has name "PermissionDeniedError"', () => {
    const err = new PermissionDeniedError('ent-1', 'View')
    expect(err.name).toBe('PermissionDeniedError')
  })

  it('is an instance of Error', () => {
    const err = new PermissionDeniedError('ent-1', 'View')
    expect(err).toBeInstanceOf(Error)
  })
})
