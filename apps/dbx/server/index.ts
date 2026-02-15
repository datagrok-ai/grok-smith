import { serve } from '@hono/node-server'
import { createApp } from '@datagrok/server-kit'

import { schemasRoute } from './routes/schemas'

const app = createApp({
  name: 'DBX',
  corsOrigin: 'http://localhost:5175',
  configure: (app) => {
    app.route('/api', schemasRoute)
  },
})

serve({ fetch: app.fetch, hostname: '0.0.0.0', port: 3003 })
