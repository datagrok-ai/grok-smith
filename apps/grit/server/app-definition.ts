import { Hono } from 'hono'
import type { ServerAppDefinition, AppVariables } from '@datagrok/server-kit'
import { projectsRoute } from './routes/projects'
import { issuesRoute } from './routes/issues'

const routes = new Hono<{ Variables: AppVariables }>()
routes.route('/', projectsRoute)
routes.route('/', issuesRoute)

export const gritServerApp: ServerAppDefinition = {
  id: 'grit',
  name: 'GRIT',
  routes,
}
