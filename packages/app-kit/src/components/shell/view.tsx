import { useEffect } from 'react'

import { useShell } from './shell-context'
import type { ViewProps } from './shell-types'

export function View({
  name,
  breadcrumbs,
  toolbox,
  ribbon,
  contextPanel,
  status,
  children,
}: ViewProps) {
  const { registerView, unregisterView } = useShell()

  useEffect(() => {
    registerView({ name, breadcrumbs, toolbox, ribbon, contextPanel, status })
  }, [name, breadcrumbs, toolbox, ribbon, contextPanel, status, registerView])

  useEffect(() => {
    return () => unregisterView()
  }, [unregisterView])

  return <>{children}</>
}
