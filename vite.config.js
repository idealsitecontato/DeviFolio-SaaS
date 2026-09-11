import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'].filter(name => !env[name]?.trim())
  if (missing.length) {
    throw new Error(`Configuração obrigatória ausente: ${missing.join(', ')}`)
  }

  return {
    build: {
      rollupOptions: {
        input: {
          landing: resolve(import.meta.dirname, 'index.html'),
          auth: resolve(import.meta.dirname, 'cadastro.html'),
          dashboard: resolve(import.meta.dirname, 'dashboard.html'),
          portfolio: resolve(import.meta.dirname, 'portfolio.html'),
        },
      },
    },
  }
})
