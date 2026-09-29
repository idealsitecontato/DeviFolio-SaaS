import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
const baseline = '8f9226f7c9e820fd6ca6cf374bf70878bcf81956'
const files = execFileSync('git', ['diff', baseline, '--name-only'], { encoding: 'utf8' }).trim().split('\n')
const summaries = {
  '.gitignore': 'Exclui perfis privados de navegador e dependências locais de validação.',
  'vercel.json': 'Configura build Vite e headers de revalidação/versionamento.',
  'vite.config.js': 'Identifica SHA do build, renderiza componentes Auth e inclui páginas legais.',
  'package.json': 'Adiciona comandos lint, typecheck e test e ferramentas de revisão.',
  'package-lock.json': 'Trava as ferramentas adicionadas para instalação reproduzível.',
  'eslint.config.js': 'Regras de lint e escopos de arquivos.',
  'tsconfig.json': 'Validação TypeScript dos módulos e checagem dos módulos novos.',
  'dashboard.js': 'Remove declarações e funções sem uso sem modificar fluxos ativos.',
  'index.html': 'Hero e seções completas da landing segundo a referência.',
  'cadastro.html': 'Shell compartilhado do Login/Cadastro/recuperação.',
  'foliodev-landing.css': 'Proporções, cores, responsividade e interações da landing.',
  'foliodev-auth.css': 'Composição 50/50 e controles de autenticação.',
  'script.js': 'Menu, FAQ/âncoras e preços a partir dos planos existentes.',
  'auth.js': 'Validação, persistência, Google, senha visível, termos e cadastro no servidor.',
  'src/lib/supabase.js': 'Storage selecionável e consulta de disponibilidade do Google.',
  'src/lib/auth-storage.js': 'Migração e limpeza dos tokens entre os dois storages.',
  'src/ui/auth-components.js': 'AuthLayout, AuthInput, AuthButton, SocialButton e Logo.',
  'server/github-login.js': 'Exige e-mail verificado do GitHub.',
  'api/auth/github/start.js': 'Solicita escopo de leitura de e-mails verificados.',
  'api/auth/github/session.js': 'Valida Origin na troca de ticket de sessão.',
  'api/auth/signup.js': 'Cadastro Supabase com validação no servidor e bloqueio de Origin externo.',
  'server/signup-validation.js': 'Regras puras de identidade, senha, confirmação e termos.',
  'termos.html': 'Termos de Uso com link real.',
  'privacidade.html': 'Política de Privacidade com link real.',
  'legal.css': 'Layout legível das páginas legais.',
  'public/robots.txt': 'Arquivo válido para rastreadores.',
  'public/sitemap.xml': 'Mapa das páginas públicas principais.',
}
function describe(file) {
  if (summaries[file]) return summaries[file]
  if (file.startsWith('public/brand/')) return 'Marca reconstruída em SVG.'
  if (file.startsWith('public/icons/')) return 'Ícone vetorial de provedor.'
  if (file.startsWith('public/hero/')) return 'Recorte transparente da foto em resolução adaptativa.'
  if (file.startsWith('tests/')) return 'Teste de persistência ou validação do cadastro.'
  if (file.startsWith('scripts/')) return 'Ferramenta reproduzível de auditoria, extração ou verificação.'
  if (file.startsWith('docs/comparativos/fontes/')) return 'Fonte e medições usadas somente na comparação tipográfica.'
  if (file.startsWith('docs/comparativos/')) return 'Captura, referência normalizada, comparação visual ou evidência de teste.'
  if (file.startsWith('docs/referencias/')) return 'Gabarito original do ZIP, fora da pasta pública.'
  return 'Relatório ou evidência de diagnóstico/publicação.'
}
const extras = ['scripts/list-changes.mjs', 'scripts/verify-production.mjs', 'docs/ARQUIVOS-ALTERADOS.md', 'docs/publicacao-final.json']
const all = [...new Set([...files, ...extras])].sort()
const document = `# Arquivos criados ou alterados\n\nComparação com o estado inicial ${baseline.slice(0, 7)}. Arquivos locais anteriores à execução foram preservados. A lista inclui os registros das quatro fases e seus scripts.\n\n| Arquivo | Resumo |\n|---|---|\n${all.map(file => `| [${file.replaceAll('|', '\\|')}](../${file}) | ${describe(file)} |`).join('\n')}\n`
await writeFile('docs/ARQUIVOS-ALTERADOS.md', document)
console.log(`${all.length} arquivos documentados`)
