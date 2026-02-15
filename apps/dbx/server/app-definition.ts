import { Hono } from 'hono'
import type { ServerAppDefinition, AppVariables } from '@datagrok/server-kit'
import { schemasRoute } from './routes/schemas'

const routes = new Hono<{ Variables: AppVariables }>()
routes.route('/', schemasRoute)

export const dbxServerApp: ServerAppDefinition = {
  id: 'dbx',
  name: 'DBX',
  routes,
}
