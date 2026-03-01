import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@datagrok/app-core': path.resolve(__dirname, '../../packages/app-core/src'),
      '@datagrok/app-kit': path.resolve(__dirname, '../../packages/app-kit/src'),
      '@datagrok/core-schema': path.resolve(__dirname, '../../packages/core-schema/src'),
      '@datagrok/server-kit': path.resolve(__dirname, '../../packages/server-kit/src'),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['../../packages/test-utils/src/setup-dom.ts'],
  },
})
