import { serve } from '@hono/node-server'
import { createApp, registerEntityType } from '@datagrok/server-kit'

import { db } from './db/client'
import { studiesRoute } from './routes/studies'
import { uploadRoute } from './routes/upload'

// Register 'Study' entity type (idempotent — safe on every startup)
await registerEntityType(db, 'Study')

const app = createApp({
  name: 'SEND',
  db,
  configure: (app) => {
    app.route('/api', studiesRoute)
    app.route('/api', uploadRoute)
  },
})

serve({ fetch: app.fetch, hostname: '0.0.0.0', port: 3000 })
