import type { ClientAppDefinition } from '@datagrok/app-kit'
import { DbxIcon } from './app-info'
import { DbxRoutes } from './routes'

export const dbxApp: ClientAppDefinition = {
  id: 'dbx',
  name: 'DBX',
  icon: DbxIcon,
  routes: DbxRoutes,
}
