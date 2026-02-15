import { Hono } from 'hono'
import type { ServerAppDefinition, AppVariables } from '@datagrok/server-kit'
import { studiesRoute } from './routes/studies'
import { uploadRoute } from './routes/upload'

const routes = new Hono<{ Variables: AppVariables }>()
routes.route('/', studiesRoute)
routes.route('/', uploadRoute)

export const sendServerApp: ServerAppDefinition = {
  id: 'send',
  name: 'SEND',
  routes,
}
