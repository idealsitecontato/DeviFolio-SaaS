import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'].filter(name => !env[name]?.trim())
  if (missing.length) {
    throw new Error(`Configuração obrigatória ausente: ${missing.join(', ')}`)
  }

  const buildSha = process.env.VERCEL_GIT_COMMIT_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

  return {
    plugins: [{
      name: 'build-version',
      transformIndexHtml() {
        return [{ tag: 'meta', attrs: { name: 'build-sha', content: buildSha }, injectTo: 'head' }]
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ sha: buildSha }) })
      },
    }],
    server: {
      watch: { ignored: ['**/.visual-*/**', '**/.reference-images/**'] },
    },
    build: {
      rollupOptions: {
        input: {
          landing: resolve(import.meta.dirname, 'index.html'),
          auth: resolve(import.meta.dirname, 'cadastro.html'),
          dashboard: resolve(import.meta.dirname, 'dashboard.html'),
          portfolio: resolve(import.meta.dirname, 'portfolio.html'),
          notFound: resolve(import.meta.dirname, '404.html'),
        },
      },
    },
  }
})
