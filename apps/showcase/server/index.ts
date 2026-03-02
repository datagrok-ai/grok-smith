import { serve } from '@hono/node-server'
import { createApp } from '@datagrok/server-kit'

const app = createApp({
  name: 'Showcase',
  corsOrigin: 'http://localhost:5176',
  configure: () => {},
})

serve({ fetch: app.fetch, hostname: '0.0.0.0', port: 3004 })
