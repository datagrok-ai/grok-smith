import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@datagrok/core-schema': path.resolve(__dirname, '../core-schema/src'),
      '@datagrok/test-utils': path.resolve(__dirname, '../test-utils/src'),
    },
  },
  test: {
    environment: 'node',
    testTimeout: 10000,
  },
})
