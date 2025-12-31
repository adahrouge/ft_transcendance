

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    https: {
      key: readFileSync(resolve(__dirname, 'certs/key.pem')),
      cert: readFileSync(resolve(__dirname, 'certs/cert.pem')),
    },
    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://backend:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})