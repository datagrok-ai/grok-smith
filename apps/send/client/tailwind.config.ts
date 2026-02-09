import path from 'path'
import { fileURLToPath } from 'url'

import type { Config } from 'tailwindcss'

import appKitPreset from '../../../packages/app-kit/src/theme/tailwind-preset'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const config: Config = {
  presets: [appKitPreset as Config],
  content: [
    path.resolve(__dirname, 'src/**/*.{ts,tsx}'),
    path.resolve(__dirname, '../../../packages/app-kit/src/**/*.{ts,tsx}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
