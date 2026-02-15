import { serve } from '@hono/node-server'
import { createApp, createDb, authRoutes } from '@datagrok/server-kit'

import { sendServerApp } from '@datagrok/send/server/app-definition'
import { gritServerApp } from '@datagrok/grit/server/app-definition'

const apps = [sendServerApp, gritServerApp]

const db = createDb({ schema: {} })

const app = createApp({
  name: 'MiniGrok',
  corsOrigin: 'http://localhost:5174',
  configure: (host) => {
    host.route('/', authRoutes(db))
    for (const a of apps) host.route(`/api/${a.id}`, a.routes)
  },
})

serve({ fetch: app.fetch, hostname: '0.0.0.0', port: 3002 })
