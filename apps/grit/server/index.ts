import { serve } from '@hono/node-server'
import { createApp } from '@datagrok/server-kit'

import { projectsRoute } from './routes/projects'
import { issuesRoute } from './routes/issues'

const app = createApp({
  name: 'GRIT',
  configure: (app) => {
    app.route('/api', projectsRoute)
    app.route('/api', issuesRoute)
  },
})

serve({ fetch: app.fetch, hostname: '0.0.0.0', port: 3001 })
