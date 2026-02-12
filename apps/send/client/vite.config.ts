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
      '@datagrok/app-kit': path.resolve(__dirname, '../../../packages/app-kit/src'),
    },
  },
  server: {
    port: 5173,
    host: true, // bind to 0.0.0.0 so it's reachable from Docker host
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
