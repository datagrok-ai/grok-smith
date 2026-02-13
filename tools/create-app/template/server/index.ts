import { serve } from '@hono/node-server'
import { createApp } from '@datagrok/server-kit'

const app = createApp({
  name: '{{APP_NAME_PASCAL}}',
  configure: (_app) => {
    // Register app-specific routes here:
    // app.route('/api', myRoutes)
  },
})

serve({ fetch: app.fetch, hostname: '0.0.0.0', port: 3000 })
