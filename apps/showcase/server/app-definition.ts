import { Hono } from 'hono'
import type { ServerAppDefinition, AppVariables } from '@datagrok/server-kit'

const routes = new Hono<{ Variables: AppVariables }>()

export const showcaseServerApp: ServerAppDefinition = {
  id: 'showcase',
  name: 'Showcase',
  routes,
}
