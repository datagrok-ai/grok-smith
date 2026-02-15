import { Link, useLocation } from 'react-router-dom'
import type { ClientAppDefinition } from '@datagrok/app-kit'

export function AppBar({ apps }: { apps: ClientAppDefinition[] }) {
  const location = useLocation()

  return (
    <div className="flex w-12 shrink-0 flex-col items-center border-r border-border bg-muted/30 py-2">
      <nav className="flex flex-col items-center gap-1">
        {apps.map((app) => {
          const active = location.pathname.startsWith(`/${app.id}`)
          return (
            <Link
              key={app.id}
              to={`/${app.id}`}
              title={app.name}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <app.icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
