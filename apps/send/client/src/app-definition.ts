import type { ClientAppDefinition } from '@datagrok/app-kit'
import { SendIcon } from './app-info'
import { SendRoutes } from './routes'

export const sendApp: ClientAppDefinition = {
  id: 'send',
  name: 'SEND',
  icon: SendIcon,
  routes: SendRoutes,
}
