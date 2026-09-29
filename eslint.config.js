import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['node_modules/**', 'dist/**', '.vercel/**', '.visual-*/**', '.reference-images/**', '.design-spec/**', 'guio-service/**', 'docs/**'] },
  js.configs.recommended,
  { files: ['**/*.js', '**/*.mjs'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser, ...globals.node } }, rules: { 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }] } },
]
