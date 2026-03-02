import { serve } from '@hono/node-server'
import { createApp, createDb, authRoutes, registerEntityType } from '@datagrok/server-kit'

import { sendServerApp } from '@datagrok/send/server/app-definition'
import { gritServerApp } from '@datagrok/grit/server/app-definition'
import { dbxServerApp } from '@datagrok/dbx/server/app-definition'
import { showcaseServerApp } from '@datagrok/showcase/server/app-definition'

const apps = [sendServerApp, gritServerApp, dbxServerApp, showcaseServerApp]

const db = createDb({ schema: {} })

// Register entity types used by apps (idempotent — safe on every startup)
await registerEntityType(db, 'Study')

const app = createApp({
  name: 'MiniGrok',
  db,
  corsOrigin: 'http://localhost:5174',
  configure: (host) => {
    host.route('/', authRoutes(db))
    for (const a of apps) host.route(`/api/${a.id}`, a.routes)
  },
})

serve({ fetch: app.fetch, hostname: '0.0.0.0', port: 3002 })
