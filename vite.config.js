import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        auth: resolve(import.meta.dirname, 'cadastro.html'),
        dashboard: resolve(import.meta.dirname, 'dashboard.html'),
      },
    },
  },
})

