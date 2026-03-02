import type { ClientAppDefinition } from '@datagrok/app-kit'
import { ShowcaseIcon } from './app-info'
import { ShowcaseRoutes } from './routes'

export const showcaseApp: ClientAppDefinition = {
  id: 'showcase',
  name: 'Showcase',
  icon: ShowcaseIcon,
  routes: ShowcaseRoutes,
}
