import type { Config } from 'tailwindcss'
import appKitPreset from '../../../packages/app-kit/src/theme/tailwind-preset'

const config: Config = {
  presets: [appKitPreset as Config],
  content: [
    './src/**/*.{ts,tsx}',
    '../../../packages/app-kit/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
