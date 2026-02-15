import type { ClientAppDefinition } from '@datagrok/app-kit'
import { GritIcon } from './app-info'
import { GritRoutes } from './routes'

export const gritApp: ClientAppDefinition = {
  id: 'grit',
  name: 'GRIT',
  icon: GritIcon,
  routes: GritRoutes,
}
