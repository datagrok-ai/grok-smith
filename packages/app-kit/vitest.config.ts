import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@datagrok/app-core': path.resolve(__dirname, '../app-core/src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['../test-utils/src/setup-dom.ts'],
  },
})
