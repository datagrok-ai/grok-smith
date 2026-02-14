import type { ReactNode } from 'react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface ViewSlots {
  name: string
  breadcrumbs?: BreadcrumbItem[]
  toolbox?: ReactNode
  ribbon?: ReactNode
  contextPanel?: ReactNode
  status?: string
}

export interface ShellPanelState {
  toolboxVisible: boolean
  toolboxWidth: number
  contextPanelVisible: boolean
  contextPanelWidth: number
}

export interface ShellActions {
  toggleToolbox: () => void
  toggleContextPanel: () => void
  setToolboxWidth: (width: number) => void
  setContextPanelWidth: (width: number) => void
  requestFullscreen: () => void
}

export interface ShellContextValue {
  panelState: ShellPanelState
  actions: ShellActions
  viewSlots: ViewSlots | null
  registerView: (slots: ViewSlots) => void
  unregisterView: () => void
}

export interface ShellProps {
  appName: string
  children: ReactNode
}

export interface ViewProps {
  name: string
  breadcrumbs?: BreadcrumbItem[]
  toolbox?: ReactNode
  ribbon?: ReactNode
  contextPanel?: ReactNode
  status?: string
  children: ReactNode
}
