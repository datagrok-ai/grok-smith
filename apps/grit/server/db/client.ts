import { createDb } from '@datagrok/server-kit'

import * as schema from '../../shared/schema'

export const db = createDb({ schema })
