import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  resolve: {
    alias: {
      '@datagrok/app-kit': path.resolve(__dirname, '../../packages/app-kit/src'),
      '@datagrok/send/client': path.resolve(__dirname, '../../apps/send/client/src'),
      '@datagrok/send/server': path.resolve(__dirname, '../../apps/send/server'),
      '@datagrok/grit/client': path.resolve(__dirname, '../../apps/grit/client/src'),
      '@datagrok/grit/server': path.resolve(__dirname, '../../apps/grit/server'),
    },
  },
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
    },
  },
})
