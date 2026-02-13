import { serve } from '@hono/node-server'
import { createApp } from '@datagrok/server-kit'

import { studiesRoute } from './routes/studies'
import { uploadRoute } from './routes/upload'

const app = createApp({
  name: 'SEND',
  configure: (app) => {
    app.route('/api', studiesRoute)
    app.route('/api', uploadRoute)
  },
})

serve({ fetch: app.fetch, hostname: '0.0.0.0', port: 3000 })
