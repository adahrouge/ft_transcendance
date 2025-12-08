

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
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
  preview: {
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