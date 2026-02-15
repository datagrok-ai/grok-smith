import type { ComponentType } from 'react'

export interface ClientAppDefinition {
  id: string
  name: string
  icon: ComponentType<{ className?: string }>
  routes: ComponentType
}
