import { documentPreview, statusBadge, emptyMarkup } from './src/ui/components.js'
import { portfolioModels, templateModels, getPortfolioModel, modelPreviewUrl } from './src/lib/portfolio-models.js'
import { renderPlanCards } from './plans.js'
import { supabase } from './src/lib/supabase.js'
import {
  deleteCurrentAccount,
  loadWorkspace,
  moveProject,
  removeProject,
  removeProjectImage,
  saveProfile,
  savePortfolioModel,
  saveProject,
  saveSettings,
  uploadAvatar,
  portfolioBannerUrl,
  uploadPortfolioBanner,
  uploadProjectImage,
} from './src/lib/user-data.js'
import QRCode from 'qrcode'
import { createScreenLoading } from './screen-loading.js'
import { mountGooeySpinners, UploadButton } from './src/ui/visual-components.js'
import { portfolioFolders, projectLocation, nextSortOrder, orderedFolders, restorePortfolioFolders, planProjectMove, persistProjectMove } from './src/lib/project-location.js'
import { planGithubImport, importedGithubProject } from './src/lib/github-import.js'
import { bindExplorerDrag } from './src/lib/explorer-drag.js'
import { kapteiView, bindKapteiActions } from './kaptei.js'
import { readVisualPublications, recordVisualPublication } from './src/lib/visual-publications.js'
import './src/lib/build-version.js'

const githubIconUrl = new URL('./assets/github-icon.webp', import.meta.url).href
const profilePlaceholderUrl = new URL('./assets/user-placeholder.png', import.meta.url).href

const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
const motionDuration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : parseFloat(getComputedStyle(document.body).getPropertyValue('--motion-fast')) || 180
const screenLoading = createScreenLoading({ shell: document.querySelector('.app-shell'), loading: document.querySelector('#app-loading') })
mountGooeySpinners()
let renderedRoute = null
let bootstrapping = true
const esc = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
const PROJECT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const PROJECT_IMAGE_MAX_BYTES = 5 * 1024 * 1024

function validateProjectImage(file) {
  if (!file) return ''
  if (!PROJECT_IMAGE_TYPES.has(file.type)) return 'Formato não permitido. Envie somente uma imagem JPG, PNG ou WEBP. Vídeos e outros arquivos não são aceitos.'
  if (file.size > PROJECT_IMAGE_MAX_BYTES) return 'A imagem ultrapassa o limite de 5 MB. Escolha um arquivo menor.'
  return ''
}

const icons = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V21h14V10.5M9 21v-6h6v6"/>',
  folder: '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2z"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.36 6.8-1.62 6.8-7.25A5.7 5.7 0 0 0 19.3 3.3 5.3 5.3 0 0 0 19.15 0S18 0 15 1.5a13.4 13.4 0 0 0-7 0C5 0 3.85 0 3.85 0a5.3 5.3 0 0 0-.15 3.3 5.7 5.7 0 0 0-1.5 3.95c0 5.62 3.5 6.88 6.8 7.25A4.8 4.8 0 0 0 8 18v4"/><path d="M8 19c-3 .9-3-1.5-4.2-2"/>',
  chart: '<path d="M5 20V10M10 20V4M15 20v-7M20 20V7"/><path d="M2 20h20"/>',
  layout: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M14 9l-3 3 3 3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34A1.7 1.7 0 0 0 14 20.92V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14v-4a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.34-1.88l2.83-2.83A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l2.83 2.83A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.52 1H21v4a1.7 1.7 0 0 0-1.6 1z"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  crown: '<path d="m3 7 4 4 5-7 5 7 4-4-2 12H5z"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.07.07l2-2A5 5 0 0 0 12 4l-1.15 1.15"/><path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15"/>',
  copy: '<rect x="9" y="9" width="12" height="12"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 14h3v7h-3M14 19h2v2h-2"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/>',
  external: '<path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  check: '<path d="m5 12 4 4L19 6"/>', upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 20h16"/>',
  rocket: '<path d="M12 15 9 12c1-5 5-9 12-9 0 7-4 11-9 12zM9 12H4l4-5h4M12 15v5l5-4v-4M7 16c-2 0-3 2-3 4 2 0 4-1 4-3"/><circle cx="16" cy="8" r="1.5"/>',
  download: '<path d="M12 4v12m-5-5 5 5 5-5"/><path d="M4 20h16"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', repo: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z"/><path d="M8 7h6"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a1 1 0 0 1 0-2h2a7 7 0 0 0-2-11z"/>',
  lock: '<rect x="4" y="10" width="16" height="11"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>', trending: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  mail: '<rect x="3" y="5" width="18" height="14"/><path d="m3 7 9 6 9-6"/>',
}

function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach(element => {
    if (element.dataset.icon === 'github') {
      element.innerHTML = `<span class="github-icon" aria-hidden="true"><img src="${githubIconUrl}" alt="" decoding="async"></span>`
      return
    }
    const paths = icons[element.dataset.icon]
    if (paths) element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
  })
}

const blankProfile = { name: '', username: '', email: '', role: '', bio: '', skills: '', linkedin: '', github: '', website: '', avatar: '', selectedModel: 'white' }
const blankSettings = { email: true, product: true, publicProfile: true, compact: false }
const state = { projects: [], folderNames: {}, folderOrder: [], hiddenFolders: [], profile: { ...blankProfile }, published: false, githubConnected: false, githubUsername: '', repos: [], analytics: [], leads: [], leadsAvailable: true, settings: { ...blankSettings } }
let visualPublications = { folders: {}, events: [] }
let selectedFolderId = null
let portfolioLayout = 'grid'
let profileBannerRevision = ''
let publicationHistoryExpanded = false
let modelQuery = ''
let modelCategory = 'Todos'
let modelPage = 1
const projectVisualType = project => /(?:^|[\s/_-])landing(?:[\s/_-]|$)/i.test(`${project.name} ${project.description || ''} ${project.link || ''}`) ? 'landing' : 'site'
const projectTypeChip = project => {
  const type = projectVisualType(project)
  return `<span class="project-type ${type}">${type === 'landing' ? 'Landing page' : 'Site'}</span>`
}
let currentUser = null
let reposLoading = false
let reposLoaded = false
let reposPromise = null
let githubConnectionChecked = false
let repoLoadFailed = false
const onboardingRequested = new URLSearchParams(location.search).get('onboarding') === '1'

const realName = () => state.profile.name.trim() || currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Você'
const initials = () => realName().split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase()
const profileComplete = () => Boolean(state.profile.name.trim() && state.profile.username.trim())
const folderName = id => state.folderNames[id] || portfolioFolders.find(folder => folder.id === id)?.name || ''
const visiblePortfolioFolders = () => orderedFolders(state.folderOrder).filter(folder => !state.hiddenFolders.includes(folder.id) && (Object.hasOwn(state.folderNames, folder.id) || state.projects.some(project => projectLocation(project) === folder.id)))
const projectsAt = destination => state.projects.filter(project => projectLocation(project) === destination).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
const publicPortfolioUrl = () => {
  const username = encodeURIComponent(state.profile.username.trim().toLowerCase())
  return /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? `${location.origin}/portfolio.html?username=${username}` : `${location.origin}/portfolio/${username}`
}
function openPortfolioPreview() {
  if (!currentUser) return
  const snapshot = { profile: { ...state.profile, userId: currentUser.id }, projects: state.projects.filter(project => project.status === 'published') }
  sessionStorage.setItem(`foliodev_preview_${currentUser.id}`, JSON.stringify(snapshot))
  const url = new URL('portfolio.html', location.href)
  url.searchParams.set('username', state.profile.username || currentUser.id)
  url.searchParams.set('preview', '1')
  url.searchParams.set('visitor', '1')
  location.assign(url.href)
}
const secondaryPortfolioUrl = id => {
  if (!state.profile.username.trim()) return ''
  const url = new URL(publicPortfolioUrl())
  url.searchParams.set('folder', id)
  url.searchParams.set('name', folderName(id))
  return url.href
}
const normalizeExternalUrl = value => {
  const text = String(value || '').trim()
  if (!text) return ''
  return /^https?:\/\//i.test(text) ? text : `https://${text}`
}

function pageHead(title, description, action = '') {
  return `<header class="page-head"><div><p class="eyebrow">Painel FolioDev</p><h1>${title}</h1><p>${description}</p></div>${action}</header>`
}

function emptyState(icon, title, description, action = '') {
  return emptyMarkup(title,description,action)
}

function analyticsSummary() {
  const views = state.analytics.filter(event => event.event_type === 'portfolio_view')
  const clicks = state.analytics.filter(event => event.event_type === 'link_click' || event.event_type === 'project_view')
  const visitors = new Set(views.map(event => event.visitor_id).filter(Boolean)).size
  return { views: views.length, clicks: clicks.length, visitors, rate: views.length ? Math.round((clicks.length / views.length) * 100) : 0 }
}

async function renderPortfolioQR() {
  const canvas = $('#portfolio-qr')
  if (!canvas || !state.profile.username.trim()) return
  try {
    await QRCode.toCanvas(canvas, publicPortfolioUrl(), { width: 512, margin: 2, color: { dark: '#111111', light: '#ffffff' }, errorCorrectionLevel: 'M' })
  } catch (error) {
    console.error('[Devifolio] Falha ao gerar QR Code', error)
    toast('Não foi possível gerar o QR Code.', 'error')
  }
}

let analyticsPeriod = 7

function analyticsChart({ compact = false } = {}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: analyticsPeriod }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - analyticsPeriod + index + 1)
    return date
  })
  const viewsByDate = new Map()
  state.analytics.filter(event => event.event_type === 'portfolio_view').forEach(event => {
    const date = new Date(event.created_at)
    if (Number.isNaN(date.getTime())) return
    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    viewsByDate.set(key, (viewsByDate.get(key) || 0) + 1)
  })
  const counts = days.map(date => viewsByDate.get(date.getTime()) || 0)
  const max = Math.max(4, ...counts)
  const total = counts.reduce((sum, count) => sum + count, 0)
  const buttons = [7, 30, 90].map(period => `<button type="button" data-analytics-period="${period}" aria-pressed="${period === analyticsPeriod}" class="${period === analyticsPeriod ? 'active' : ''}">${period} dias</button>`).join('')
  const bars = days.map((date, index) => {
    const count = counts[index]
    const label = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)
    const showLabel = analyticsPeriod === 7 || index % Math.ceil(analyticsPeriod / 7) === 0 || index === days.length - 1
    return `<span class="visual-chart-column" title="${label}: ${count} visualizações"><i style="height:${count ? Math.max(3, count / max * 100) : 0}%"></i><small>${showLabel ? label : ''}</small></span>`
  }).join('')
  return `<article class="card visual-chart ${compact ? 'visual-chart-compact' : ''}"><div class="visual-chart-head"><div><h2>Visualizações</h2><p>${total} ${total === 1 ? 'visualização' : 'visualizações'} nos últimos ${analyticsPeriod} dias</p></div><div class="visual-chart-period" role="group" aria-label="Período do gráfico">${buttons}</div></div><div class="visual-chart-plot" role="img" aria-label="Gráfico de visualizações reais nos últimos ${analyticsPeriod} dias"><div class="visual-chart-grid" aria-hidden="true"><span>${max}</span><span>${Math.round(max / 2)}</span><span>0</span></div><div class="visual-chart-bars">${bars}</div></div>${compact ? '<button class="link-button" type="button" data-route-button="portfolio">Abrir portfólio →</button>' : ''}</article>`
}

function homeView() {
  const summary=analyticsSummary()
  const repositoryPreview = state.repos.slice(0, 4).map(repository => `<li><button type="button" data-route-button="github"><span data-icon="github" aria-hidden="true"></span><span class="home-repo-copy"><strong>${esc(repository.full_name || repository.name)}</strong><small>${esc(repository.description || 'Repositório GitHub')}</small></span><span class="home-repo-visibility">${repository.private ? 'Privado' : 'Público'}</span><span data-icon="chevron" aria-hidden="true"></span></button></li>`).join('')
  const githubContent = state.githubConnected
    ? `<div class="home-import-content home-repositories">${reposLoading ? '<p>Buscando repositórios...</p>' : repoLoadFailed ? '<p>Não foi possível carregar os repositórios.</p><button class="secondary-button" data-retry-repos>Tentar novamente</button>' : repositoryPreview ? `<ul class="home-repository-list">${repositoryPreview}<li><button type="button" data-route-button="github" class="home-repo-all"><span data-icon="github" aria-hidden="true"></span><strong>Ver todos os repositórios</strong><span data-icon="chevron" aria-hidden="true"></span></button></li></ul>` : '<p>Nenhum repositório encontrado nesta conta.</p>'}</div>`
    : `<div class="home-import-content"><span class="home-import-symbol" data-icon="github" aria-hidden="true"></span><h3>Conecte seu GitHub e sincronize seus projetos</h3><p>Conecte sua conta para importar e sincronizar seus repositórios automaticamente.</p><button class="primary-button" data-connect-github><span data-icon="github"></span>Conectar GitHub</button></div>`
  return `<section class="page-enter home-page">
    ${pageHead('Olá, '+esc(realName().split(' ')[0])+'.', 'Seu trabalho, organizado para a próxima oportunidade.', '<button class="primary-button" data-new-portfolio><span data-icon="plus"></span>Novo portfólio</button>')}
    <div class="dashboard-metrics">
      <button data-route-button="publicacoes"><small>Portfólio publicado</small><strong>${state.published?'1':'0'}</strong></button>
      <button data-route-button="projetos"><small>Projetos</small><strong>${state.projects.length}</strong></button>
      <button data-route-button="analise"><small>Visualizações</small><strong>${summary.views}</strong></button>
      <button data-route-button="analise"><small>Visitantes únicos</small><strong>${summary.visitors}</strong></button>
    </div>
    <div class="home-feature-grid">
      <article class="card home-import-card">
        <header class="section-card-head"><h2>Seus repositórios</h2>${state.githubConnected ? '<button class="secondary-button home-disconnect" type="button" data-disconnect-github>Desconectar</button>' : ''}</header>
        ${githubContent}
      </article>
      <article class="card link-summary home-share-card"><h2>Seu link do portfólio</h2><p>Compartilhe seu portfólio com recrutadores, clientes e outras pessoas.</p>
        ${state.published && state.profile.username?`<div class="dashboard-url"><span>${esc(publicPortfolioUrl())}</span><button class="icon-button" data-copy="${esc(publicPortfolioUrl())}" aria-label="Copiar link"><span data-icon="copy"></span></button></div><div class="home-qr-row"><div class="qr-wrap"><canvas id="portfolio-qr" aria-label="QR Code do seu portfólio"></canvas></div><div class="home-qr-copy"><h3>Seu QR Code</h3><p>Escaneie para acessar seu portfólio diretamente.</p><button class="primary-button" data-download-qr><span data-icon="download"></span>Baixar QR Code</button></div></div>`:state.profile.username?'<div class="home-link-pending"><span class="status draft">Rascunho</span><p>Seu endereço estará disponível para visitantes após a publicação.</p><button class="primary-button" data-route-button="publicacoes">Publicar portfólio</button></div>':'<div class="home-link-pending"><p>Complete seu perfil para gerar o endereço público.</p><button class="secondary-button" data-route-button="perfil">Completar perfil</button></div>'}
      </article>
    </div>
    <div class="home-bottom-grid">${analyticsChart({ compact: true })}
      <article class="card home-next-card"><h2>Próximos passos</h2><ol class="onboarding-list"><li><span class="mono">01</span><div><b>Conectar o GitHub</b><p>${state.githubConnected ? 'Conta conectada.' : 'Importe seus repositórios.'}</p><button class="link-button" data-route-button="github">${state.githubConnected ? 'Gerenciar conexão' : 'Conectar GitHub'} →</button></div></li><li><span class="mono">02</span><div><b>Escolher seus projetos</b><p>Revise contexto, tecnologias e links.</p><button class="link-button" data-route-button="projetos">Organizar projetos →</button></div></li><li><span class="mono">03</span><div><b>Publicar seu portfólio</b><p>${state.published ? 'Seu portfólio está publicado.' : 'Prepare sua página com o template padrão.'}</p><button class="link-button" data-route-button="publicacoes">Ver publicação →</button></div></li></ol></article>
    </div>
  </section>`
}

function linkQrView() {
  const ready = state.published && Boolean(state.profile.username.trim())
  return `<section class="page-enter link-page">${pageHead('Seu link, Seu QRCode', 'Compartilhe seu portfólio com um link ou QR Code.')}<article class="card share-card">${ready ? `<div class="share-copy"><h2>Seu portfólio, pronto para compartilhar</h2><p>Copie o endereço ou baixe o QR Code para usar onde quiser.</p><div class="dashboard-url"><span data-icon="link"></span><span>${esc(publicPortfolioUrl())}</span><button class="icon-button" data-copy="${esc(publicPortfolioUrl())}" aria-label="Copiar link"><span data-icon="copy"></span></button></div><button class="secondary-button" data-download-qr><span data-icon="download"></span>Baixar QR Code</button></div><div class="qr-wrap"><canvas id="portfolio-qr" width="320" height="320" aria-label="QR Code do portfólio público"></canvas></div>` : state.profile.username ? emptyState('qr', 'Portfólio em rascunho', 'Publique o portfólio para ativar o link e o QR Code.', '<button class="primary-button" data-route-button="publicacoes">Publicar portfólio</button>') : emptyState('qr', 'Configure seu link público', 'Complete o perfil para gerar seu link e QR Code.', '<button class="primary-button" data-route-button="portfolio-editar">Configurar portfólio</button>')}</article></section>`
}

function projectCards(items) {
  if (!items.length) return `<div class="card empty-state">${emptyState('folder', 'Nenhum projeto nesta seção.', 'Crie um projeto ou mova um card para cá.', '<button class="primary-button" data-new-project>Novo projeto</button>')}</div>`
  return items.map(projectCard).join('')
}

function projectCard(project) {
  return `<article class="card project-card reference-project-card explorer-project" draggable="true" data-drag-project="${project.id}" tabindex="0" aria-label="Projeto ${esc(project.name)}" aria-description="Use Alt e as setas para mudar a posição" aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown"><button class="project-cover" type="button" data-view-project="${project.id}" aria-label="Visualizar ${esc(project.name)}">${project.image ? `<img src="${esc(project.image)}" alt="Capa de ${esc(project.name)}" loading="lazy" width="480" height="270" draggable="false">` : `<span class="project-cover-fallback"><strong>${esc(project.name)}</strong></span>`}</button><div class="project-card-body"><h2>${esc(project.name)}</h2><div class="project-actions"><button class="primary-button" type="button" data-open-project="${project.id}">Acessar</button><button class="secondary-button" type="button" data-view-project="${project.id}">Ver</button><button class="icon-button project-more" type="button" data-project-menu="${project.id}" aria-label="Mais ações para ${esc(project.name)}" aria-haspopup="dialog">⋯</button></div></div></article>`
}

function projectsView() {
  return `<section class="page-enter projects-page" data-drop-zone="projects">${pageHead('Projetos', 'Organize e publique os trabalhos que contam a sua história.', '<button class="primary-button" data-new-project><span data-icon="plus"></span>Novo projeto</button>')}<div class="toolbar"><label class="search-field"><span data-icon="search"></span><input id="project-search" type="search" placeholder="Buscar projetos..." aria-label="Buscar projetos"></label><select id="type-filter" aria-label="Filtrar projetos"><option value="all">Todos os status</option><optgroup label="Status"><option value="status:published">Publicado</option><option value="status:progress">Em desenvolvimento</option><option value="status:draft">Rascunho</option></optgroup><optgroup label="Tipo"><option value="type:landing">Landing page</option><option value="type:site">Site</option></optgroup></select><select id="project-sort" aria-label="Ordenar projetos"><option value="recent">Mais recentes</option><option value="name">Nome: A–Z</option><option value="type">Tipo</option></select></div><div class="project-grid" id="project-grid">${projectCards(projectsAt('projects'))}</div></section>`
}

function previewMarkup() {
  const profile = state.profile
  const publishedProjects = state.projects.filter(project => project.status === 'published')
  return `<div class="public-preview">${profile.avatar ? `<div class="preview-avatar"><img src="${esc(profile.avatar)}" alt="Foto de ${esc(profile.name)}"></div>` : '<div class="preview-avatar preview-avatar-empty"><span data-icon="user"></span></div>'}${profile.name ? `<p class="preview-kicker">PORTFÓLIO</p><h2 data-preview="name">${esc(profile.name)}</h2>` : '<p class="preview-empty-copy">Adicione seu nome para visualizar a prévia.</p>'}${profile.role ? `<h3 data-preview="role">${esc(profile.role)}</h3>` : ''}${profile.bio ? `<p data-preview="bio">${esc(profile.bio)}</p>` : ''}<div class="preview-skills" data-preview="skills">${profile.skills.split(',').filter(Boolean).map(item => `<span>${esc(item.trim())}</span>`).join('')}</div>${publishedProjects.length ? `<div class="preview-project-list">${publishedProjects.slice(0, 3).map(project => `<span>${esc(project.name)}</span>`).join('')}</div>` : '<div class="preview-empty-copy">Nenhum projeto publicado.</div>'}</div>`
}

function portfolioPreviewProject(project) {
  const url = normalizeExternalUrl(project.link)
  return `<article class="public-project my-portfolio-project"><div class="project-image">${project.image ? `<img src="${esc(project.image)}" alt="Capa de ${esc(project.name)}" loading="lazy" draggable="false">` : `<span>${esc(project.name.slice(0, 2).toUpperCase())}</span>`}</div><div class="project-content"><h3>${esc(project.name)}</h3><p>${esc(project.description || 'Conheça este projeto.')}</p>${project.tech ? `<div class="tag-row">${project.tech.split(',').filter(Boolean).map(item => `<span class="tag mono">${esc(item.trim())}</span>`).join('')}</div>` : ''}<div class="project-actions">${url ? `<a class="public-button" href="${esc(url)}" target="_blank" rel="noopener">Acessar</a>` : `<button class="public-button" type="button" data-preview-project="${project.id}">Acessar</button>`}<button class="public-button secondary" type="button" data-preview-project="${project.id}">Ver</button></div></div></article>`
}

function portfolioManagerView() {
  const profile = state.profile
  const emptyPortfolioProjects = '<div class="empty-projects folio-empty-projects"><span class="folio-empty-folder" aria-hidden="true">▱</span><h2>Nenhum projeto encontrado</h2><p>Você ainda não desenvolveu nenhum projeto.<br>Crie um novo projeto para começar.</p><button class="primary-button folio-create-project" type="button" data-new-project>+ &nbsp;Criar projeto</button></div>'
  const banner = currentUser ? `${portfolioBannerUrl(currentUser.id)}${profileBannerRevision ? `?v=${profileBannerRevision}` : ''}` : ''
  const projects = state.projects.filter(project => project.status === 'published').sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
  const username = profile.username ? `@${profile.username.replace(/^@/, '')}` : '@usuario'
  const biography = profile.bio || profile.role || 'Adicione uma biografia para apresentar seu trabalho aos visitantes.'
  return `<section class="page-enter my-portfolio-page">${pageHead('Meu Portfólio', 'Prévia completa de como os visitantes verão seu portfólio.', '<a class="secondary-button" href="#inicio">← Voltar ao início</a>')}
    <div class="portfolio-page my-portfolio-preview" style="--portfolio-model-accent:${esc(getPortfolioModel(profile.selectedModel).accent || '#333333')}">
      <div class="portfolio-shell folio-showcase-shell"><article class="folio-showcase-card">
        <div class="my-portfolio-banner"><img class="public-banner-image" src="${esc(banner)}" alt="Banner do portfólio" onerror="this.hidden=true"><input id="profile-banner-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><button class="icon-button banner-edit-button" type="button" data-upload-profile-banner aria-label="Editar banner"><span data-icon="edit"></span></button></div>
        <div class="folio-showcase-profile"><div class="public-avatar">${profile.avatar ? `<img src="${esc(profile.avatar)}" alt="Foto de ${esc(realName())}" onerror="this.src='${profilePlaceholderUrl}'">` : `<img src="${profilePlaceholderUrl}" alt="Ícone de usuário">`}<input id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><button class="icon-button avatar-edit-button" type="button" data-upload-avatar aria-label="Editar foto de perfil"><span data-icon="edit"></span></button></div>
          <div class="folio-showcase-copy"><h2>${esc(realName())}</h2><p class="folio-username">${esc(username)}</p><p class="folio-biography">${esc(biography)}</p></div>
          <div class="folio-profile-metrics" aria-label="Estatísticas do portfólio"><div><strong>${projects.length}</strong><span>Projetos</span></div><div><strong>—</strong><span>Clientes atendidos</span></div><div><strong>—</strong><span>No mercado</span></div></div>
        </div>
        <div class="folio-profile-divider" aria-hidden="true"></div>
        <section class="projects-section folio-showcase-projects">${projects.length ? `<div class="section-heading"><h2>Meus projetos</h2><span>${projects.length} projeto${projects.length === 1 ? '' : 's'}</span></div><div class="public-projects">${projects.map(portfolioPreviewProject).join('')}</div>` : emptyPortfolioProjects}</section>
      </article></div>
    </div>
  </section>`
}
function openPortfolioFolder(id) {
  if (!visiblePortfolioFolders().some(folder => folder.id === id)) return
  selectedFolderId = id
  if (location.hash !== '#portfolio') location.hash = 'portfolio'
  else render({ preserveScroll: true })
}

function showPortfolioFolderInfo(id) {
  const folder = visiblePortfolioFolders().find(item => item.id === id)
  if (!folder) return
  const link = secondaryPortfolioUrl(id)
  modal(`<div class="modal-head"><h2>${esc(folderName(id))}</h2><button class="icon-button" data-close-modal aria-label="Fechar"><span data-icon="x"></span></button></div><p>${projectsAt(id).length} projeto${projectsAt(id).length === 1 ? '' : 's'} organizado${projectsAt(id).length === 1 ? '' : 's'} manualmente.</p><div class="url-field"><span>${esc(link)}</span><button class="icon-button" data-copy="${esc(link)}" aria-label="Copiar link"><span data-icon="copy"></span></button></div><p class="workspace-note">O link público depende da publicação do portfólio principal.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Fechar</button><button class="primary-button" data-access-folder="${id}">Acessar</button></div>`)
  $('[data-copy]', $('#modal-root')).onclick = event => copyText(event.currentTarget.dataset.copy)
  $('[data-access-folder]', $('#modal-root')).onclick = () => accessPortfolioFolder(id)
}

function accessPortfolioFolder(id) {
  if (!visualPublications.folders[id]) return toast('Publique este portfólio para acessar o link.', 'error')
  if (!state.published) return toast('Publique o portfólio principal para disponibilizar este link aos visitantes.', 'error')
  const url = secondaryPortfolioUrl(id)
  if (url) window.open(url, '_blank', 'noopener')
}

function toggleFolderPublication(id) {
  if (!visiblePortfolioFolders().some(folder => folder.id === id)) return
  const publishing = !visualPublications.folders[id]
  if (!publishing) {
    modal(`<div class="confirm-dialog"><h2>Despublicar ${esc(folderName(id))}?</h2><p>O estado visual deste portfólio será atualizado no painel.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancelar</button><button class="danger-button" data-confirm-folder-unpublish>Despublicar</button></div></div>`)
    $('[data-confirm-folder-unpublish]').onclick = () => saveFolderPublication(id, false)
    return
  }
  saveFolderPublication(id, true)
}

function saveFolderPublication(id, published) {
  try {
    visualPublications = recordVisualPublication(localStorage, currentUser.id, visualPublications, {
      folderId: id, name: folderName(id), published, url: secondaryPortfolioUrl(id),
      snapshot: published ? { profile: { ...state.profile }, projects: projectsAt(id).map(project => ({ ...project })) } : null,
    })
    closeModal()
    render({ preserveScroll: true })
    toast(published ? 'Portfólio marcado como publicado.' : 'Portfólio despublicado no painel.')
  } catch (error) { reportError('Não foi possível salvar o estado deste portfólio.', error) }
}
function createPortfolioFolder() {
  modal(`<form id="new-folder-form"><div class="modal-head"><h2>Novo portfólio secundário</h2><button class="icon-button" type="button" data-close-modal aria-label="Fechar"><span data-icon="x"></span></button></div><label class="field"><span>Nome do portfólio</span><input name="name" required maxlength="60" placeholder="Nome do portfólio"></label><p class="folder-creation-note">Adicione e organize projetos manualmente, sem conectar o GitHub.</p><div class="modal-actions"><button class="secondary-button" type="button" data-close-modal>Cancelar</button><button class="primary-button" type="submit">Criar portfólio</button></div></form>`, { creationPanel: true })
  $('#new-folder-form').onsubmit = event => {
    event.preventDefault()
    const name = new FormData(event.currentTarget).get('name').trim()
    if (!name) return
    if (portfolioFolders.length > 21472) return toast('O limite de pastas foi atingido.', 'error')
    const id = `folder-${portfolioFolders.length}`
    try {
      const names = { ...state.folderNames, [id]: name }
      localStorage.setItem(`devifolio_folder_names_${currentUser.id}`, JSON.stringify(names))
      state.folderNames = names
      restorePortfolioFolders(names, state.projects)
      selectedFolderId = id
      closeModal(); render({ preserveScroll: true })
    } catch (error) { reportError('Não foi possível salvar a pasta.', error) }
  }
}

function portfolioActions(id) {
  if (!visiblePortfolioFolders().some(folder => folder.id === id)) return
  modal(`<div class="modal-head"><h2>${esc(folderName(id))}</h2><button type="button" class="icon-button" data-close-modal aria-label="Fechar"><span data-icon="x"></span></button></div><div class="card-action-menu"><button type="button" class="danger-button" data-delete-portfolio><span data-icon="trash"></span>Deletar portfólio</button><button type="button" class="${visualPublications.folders[id] ? 'danger-button' : 'primary-button publish-button'}" data-deploy-portfolio>${visualPublications.folders[id] ? 'Despublicar' : 'Publicar'}</button><button type="button" class="secondary-button" data-edit-portfolio-name><span data-icon="edit"></span>Editar</button><button type="button" class="secondary-button" data-show-folder-info="${id}">Ver informações</button></div>`)
  $('[data-delete-portfolio]').onclick = () => confirmDeletePortfolio(id)
  $('[data-deploy-portfolio]').onclick = () => toggleFolderPublication(id)
  $('[data-edit-portfolio-name]').onclick = () => renamePortfolioFolder(id)
  $('[data-show-folder-info]', $('#modal-root')).onclick = () => showPortfolioFolderInfo(id)
}

function confirmDeletePortfolio(id) {
  modal(`<div class="confirm-dialog"><h2>Deletar ${esc(folderName(id))}?</h2><p>O portfólio será retirado da sua organização. Seus projetos continuarão disponíveis em Portfólios.</p><div class="modal-actions"><button class="secondary-button" type="button" data-close-modal>Cancelar</button><button class="danger-button" type="button" data-confirm-delete-portfolio>Deletar portfólio</button></div></div>`)
  $('[data-confirm-delete-portfolio]').onclick = () => {
    try {
      const hidden = [...new Set([...state.hiddenFolders, id])]
      localStorage.setItem(`devifolio_hidden_folders_${currentUser.id}`, JSON.stringify(hidden))
      state.hiddenFolders = hidden
      closeModal(); render({ preserveScroll: true }); toast('Portfólio removido da organização.')
    } catch (error) { reportError('Não foi possível remover o portfólio.', error) }
  }
}

function renamePortfolioFolder(id) {
  if (!visiblePortfolioFolders().some(folder => folder.id === id)) return
  modal(`<form id="folder-name-form"><div class="modal-head"><h2>Renomear pasta</h2><button class="icon-button" type="button" data-close-modal aria-label="Fechar"><span data-icon="x"></span></button></div><label class="field"><span>Nome da pasta</span><input name="name" required maxlength="60" value="${esc(folderName(id))}"></label><div class="modal-actions"><button class="secondary-button" type="button" data-close-modal>Cancelar</button><button class="primary-button" type="submit">Salvar</button></div></form>`)
  $('#folder-name-form').onsubmit = event => {
    event.preventDefault()
    const name = new FormData(event.currentTarget).get('name').trim()
    if (!name) return
    try {
      const names = { ...state.folderNames, [id]: name }
      localStorage.setItem(`devifolio_folder_names_${currentUser.id}`, JSON.stringify(names))
      state.folderNames = names
      closeModal(); render({ preserveScroll: true })
    } catch (error) { reportError('Não foi possível salvar o nome da pasta.', error) }
  }
}

function portfolioEditorView() {
  const profile = state.profile
  const ready = state.published && profileComplete()
  const publicationAction = state.published ? '<button class="danger-button" type="button" data-toggle-publish>Despublicar</button>' : '<button class="primary-button publish-button" type="button" data-toggle-publish>Publicar</button>'
  return `<section class="page-enter">${pageHead('Editar portfólio', 'Edite a prévia que seus visitantes receberão.')}<div class="portfolio-actions"><span class="status ${state.published ? 'published' : 'draft'}">${state.published ? 'Publicado' : 'Não publicado'}</span><button class="secondary-button" type="button" data-open-preview><span data-icon="eye"></span>Visualizar como visitante</button>${publicationAction}</div><div class="editor-layout portfolio-editor"><form class="card form-card" id="portfolio-form"><div class="card-title"><span data-icon="edit"></span><div><h2>Editar conteúdo</h2><p>Altere os campos e acompanhe a prévia ao lado.</p></div></div><div class="form-grid"><label class="field"><span>Nome <i data-icon="edit"></i></span><input name="name" required value="${esc(profile.name)}"></label><label class="field"><span>Título profissional <i data-icon="edit"></i></span><input name="role" value="${esc(profile.role)}"></label><label class="field full"><span>Sobre você <i data-icon="edit"></i></span><textarea name="bio" maxlength="240">${esc(profile.bio)}</textarea><small>Até 240 caracteres</small></label><label class="field full"><span>Habilidades <i data-icon="edit"></i></span><input name="skills" value="${esc(profile.skills)}"><small>Separe as habilidades por vírgulas</small></label><label class="field"><span>GitHub <i data-icon="edit"></i></span><input name="github" value="${esc(profile.github)}" placeholder="github.com/usuario"></label><label class="field"><span>LinkedIn <i data-icon="edit"></i></span><input name="linkedin" value="${esc(profile.linkedin)}" placeholder="linkedin.com/in/usuario"></label><label class="field full"><span>Site pessoal <i data-icon="edit"></i></span><input name="website" value="${esc(profile.website)}" placeholder="https://"></label></div><div class="form-footer"><button class="primary-button" type="submit"><span data-icon="save"></span>Salvar alterações</button></div></form><aside class="card preview-card"><div class="preview-toolbar"><span>Prévia do visitante</span>${ready ? '<button class="icon-button" type="button" data-open-preview aria-label="Abrir prévia"><span data-icon="external"></span></button>' : ''}</div>${previewMarkup()}${ready ? `<div class="url-field"><span>${esc(publicPortfolioUrl())}</span><button class="icon-button" data-copy="${esc(publicPortfolioUrl())}" aria-label="Copiar URL"><span data-icon="copy"></span></button></div>` : '<div class="preview-link-empty">Use Deploy quando seu conteúdo estiver pronto.</div>'}</aside></div></section>`
}

function githubView() {
  const content = `<div class="repo-list">${state.repos.map((repository, index) => ({ repository, index })).sort((a, b) => Number(a.repository.private) - Number(b.repository.private)).map(({ repository, index }) => `<article class="repo-row" data-repository-index="${index}"><label class="repo-select" title="Selecionar ${esc(repository.name)}"><input type="checkbox" value="${index}" aria-label="Selecionar ${esc(repository.name)}"><span class="repo-icon" data-icon="github"></span><span class="repo-copy"><b title="${esc(repository.name)}">${esc(repository.name)}</b><small>@${esc(repository.full_name?.split('/')[0] || state.githubUsername)}</small></span><span class="repo-visibility ${repository.private?'is-private':'is-public'}">${repository.private?'<span data-icon="lock"></span>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18z"/></svg>'}${repository.private?'Privado':'Público'}</span></label><button class="icon-button repo-more" data-repo-menu="${index}" aria-label="Ações de ${esc(repository.name)}" aria-haspopup="dialog">⋯</button></article>`).join('')}</div>`
  const account = state.githubConnected
    ? `<div class="card connected-account"><span class="connected-github-icon" data-icon="github" aria-hidden="true"></span><div><small>Conta conectada</small><h2>@${esc(state.githubUsername || 'GitHub')}</h2></div><button class="secondary-button" data-sync-repos><span data-icon="refresh"></span>Sincronizar</button></div>`
    : `<div class="card connect-card"><span class="connect-icon" data-icon="github"></span><h2>Conecte seu GitHub</h2><p>Conecte a conta para sincronizar e importar seus repositórios reais.</p><button class="primary-button" data-connect-github><span data-icon="github"></span>Conectar com GitHub</button></div>`
  const status = reposLoading ? 'Carregando repositórios...' : repoLoadFailed ? 'Não foi possível carregar os repositórios.' : `${state.repos.length} repositório${state.repos.length === 1 ? '' : 's'} encontrado${state.repos.length === 1 ? '' : 's'}`
  const message = repoLoadFailed ? '<div class="repo-reference-note"><p>Não conseguimos acessar seus repositórios. Tente novamente ou reconecte sua conta do GitHub.</p><button type="button" data-retry-repos>Tentar novamente</button><button type="button" data-connect-github>Reconectar GitHub</button></div>' : state.githubConnected && reposLoaded && !state.repos.length ? '<p class="repo-empty">Nenhum repositório encontrado nesta conta.</p>' : ''
  return `<section class="page-enter github-page">${pageHead('GitHub', 'Selecione os repositórios que deseja adicionar ao portfólio principal.', state.githubConnected ? '<button class="secondary-button" data-disconnect-github>Desconectar</button>' : '')}${account}${state.githubConnected ? `<div class="repo-panel"><div class="section-card-head"><div><h2>Seus repositórios</h2><p>${status}</p></div><button class="primary-button" data-import-selected ${state.repos.length ? '' : 'disabled'}><span data-icon="plus"></span>Adicionar repositório</button></div>${content}${message}</div>` : ''}</section>`
}

function analyticsView() {
  const summary = analyticsSummary()
  const projectCounts = new Map()
  state.analytics.filter(event => event.project_id && (event.event_type === 'project_view' || event.event_type === 'link_click')).forEach(event => projectCounts.set(Number(event.project_id), (projectCounts.get(Number(event.project_id)) || 0) + 1))
  const ranking = state.projects.map(project => ({ project, count: projectCounts.get(project.id) || 0 })).filter(item => item.count).sort((a, b) => b.count - a.count)
  const max = ranking[0]?.count || 1
  const metrics = `<aside class="analytics-metrics" aria-label="Indicadores"><article class="card analytic-stat"><span data-icon="eye" aria-hidden="true"></span><small>Visualizações</small><strong>${summary.views}</strong></article><article class="card analytic-stat"><span data-icon="link" aria-hidden="true"></span><small>Cliques em links</small><strong>${summary.clicks}</strong></article><article class="card analytic-stat"><span data-icon="users" aria-hidden="true"></span><small>Visitantes únicos</small><strong>${summary.visitors}</strong></article><article class="card analytic-stat"><span data-icon="trending" aria-hidden="true"></span><small>Taxa de clique</small><strong>${summary.rate}%</strong></article></aside>`
  const details = `<div class="analytics-layout"><article class="card chart-card"><div class="section-card-head"><div><h2>Atividade real</h2><p>Eventos registrados no portfólio público.</p></div><span class="chart-total">${state.analytics.length} total</span></div><div class="event-summary"><div><span>Visualizações</span><strong>${summary.views}</strong></div><div><span>Interações</span><strong>${summary.clicks}</strong></div></div></article><article class="card ranking-card"><div class="section-card-head"><div><h2>Projetos mais acessados</h2><p>Cliques registrados.</p></div></div>${ranking.length ? ranking.slice(0, 5).map((item, index) => `<div class="rank-row"><span>${index + 1}</span><div><b>${esc(item.project.name)}</b><small>${item.count} acesso${item.count === 1 ? '' : 's'}</small></div><div class="rank-bar"><i style="width:${Math.round((item.count / max) * 100)}%"></i></div></div>`).join('') : '<div class="compact-empty"><span class="ranking-empty-icon" data-icon="folder" aria-hidden="true"></span><p>Nenhum projeto recebeu acessos ainda.</p></div>'}</article></div>`
  return `<section class="page-enter analytics-page">${pageHead('Análise', 'Entenda como as pessoas encontram e exploram seu portfólio.')}<div class="analytics-overview">${analyticsChart()}${metrics}</div>${details}</section>`
}

function avatarMarkup(className = 'avatar avatar-large') {
  return state.profile.avatar ? `<span class="${className}"><img src="${esc(state.profile.avatar)}" alt="Foto de ${esc(realName())}"></span>` : `<span class="${className}">${esc(initials())}</span>`
}

function profileEditCard(label, help, name, value, type = 'text', extra = '') {
  return `<form class="card profile-edit-card" data-profile-form><div><h2>${label}</h2><p>${help}</p></div><div class="profile-edit-control">${extra}<input name="${name}" type="${type}" value="${esc(value)}" required ${name === 'username' ? 'pattern="[a-zA-Z0-9._-]+" maxlength="48"' : ''} ${name === 'name' ? 'maxlength="32"' : ''}><button class="primary-button" type="submit">Salvar</button></div><small>${name === 'name' ? 'Use até 32 caracteres.' : name === 'username' ? 'Use até 48 caracteres. Apenas letras, números, hífens e underscores.' : 'Este é o e-mail associado à sua conta.'}</small></form>`
}

function profileView() {
  const profile = state.profile
  const banner = currentUser ? `${portfolioBannerUrl(currentUser.id)}${profileBannerRevision ? `?v=${profileBannerRevision}` : ''}` : ''
  const portfolioCount = visiblePortfolioFolders().length + 1
  return `<section class="page-enter profile-page"><div class="card profile-showcase">
    <div class="profile-cover"><img src="${esc(banner)}" alt="" aria-hidden="true" onerror="this.hidden=true"><input id="profile-banner-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><button class="icon-button" type="button" data-upload-profile-banner aria-label="Alterar capa"><span data-icon="edit"></span></button></div>
    <div class="profile-identity"><div class="profile-avatar-edit">${avatarMarkup()}<input id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><button class="icon-button avatar-edit-button" type="button" data-upload-avatar aria-label="Alterar foto de perfil"><span data-icon="edit"></span></button></div><h1>${esc(realName())}</h1></div>
    <div class="profile-stat-row"><div><strong>${portfolioCount}</strong><span>Portfólios</span></div><div><strong>${state.projects.length}</strong><span>Projetos</span></div><div><span>Usuário</span><strong class="profile-username">@${esc(profile.username || 'conta')}</strong></div></div>
    <div class="profile-cards"><div class="card profile-edit-card profile-avatar-card"><div><h2>Avatar</h2><p>Esta é sua foto de perfil. Faça upload de uma imagem personalizada.</p><small>Um avatar é opcional, mas recomendado.</small></div><div class="profile-avatar-action">${avatarMarkup('avatar avatar-card-image')}<button type="button" class="primary-button" data-upload-avatar>Salvar</button></div></div>
    ${profileEditCard('Nome de exibição', 'Digite seu nome completo ou um nome de exibição.', 'name', profile.name)}
    ${profileEditCard('Nome de usuário', 'Este será o seu nome de usuário dentro da plataforma FolioDev.', 'username', profile.username, 'text', '<span class="profile-input-prefix">folio.dev/</span>')}
    ${profileEditCard('E-mail', 'Este é o e-mail associado à sua conta.', 'email', profile.email, 'email')}
    </div></div></section>`
}

function switchRow(icon, title, description, key, on) {
  return `<div class="setting-row"><span class="circle-icon" data-icon="${icon}"></span><div><b>${title}</b><small>${description}</small></div><button class="switch ${on ? 'on' : ''}" type="button" data-setting="${key}" aria-label="${esc(title)}" aria-pressed="${on}"><i></i></button></div>`
}

function settingsView() {
  const dark = document.body.dataset.theme === 'dark'
  return `<section class="page-enter compact-panel-page"><div class="card settings-card compact-panel"><div class="settings-card-head"><span data-icon="settings"></span><div><h1>Configurações</h1><p>Preferências, privacidade e integrações.</p></div></div><nav class="settings-tabs" aria-label="Seções de configurações"><a href="#preferencias" data-settings-anchor="preferencias">Preferências</a><a href="#privacidade" data-settings-anchor="privacidade">Privacidade</a><a href="#conta" data-settings-anchor="conta">Conta</a></nav><div class="panel-section" id="preferencias"><h2>Preferências</h2><div class="setting-row"><span class="circle-icon" data-icon="palette"></span><div><b>Aparência</b><small>Escolha o tema da área interna.</small></div><div class="theme-options" role="group" aria-label="Tema da área interna"><button type="button" data-interface-theme="light" aria-pressed="${!dark}">Claro</button><button type="button" data-interface-theme="dark" aria-pressed="${dark}">Escuro</button></div></div>${switchRow('mail', 'Avisos por e-mail', 'Receba atualizações importantes sobre seu portfólio.', 'email', state.settings.email)}${switchRow('bell', 'Novidades do produto', 'Acompanhe melhorias e novos recursos da plataforma.', 'product', state.settings.product)}${switchRow('panel', 'Modo compacto', 'Reduza o espaçamento das listas e painéis.', 'compact', state.settings.compact)}</div><div class="panel-section" id="privacidade"><h2>Privacidade</h2>${switchRow('shield', 'Perfil público', 'Permita que visitantes acessem seu portfólio publicado.', 'publicProfile', state.settings.publicProfile)}</div><div class="panel-section" id="conta"><h2>Conta</h2><div class="setting-row"><div><b>Exportar dados</b><small>Baixe uma cópia das informações da conta.</small></div><button class="secondary-button" data-export>Exportar</button></div><div class="setting-row danger-row"><div><b>Excluir conta</b><small>Essa ação não poderá ser desfeita.</small></div><button class="danger-button" data-delete-account>Excluir conta</button></div></div></div></section>`
}

function publicationsView() {
  const entries = publicationHistoryExpanded ? visualPublications.events : visualPublications.events.slice(0, 5)
  return `<section class="page-enter publications-page">${pageHead('Publicações', 'O estado atual do seu portfólio público.')}
    <article class="card publication-panel"><div class="publication-heading"><h2>Portfólio de ${esc(realName())}</h2>${statusBadge(state.published ? 'published' : 'draft')}</div><div class="commit-timeline"><div><b>${state.published ? 'Disponível para visitantes' : 'Ainda não publicado'}</b><p>${state.published ? 'Sua página está no ar. Revise o conteúdo antes de compartilhar.' : 'Revise seu conteúdo antes de publicar.'}</p></div></div>${state.published && state.profile.username ? `<div class="url-field"><span>${esc(publicPortfolioUrl())}</span><button class="icon-button" data-copy="${esc(publicPortfolioUrl())}" aria-label="Copiar endereço"><span data-icon="copy"></span></button></div>` : ''}<div class="publication-actions"><button class="${state.published ? 'danger-button' : 'primary-button publish-button'}" data-toggle-publish>${state.published ? 'Despublicar' : 'Publicar'}</button><button class="secondary-button" data-route-button="portfolio-editar"><span data-icon="edit"></span>Editar conteúdo</button>${state.published ? '<button class="secondary-button" data-open-preview>Abrir portfólio</button>' : ''}</div><p class="workspace-note">Esta tela mostra a publicação atual do seu portfólio.</p></article>
    <article class="card publication-history"><div class="section-card-head"><div><h2>Histórico de publicações</h2><p>Todas as versões do seu portfólio publicadas.</p></div><button class="secondary-button" data-manage-publication-history><span data-icon="refresh"></span>Gerenciar histórico</button></div>
      <div class="publication-table-wrap"><table class="publication-table"><thead><tr><th>Portfólio</th><th>Data</th><th>Horário</th><th>Status</th><th>Ações</th></tr></thead><tbody>${entries.length ? entries.map(event => { const date = new Date(event.createdAt); return `<tr><td>${esc(event.name)}</td><td>${date.toLocaleDateString('pt-BR')}</td><td>${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td><td><span class="status ${event.action === 'published' ? 'published' : 'draft'}">${event.action === 'published' ? 'Publicado' : 'Despublicado'}</span></td><td><button class="secondary-button" data-open-publication-id="${esc(event.id)}" ${event.snapshot ? '' : 'disabled'}>Abrir</button><button class="icon-button" data-publication-menu="${esc(event.id)}" aria-label="Ações do registro">⋮</button></td></tr>` }).join('') : '<tr><td colspan="5" class="publication-empty">Nenhuma publicação registrada ainda.</td></tr>'}</tbody></table></div>
    </article>
  </section>`
}

function showPublicationEvent(id) {
  const event = visualPublications.events.find(item => item.id === id)
  if (!event?.snapshot) return
  modal(`<div class="modal-head"><h2>${esc(event.name)}</h2><button class="icon-button" data-close-modal aria-label="Fechar"><span data-icon="x"></span></button></div><p class="publication-version-date">Versão de ${new Date(event.createdAt).toLocaleString('pt-BR')}</p>${documentPreview({ profile: event.snapshot.profile, projects: event.snapshot.projects, compact: true })}<div class="modal-actions"><button class="secondary-button" data-close-modal>Fechar</button>${event.url ? `<button class="primary-button" data-open-publication-url="${esc(event.url)}">Abrir link</button>` : ''}</div>`)
  $('[data-open-publication-url]', $('#modal-root'))?.addEventListener('click', () => window.open(event.url, '_blank', 'noopener'))
}

function publicationEventMenu(id) {
  const event = visualPublications.events.find(item => item.id === id)
  if (!event) return
  modal(`<div class="modal-head"><h2>${esc(event.name)}</h2><button class="icon-button" data-close-modal aria-label="Fechar"><span data-icon="x"></span></button></div><p>${event.action === 'published' ? 'Portfólio publicado' : 'Portfólio despublicado'} em ${new Date(event.createdAt).toLocaleString('pt-BR')}.</p><div class="modal-actions">${event.snapshot ? `<button class="secondary-button" data-open-publication-id="${esc(event.id)}">Ver versão</button>` : ''}${event.url ? `<button class="secondary-button" data-copy="${esc(event.url)}">Copiar link</button>` : ''}</div>`)
  $('[data-open-publication-id]', $('#modal-root'))?.addEventListener('click', () => showPublicationEvent(id))
  $('[data-copy]', $('#modal-root'))?.addEventListener('click', button => copyText(button.currentTarget.dataset.copy))
}

const modelCategories = ['Todos', ...new Set(portfolioModels.map(model => model.category || 'Portfólio'))]
const catalogModels = [...templateModels, ...portfolioModels.filter(model => !templateModels.includes(model))]
const modelPageSize = 12

function filteredModels() {
  const query = modelQuery.trim().toLocaleLowerCase('pt-BR')
  return catalogModels.filter(model => {
    if (modelCategory !== 'Todos' && (model.category || 'Portfólio') !== modelCategory) return false
    return !query || [model.name, model.description, model.category || 'Portfólio', ...(model.tags || [])].join(' ').toLocaleLowerCase('pt-BR').includes(query)
  })
}

function modelCard(model) {
  const current = state.profile.selectedModel === model.id
  const category = model.category || 'Portfólio'
  return `<article class="card model-card${current ? ' is-current' : ''}"><button class="model-image" type="button" data-preview-model="${esc(model.id)}" aria-label="Pré-visualizar ${esc(model.name)}"><img src="${esc(model.image)}" alt="Prévia do modelo ${esc(model.name)}" width="640" height="360" loading="lazy"></button><div class="model-card-content"><span class="model-category">${esc(category)}</span><h2>${esc(model.name)}</h2><p>${esc(model.description)}</p><div class="model-card-actions"><button class="secondary-button" type="button" data-preview-model="${esc(model.id)}">Prévia</button><button class="primary-button" type="button" ${current ? 'disabled aria-current="true"' : model.available ? `data-apply-model="${esc(model.id)}"` : `data-upgrade-model="${esc(model.id)}"`}>${current ? 'Aplicado' : model.available ? 'Aplicar' : 'Indisponível'}</button></div></div></article>`
}

function modelsResults() {
  const filtered = filteredModels()
  const totalPages = Math.max(1, Math.ceil(filtered.length / modelPageSize))
  modelPage = Math.min(modelPage, totalPages)
  const items = filtered.slice((modelPage - 1) * modelPageSize, modelPage * modelPageSize)
  const controls = totalPages > 1 ? `<nav class="models-pages" aria-label="Páginas de modelos"><button class="secondary-button" data-model-page="${modelPage - 1}" ${modelPage === 1 ? 'disabled' : ''}>Anterior</button><span>Página ${modelPage} de ${totalPages}</span><button class="secondary-button" data-model-page="${modelPage + 1}" ${modelPage === totalPages ? 'disabled' : ''}>Próxima</button></nav>` : ''
  return `<p class="models-count" role="status">${filtered.length} modelo${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'} · ${templateModels.length} novos</p>${items.length ? `<div class="models-grid">${items.map(modelCard).join('')}</div>${controls}` : '<div class="card models-empty">Nenhum modelo corresponde à busca.</div>'}`
}

function modelsView() {
  return `<section class="page-enter models-page">${pageHead('Modelos', 'Explore sites completos. Ao aplicar um modelo, suas cores aparecem no portfólio público.')}<div class="models-toolbar"><label class="search-field"><span data-icon="search"></span><input id="model-search" type="search" value="${esc(modelQuery)}" placeholder="Buscar modelos..." aria-label="Buscar modelos"></label><label class="model-filter-label">Categoria<select id="model-category" aria-label="Filtrar modelos por categoria">${modelCategories.map(category => `<option value="${esc(category)}" ${category === modelCategory ? 'selected' : ''}>${esc(category)}</option>`).join('')}</select></label></div><div id="models-results">${modelsResults()}</div></section>`
}

function bindModelResults() {
  $$('[data-preview-model]', $('#models-results')).forEach(button => button.onclick = () => {
    const model = getPortfolioModel(button.dataset.previewModel)
    const url = modelPreviewUrl(model)
    if (url) window.open(url, '_blank', 'noopener')
    else modal(`<div class="modal-head"><h2>${esc(model.name)}</h2><button class="icon-button" type="button" data-close-modal aria-label="Fechar"><span data-icon="x"></span></button></div><img class="legacy-model-image" src="${esc(model.image)}" alt="Cor do ${esc(model.name)}">${documentPreview({ profile: state.profile, projects: state.projects.filter(project => project.status === 'published') })}<div class="modal-actions"><button class="secondary-button" type="button" data-close-modal>Fechar</button></div>`)
  })
  $$('[data-apply-model]', $('#models-results')).forEach(button => button.onclick = () => {
    const model = getPortfolioModel(button.dataset.applyModel)
    modal(`<div class="modal-head"><h2>Aplicar ${esc(model.name)}</h2><button class="icon-button" type="button" data-close-modal aria-label="Fechar"><span data-icon="x"></span></button></div><p>As cores do modelo serão aplicadas ao seu portfólio público. A prévia mostra o site completo.</p><div class="modal-actions"><button class="secondary-button" type="button" data-close-modal>Cancelar</button><button class="primary-button" type="button" data-confirm-model="${esc(model.id)}">Aplicar modelo</button></div>`)
    $('[data-confirm-model]', $('#modal-root')).onclick = async event => {
      const confirm = event.currentTarget
      setButtonLoading(confirm, true, 'Aplicando...')
      try {
        await savePortfolioModel(currentUser.id, model.id)
        state.profile.selectedModel = model.id
        closeModal()
        updateModelsResults()
        toast('Modelo aplicado ao portfólio.')
      } catch (error) {
        reportError(error?.code === '42703' || error?.code === 'PGRST204' ? 'A migração de Modelos precisa ser aplicada no banco.' : 'Não foi possível aplicar o modelo.', error)
      } finally { if (confirm.isConnected) setButtonLoading(confirm, false) }
    }
  })
  $$('[data-upgrade-model]', $('#models-results')).forEach(button => button.onclick = () => { location.hash = 'planos' })
  $$('[data-model-page]', $('#models-results')).forEach(button => button.onclick = () => { modelPage = Number(button.dataset.modelPage); updateModelsResults(); $('#models-results')?.scrollIntoView({ block: 'start', behavior: motionDuration() ? 'smooth' : 'instant' }) })
}

function updateModelsResults() {
  const root = $('#models-results')
  if (!root) return
  root.innerHTML = modelsResults()
  hydrateIcons(root)
  bindModelResults()
}

function plansView(){return `<section class="page-enter plans-page">${pageHead('Planos','Compare os recursos disponíveis para seu portfólio.')}<p class="plans-availability">As assinaturas pagas estão em breve. Continue editando e publicando seu portfólio.</p><div class="devi-plan-grid">${renderPlanCards({internal:true})}</div><article class="card coupon-card"><h2>Tem um cupom?</h2><p>A validação e o pagamento serão ativados com os planos.</p><form id="coupon-form"><label for="coupon-code">Código do cupom</label><div><input id="coupon-code" placeholder="Digite o código"><button class="primary-button" type="submit">Aplicar</button><button class="secondary-button" type="reset">Remover</button></div><small id="coupon-feedback" role="status">Nenhum desconto aplicado.</small></form></article></section>`}

const views = { publicacoes: publicationsView, planos: plansView, 'link-qrcode': linkQrView, inicio: homeView, projetos: projectsView, portfolio: portfolioManagerView, modelos: modelsView, 'portfolio-editar': portfolioEditorView, github: githubView, analise: analyticsView, kaptei: () => kapteiView(state.leads, state.leadsAvailable), perfil: profileView, configuracoes: settingsView }

function render({ preserveScroll = false } = {}) {
  const requestedRoute = location.hash.slice(1)
  const route = views[requestedRoute] ? requestedRoute : 'inicio'
  if (requestedRoute && !views[requestedRoute]) history.replaceState(null, '', `${location.pathname}${location.search}#inicio`)
  renderedRoute = route
  document.body.classList.toggle('static-page-route', ['inicio', 'analise', 'perfil', 'portfolio'].includes(route))
  document.body.classList.toggle('home-route', route === 'inicio')
  document.body.classList.toggle('portfolio-route', route === 'portfolio')
  document.body.classList.toggle('github-route', route === 'github')
  document.body.classList.toggle('projects-route', route === 'projetos')
  document.body.classList.toggle('kaptei-route', route === 'kaptei')
  $('#page-content').innerHTML = views[route]()
  const routeLabel = { publicacoes:'Publicações', planos:'Planos', 'link-qrcode': 'Seu Link, Seu QR Code', inicio: 'Dashboard', projetos: 'Projetos', portfolio: 'Meu portfólio', modelos: 'Modelos', 'portfolio-editar': 'Editar portfólio', github: 'GitHub', analise: 'Análise', kaptei: 'Kaptei', perfil: 'Perfil', configuracoes: 'Configurações' }[route]
  document.title = `${routeLabel} — FolioDev`
  if ($('#breadcrumb-page')) $('#breadcrumb-page').textContent = routeLabel
  if ($('#breadcrumb-section')) $('#breadcrumb-section').textContent = route === 'inicio' ? 'Início' : 'Painel'
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.route === route))
  hydrateIcons($('#page-content'))
  if (document.body.classList.contains('static-page-route')) $$('img,a', $('#page-content')).forEach(element => { element.draggable = false })
  bindActions()
  if (route === 'link-qrcode' || route === 'inicio') renderPortfolioQR()
  if ((route === 'github' || route === 'inicio' && state.githubConnected) && !bootstrapping && (state.githubConnected || !githubConnectionChecked) && !reposLoaded && !reposLoading) reposPromise = fetchGithubRepos({ reportFailure: !new URLSearchParams(location.search).has('github') })
  updateUserChrome()
  closeMenu()
  closeUserMenu()
  if (!preserveScroll) window.scrollTo({ top: 0, behavior: 'instant' })
}

function updateUserChrome() {
  const user = $('#user-menu-toggle')
  if (user) user.innerHTML = `${avatarMarkup('avatar')}<span><b>${esc(realName())}</b><small>@${esc(state.profile.username || 'conta')}</small></span><span data-icon="chevron"></span>`
  const mobile = $('.mobile-topbar [data-route-button="perfil"]')
  if (mobile) mobile.innerHTML = state.profile.avatar ? `<img src="${esc(state.profile.avatar)}" alt="">` : esc(initials())
  hydrateIcons(user || document)
}

function bindActions() {
  $('#model-search')?.addEventListener('input', event => { modelQuery = event.currentTarget.value; modelPage = 1; updateModelsResults() })
  $('#model-category')?.addEventListener('change', event => { modelCategory = event.currentTarget.value; modelPage = 1; updateModelsResults() })
  if ($('#models-results')) bindModelResults()
  $$('[data-interface-theme]').forEach(button => button.onclick = () => {
    const theme = button.dataset.interfaceTheme === 'dark' ? 'dark' : 'light'
    document.body.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#111316' : '#f2f3f5'
    try { localStorage.setItem('foliodev_interface_theme', theme) } catch { toast('A preferência de tema não pôde ser salva neste navegador.', 'error') }
    $$('[data-interface-theme]').forEach(option => option.setAttribute('aria-pressed', String(option === button)))
  })
  $$('[data-analysis-period]').forEach(button => button.onclick = () => { analyticsPeriod = Number(button.dataset.analysisPeriod); render({ preserveScroll:true }) })
  $('#coupon-form')?.addEventListener('submit', event => { event.preventDefault(); const code = $('#coupon-code').value.trim(); const feedback = $('#coupon-feedback'); feedback.classList.add('error'); feedback.textContent = code ? 'Não é possível validar cupons agora. Nenhum desconto foi aplicado.' : 'Digite um cupom antes de aplicar.' })
  $('#coupon-form')?.addEventListener('reset', () => { const feedback = $('#coupon-feedback'); feedback.classList.remove('error'); feedback.textContent = 'Nenhum desconto aplicado.' })
  $$('[data-plan-coming-soon]').forEach(button => button.onclick = () => toast('As assinaturas estarão disponíveis em breve.'))
  $$('[data-project-layout]').forEach(button=>button.onclick=()=>{portfolioLayout=button.dataset.projectLayout;const grid=$('.portfolio-project-grid');grid?.classList.toggle('is-list',portfolioLayout==='list');$$('[data-project-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)))})
  $$('[data-settings-anchor]').forEach(link=>link.onclick=event=>{event.preventDefault();document.getElementById(link.dataset.settingsAnchor)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})})
  $$('[data-unlock-field]').forEach(button=>button.onclick=()=>{const input=button.closest('.field')?.querySelector('input,textarea');if(input){input.readOnly=false;input.focus()}})
  $$('[data-route-button]').forEach(button => button.onclick = () => { location.hash = button.dataset.routeButton })
  $$('[data-analytics-period]').forEach(button => button.onclick = () => { analyticsPeriod = Number(button.dataset.analyticsPeriod); render({ preserveScroll: true }) })
  $('[data-promo-plans]')?.addEventListener('click', event => { event.preventDefault(); location.assign('index.html#planos') })
  $$('[data-copy]').forEach(button => button.onclick = () => copyText(button.dataset.copy))
  $$('[data-open-preview]').forEach(button => button.onclick = openPortfolioPreview)
  $$('[data-edit-portfolio]').forEach(button => button.onclick = () => { location.hash = 'portfolio-editar' })
  $$('[data-portfolio-menu]').forEach(button => button.onclick = () => portfolioActions(button.dataset.portfolioMenu))
  $$('[data-show-folder-info]').forEach(button => button.onclick = () => showPortfolioFolderInfo(button.dataset.showFolderInfo))
  $$('[data-access-folder]').forEach(button => button.onclick = () => accessPortfolioFolder(button.dataset.accessFolder))
  $$('[data-folder-publish]').forEach(button => button.onclick = () => toggleFolderPublication(button.dataset.folderPublish))
  $$('[data-folder-id]').forEach(folder => {
    folder.onclick = event => { if (folder.tagName === 'BUTTON' || !event.target.closest('button')) openPortfolioFolder(folder.dataset.folderId) }
    folder.onkeydown = event => {
      if (event.target !== folder) return
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPortfolioFolder(folder.dataset.folderId) }
      else if (event.altKey && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
        const order = visiblePortfolioFolders().map(item => item.id)
        const index = order.indexOf(folder.dataset.folderId), next = index + (event.key === 'ArrowLeft' ? -1 : 1)
        if (next < 0 || next >= order.length) return
        ;[order[index], order[next]] = [order[next], order[index]]
        try { saveFolderOrder(order); $(`[data-folder-id="${folder.dataset.folderId}"]`)?.focus() } catch (error) { reportError('Não foi possível salvar a ordem das pastas.', error) }
      }
    }
  })
  $$('[data-new-portfolio]').forEach(button => button.onclick = createPortfolioFolder)
  $$('[data-share-portfolio]').forEach(button => button.onclick = sharePortfolio)
  $$('[data-download-qr]').forEach(button => button.onclick = downloadPortfolioQR)
  $$('[data-new-project]').forEach(button => button.onclick = () => projectModal(null, button.dataset.projectDestination || (location.hash === '#portfolio' ? 'loose' : 'projects')))
  bindProjectGrid()
  bindKapteiActions({ modal, toast })

  const folderSearch = $('#portfolio-project-search')
  if (folderSearch) folderSearch.oninput = () => {
    const query = folderSearch.value.trim().toLocaleLowerCase('pt-BR')
    const items = selectedFolderId ? projectsAt(selectedFolderId).filter(project => `${project.name} ${project.description} ${project.tech}`.toLocaleLowerCase('pt-BR').includes(query)) : []
    const grid = $('.portfolio-project-grid')
    grid.innerHTML = items.length || !query ? projectCards(items) : '<div class="projects-empty"><p>Nenhum projeto encontrado para esta busca.</p><button class="secondary-button" type="button" data-clear-portfolio-search>Limpar busca</button></div>'
    hydrateIcons(grid)
    bindProjectGrid(grid)
    $('[data-clear-portfolio-search]', grid)?.addEventListener('click', () => { folderSearch.value = ''; folderSearch.dispatchEvent(new Event('input')); folderSearch.focus() })
  }

  const search = $('#project-search'), filter = $('#type-filter'), sort = $('#project-sort')
  if (search && filter && sort) {
    const update = () => {
      const query = search.value.toLowerCase(), selection = filter.value
      const items = projectsAt('projects').filter(project => `${project.name} ${project.description} ${project.tech}`.toLowerCase().includes(query) && (selection === 'all' || selection === `status:${project.status}` || selection === `type:${projectVisualType(project)}`))
      if (sort.value === 'name') items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      if (sort.value === 'type') items.sort((a, b) => projectVisualType(a).localeCompare(projectVisualType(b), 'pt-BR'))
      $('#project-grid').innerHTML = items.length || (!query && selection === 'all')
        ? projectCards(items)
        : '<div class="card projects-empty"><p>Nenhum projeto encontrado com estes filtros.</p><button class="secondary-button" type="button" data-clear-project-filters>Limpar filtros</button></div>'
      hydrateIcons($('#project-grid'))
      bindProjectGrid()
      $('[data-clear-project-filters]')?.addEventListener('click', () => { search.value = ''; filter.value = 'all'; update(); search.focus() })
      $('[data-new-project]', $('#project-grid'))?.addEventListener('click', () => projectModal())
    }
    search.oninput = update; filter.onchange = update; sort.onchange = update
  }

  $('#portfolio-form')?.addEventListener('submit', savePortfolioForm)
  $('#my-portfolio-form')?.addEventListener('submit', savePortfolioForm)
  $$('[data-preview-project]').forEach(button => button.onclick = () => showPortfolioPreviewProject(Number(button.dataset.previewProject)))
  $('[data-toggle-publish]')?.addEventListener('click', togglePublished)
  $('[data-manage-publication-history]')?.addEventListener('click', () => { publicationHistoryExpanded = !publicationHistoryExpanded; render({ preserveScroll: true }) })
  $$('[data-open-publication-id]').forEach(button => button.onclick = () => showPublicationEvent(button.dataset.openPublicationId))
  $$('[data-publication-menu]').forEach(button => button.onclick = () => publicationEventMenu(button.dataset.publicationMenu))
  $$('[data-profile-form]').forEach(form => form.addEventListener('submit', saveProfileForm))
  $('#password-form')?.addEventListener('submit', changePassword)
  $$('[data-upload-avatar]').forEach(button => button.addEventListener('click', () => $('#avatar-file')?.click()))
  $('#avatar-file')?.addEventListener('change', handleAvatarUpload)
  $('[data-upload-profile-banner]')?.addEventListener('click', () => $('#profile-banner-file')?.click())
  $('#profile-banner-file')?.addEventListener('change', handleProfileBannerUpload)
  $('[data-connect-github]')?.addEventListener('click', connectGithub)
  $('[data-disconnect-github]')?.addEventListener('click', disconnectGithub)
  $('[data-sync-repos]')?.addEventListener('click', fetchGithubRepos)
  $('[data-retry-repos]')?.addEventListener('click', fetchGithubRepos)
  $('[data-import-selected]')?.addEventListener('click', importSelected)
  $$('[data-repo-menu]').forEach(button => button.onclick = () => repositoryMenu(Number(button.dataset.repoMenu)))
  $$('[data-setting]').forEach(button => button.onclick = () => updateSetting(button.dataset.setting))
  $('[data-export]')?.addEventListener('click', exportData)
  $('[data-delete-account]')?.addEventListener('click', confirmAccountDeletion)
}

async function downloadPortfolioQR() {
  if (!state.profile.username.trim()) return toast('Gere seu link público antes de baixar o QR Code.', 'error')
  try {
    const dataUrl = await QRCode.toDataURL(publicPortfolioUrl(), { width: 1024, margin: 2, color: { dark: '#111111', light: '#ffffff' }, errorCorrectionLevel: 'M' })
    const anchor = document.createElement('a')
    anchor.href = dataUrl
    anchor.download = `devifolio-${state.profile.username || 'portfolio'}-qrcode.png`
    anchor.click()
  } catch (error) {
    console.error('[Devifolio] Falha ao baixar QR Code', error)
    toast('Não foi possível baixar o QR Code.', 'error')
  }
}

function bindProjectGrid(root = document) {
  $$('[data-undeploy-project]',root).forEach(button=>button.onclick=()=>{projectModal(Number(button.dataset.undeployProject));$('#project-form [name="status"]').value='draft';$('#project-form .modal-head h2').textContent='Despublicar projeto';$('#project-form [type="submit"]').textContent='Confirmar undeploy'})
  $$('[data-view-project]', root).forEach(button => button.onclick = () => showProject(Number(button.dataset.viewProject)))
  $$('[data-open-project]', root).forEach(button => button.onclick = () => {
    const project = state.projects.find(item => item.id === Number(button.dataset.openProject))
    const url = normalizeExternalUrl(project?.link)
    if (url) window.open(url, '_blank', 'noopener')
    else if (project) showProject(project.id)
  })
  $$('[data-edit-project]', root).forEach(button => button.onclick = () => projectModal(Number(button.dataset.editProject)))
  $$('[data-delete-project]', root).forEach(button => button.onclick = () => confirmDelete(Number(button.dataset.deleteProject)))
  $$('[data-deploy-project]', root).forEach(button => button.onclick = () => {
    projectModal(Number(button.dataset.deployProject))
    $('#project-form [name="status"]').value = 'published'
    $('#project-form .modal-head h2').textContent = 'Publicar projeto'
    $('#project-form [type="submit"]').textContent = 'Publicar projeto'
  })
  $$('[data-project-menu]', root).forEach(button => button.onclick = () => projectOrganizer(Number(button.dataset.projectMenu)))
  $$('[data-select-project]', root).forEach(button => button.onclick = () => {
    const selected = button.getAttribute('aria-pressed') !== 'true'
    button.setAttribute('aria-pressed', String(selected))
    button.closest('.folder-project').classList.toggle('is-selected', selected)
  })
  $$('[data-drag-project]', root).forEach(card => {
    card.tabIndex = 0
    card.onkeydown = event => {
      if (!event.altKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
      event.preventDefault()
      void nudgeProject(Number(card.dataset.dragProject), ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1)
    }
  })
}

function repositoryMenu(index) {
  const repository = state.repos[index]
  if (!repository) return
  modal(`<div class="modal-head"><h2>${esc(repository.name)}</h2><button class="icon-button" data-close-modal aria-label="Fechar"><span data-icon="x"></span></button></div><div class="modal-actions"><button class="secondary-button" data-toggle-repository>Selecionar / desmarcar</button>${repository.html_url ? `<a class="primary-button" href="${esc(normalizeExternalUrl(repository.html_url))}" target="_blank" rel="noopener">Abrir no GitHub <span data-icon="external"></span></a>` : ''}</div>`)
  $('[data-toggle-repository]').onclick = () => {
    const checkbox = $(`.repo-select input[value="${index}"]`)
    if (checkbox) checkbox.checked = !checkbox.checked
    closeModal()
  }
}

function projectOrganizer(id) {
  const project = state.projects.find(item => item.id === id)
  if (!project) return
  const storedDestination = projectLocation(project)
  const destination = storedDestination === 'projects' || state.hiddenFolders.includes(storedDestination) ? 'loose' : storedDestination
  modal(`<div class="modal-head"><h2>${esc(project.name)}</h2><button class="icon-button" data-close-modal aria-label="Fechar"><span data-icon="x"></span></button></div><div class="card-action-menu"><button class="danger-button" type="button" data-delete-project="${id}"><span data-icon="trash"></span>Deletar projeto</button><button class="${project.status === 'published' ? 'danger-button' : 'primary-button publish-button'}" type="button" ${project.status === 'published' ? `data-undeploy-project="${id}"` : `data-deploy-project="${id}"`}>${project.status === 'published' ? 'Despublicar' : 'Publicar'}</button><button class="secondary-button" type="button" data-edit-project="${id}"><span data-icon="edit"></span>Editar</button></div><details class="project-organize-options"><summary>Organizar projeto</summary><label class="field"><span>Mover para</span><select id="project-destination"><option value="loose" ${destination === 'loose' ? 'selected' : ''}>Projetos sem portfólio</option>${visiblePortfolioFolders().map(folder => `<option value="${folder.id}" ${destination === folder.id ? 'selected' : ''}>${esc(folderName(folder.id))}</option>`).join('')}</select></label><div class="organizer-actions"><button class="secondary-button" data-move-project>Mover projeto</button><button class="secondary-button" data-order-project="-1">Mover antes</button><button class="secondary-button" data-order-project="1">Mover depois</button><button class="secondary-button" data-view-project="${id}">Visualizar</button><button class="secondary-button" data-open-project="${id}">Acessar</button></div></details>`)
  bindProjectGrid($('#modal-root'))
  $('[data-move-project]').onclick = async event => {
    setButtonLoading(event.currentTarget, true, 'Movendo...')
    try { await organizeProject(id, $('#project-destination').value); closeModal() } catch (error) { reportError('Não foi possível mover o projeto.', error); setButtonLoading(event.currentTarget, false) }
  }
  $$('[data-order-project]').forEach(button => button.onclick = async () => { await nudgeProject(id, Number(button.dataset.orderProject)); closeModal() })
}

async function nudgeProject(id, offset) {
  const project = state.projects.find(item => item.id === id)
  if (!project) return
  const items = projectsAt(projectLocation(project))
  const index = items.findIndex(item => item.id === id), next = index + offset
  if (next < 0 || next >= items.length) return
  const beforeId = offset < 0 ? items[next].id : items[next + 1]?.id || null
  try { await organizeProject(id, projectLocation(project), beforeId); $(`[data-drag-project="${id}"]`)?.focus() } catch (error) { reportError('Não foi possível salvar a ordem.', error) }
}

function saveFolderOrder(order) {
  const clean = orderedFolders(order).map(folder => folder.id)
  localStorage.setItem(`devifolio_folder_order_${currentUser.id}`, JSON.stringify(clean))
  state.folderOrder = clean
  render({ preserveScroll: true })
}

let organizingProject = false
async function organizeProject(id, destination, beforeId = null) {
  if (organizingProject) throw new Error('Aguarde a organização anterior terminar.')
  const changes = planProjectMove(state.projects, id, destination, beforeId)
  if (!changes.length) return
  organizingProject = true
  try {
    state.projects = await persistProjectMove(state.projects, changes, (projectId, order) => moveProject(currentUser.id, projectId, order))
    if (destination !== 'projects' && destination !== 'loose') selectedFolderId = destination
    if (destination === 'projects') location.hash = 'projetos'
    else if (destination === 'loose') location.hash = 'portfolio'
    else location.hash = 'portfolio'
    render({ preserveScroll: true })
  } catch (error) {
    // The server remains the source of truth, including a failed rollback.
    try { const workspace = await loadWorkspace(currentUser.id); if (workspace.available) state.projects = workspace.projects } catch (reloadError) { console.error('[Devifolio] Organização não recarregada.', reloadError) }
    render({ preserveScroll: true })
    throw error
  } finally { organizingProject = false }
}

$('#page-content').addEventListener('dragstart', event => { if (document.body.classList.contains('static-page-route')) event.preventDefault() }, true)

bindExplorerDrag({
  canMove: (id, destination) => {
    const project = state.projects.find(item => item.id === id)
    return !organizingProject && destination === 'projects' && project && projectLocation(project) === 'projects'
  },
  moveProject: organizeProject,
  reorderFolders: saveFolderOrder,
  onError: error => { render({ preserveScroll: true }); reportError('Não foi possível salvar a organização. A ordem anterior foi restaurada.', error) },
})

async function savePortfolioForm(event) {
  event.preventDefault()
  const button = event.currentTarget.querySelector('[type="submit"]')
  const changes = Object.fromEntries(new FormData(event.currentTarget))
  setButtonLoading(button, true, 'Salvando...')
  try {
    const next = { ...state.profile, ...changes }
    await saveProfile(currentUser.id, next, state.published)
    Object.assign(state.profile, next)
    toast('Portfólio atualizado com sucesso.')
    render()
  } catch (error) { reportError('Não foi possível salvar o portfólio.', error) } finally { setButtonLoading(button, false) }
}

async function togglePublished() {
  if (!state.published && !profileComplete()) return toast('Adicione seu nome e username antes de publicar.', 'error')
  if (state.published) {
    modal(`<div class="confirm-dialog"><h2>Despublicar portfólio?</h2><p>Seu portfólio público ficará indisponível para visitantes.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancelar</button><button class="danger-button" data-confirm-unpublish>Despublicar</button></div></div>`)
    $('[data-confirm-unpublish]').onclick = () => runPortfolioPublication(false)
    return
  }
  await runPortfolioPublication(true)
}

async function runPortfolioPublication(publishing) {
  closeModal({ immediate: true })
  screenLoading.show(publishing ? 'Publicando portfólio...' : 'Despublicando portfólio...')
  let timeoutId
  try {
    await Promise.all([
      Promise.race([
        saveProfile(currentUser.id, state.profile, publishing),
        new Promise((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error('A publicação demorou demais. Atualize a página para conferir o estado antes de tentar novamente.')), 30000)
        }),
      ]),
      publishing ? new Promise(resolve => window.setTimeout(resolve, 4000)) : Promise.resolve(),
    ])
    state.published = publishing
    try {
      visualPublications = recordVisualPublication(localStorage, currentUser.id, visualPublications, {
        name: `Portfólio de ${realName()}`,
        published: publishing,
        url: publicPortfolioUrl(),
        snapshot: publishing ? { profile: { ...state.profile }, projects: state.projects.filter(project => project.status === 'published').map(project => ({ ...project })) } : null,
      })
    } catch (storageError) { console.warn('[Devifolio] Histórico visual não salvo.', storageError) }
    render({ preserveScroll: true })
    if (publishing) {
      screenLoading.success('Portfólio publicado.')
      await new Promise(resolve => window.setTimeout(resolve, 500))
    }
    toast(publishing ? 'Portfólio publicado.' : 'Portfólio despublicado.')
  } catch (error) {
    reportError(error.message?.includes('demorou demais') ? error.message : publishing ? 'Não foi possível publicar. Tente novamente.' : 'Não foi possível despublicar. Tente novamente.', error)
  } finally {
    window.clearTimeout(timeoutId)
    screenLoading.hide()
  }
}

async function saveProfileForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const button = form.querySelector('[type="submit"]')
  const changes = Object.fromEntries(new FormData(form))
  if (changes.username) changes.username = changes.username.trim().toLowerCase()
  setButtonLoading(button, true, 'Salvando...')
  try {
    const authChanges = {}
    if (changes.name !== undefined) authChanges.data = { full_name: changes.name }
    if (changes.email && changes.email !== currentUser.email) authChanges.email = changes.email
    if (Object.keys(authChanges).length) { const { error } = await supabase.auth.updateUser(authChanges); if (error) throw error }
    const next = { ...state.profile, ...changes }
    await saveProfile(currentUser.id, next, state.published)
    Object.assign(state.profile, next)
    if (changes.email) currentUser.email = changes.email
    toast('Perfil atualizado.')
    render()
  } catch (error) { reportError(error?.code === '23505' ? 'Este username já está em uso.' : 'Não foi possível atualizar o perfil.', error) } finally { setButtonLoading(button, false) }
}

async function changePassword(event) {
  event.preventDefault()
  const form = event.currentTarget
  const button = form.querySelector('[type="submit"]')
  if ($('#new-password').value !== $('#confirm-password').value) return toast('As novas senhas não coincidem.', 'error')
  setButtonLoading(button, true, 'Atualizando...')
  try {
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: $('#current-password').value })
    if (reauthError) throw new Error('A senha atual está incorreta.')
    const { error } = await supabase.auth.updateUser({ password: $('#new-password').value })
    if (error) throw error
    form.reset(); toast('Senha alterada com segurança.')
  } catch (error) { reportError(error.message || 'Não foi possível alterar a senha.', error) } finally { setButtonLoading(button, false) }
}

async function handleAvatarUpload(event) {
  const file = event.currentTarget.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) return toast('Use uma imagem JPG, PNG ou WebP de até 3 MB.', 'error')
  const button = $('[data-upload-avatar]')
  setButtonLoading(button, true, 'Enviando...')
  try {
    const avatar = await uploadAvatar(currentUser.id, file)
    const next = { ...state.profile, avatar }
    await saveProfile(currentUser.id, next, state.published)
    Object.assign(state.profile, next)
    toast('Foto atualizada.')
    render()
  } catch (error) { reportError('Não foi possível enviar a foto.', error) } finally { setButtonLoading(button, false) }
}

async function handleProfileBannerUpload(event) {
  const file = event.currentTarget.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return toast('Use uma imagem JPG, PNG ou WebP de até 5 MB.', 'error')
  screenLoading.show('Enviando capa do portfólio...')
  try {
    await uploadPortfolioBanner(currentUser.id, file)
    profileBannerRevision = String(Date.now())
    render({ preserveScroll: true })
    toast('Capa atualizada.')
  } catch (error) { reportError('Não foi possível atualizar a capa.', error) }
  finally { screenLoading.hide() }
}

async function showProject(id) {
  const project = state.projects.find(item => item.id === id)
  if (!project) return
  const projectLink = normalizeExternalUrl(project.link)
  const githubLink = project.github ? normalizeExternalUrl(project.github.includes('/') && !project.github.includes('.') ? `github.com/${project.github}` : project.github) : ''
  modal(`<div class="project-detail"><div class="project-cover detail-cover">${project.image ? `<img class="project-cover-image" src="${esc(project.image)}" alt="">` : `<span>${esc(project.name.slice(0, 2).toUpperCase())}</span>`}</div>${projectTypeChip(project)}<h2>${esc(project.name)}</h2>${project.description ? `<p>${esc(project.description)}</p>` : ''}<div class="tag-row">${project.tech.split(',').filter(Boolean).map(item => `<span>${esc(item.trim())}</span>`).join('')}</div><div class="modal-actions"><button class="secondary-button" data-close-modal>Fechar</button>${githubLink ? `<a class="secondary-button" href="${esc(githubLink)}" target="_blank" rel="noopener">GitHub</a>` : ''}${projectLink ? `<a class="primary-button" href="${esc(projectLink)}" target="_blank" rel="noopener">Ver projeto <span data-icon="external"></span></a>` : ''}<button class="secondary-button" data-project-menu="${project.id}">Organizar</button><button class="icon-button edit-action" data-edit-project="${project.id}" aria-label="Editar projeto" title="Editar projeto"><span data-icon="edit"></span></button></div></div>`)
  bindProjectGrid($('#modal-root'))
}

function showPortfolioPreviewProject(id) {
  const project = state.projects.find(item => item.id === id && item.status === 'published')
  if (!project) return
  const projectLink = normalizeExternalUrl(project.link)
  modal(`<div class="project-detail my-portfolio-project-detail"><div class="project-cover detail-cover">${project.image ? `<img class="project-cover-image" src="${esc(project.image)}" alt="Capa de ${esc(project.name)}">` : `<span>${esc(project.name.slice(0, 2).toUpperCase())}</span>`}</div><h2>${esc(project.name)}</h2><p>${esc(project.description || 'Conheça este projeto.')}</p>${project.tech ? `<div class="tag-row">${project.tech.split(',').filter(Boolean).map(item => `<span>${esc(item.trim())}</span>`).join('')}</div>` : ''}<div class="modal-actions"><button class="secondary-button" type="button" data-close-modal>Fechar</button>${projectLink ? `<a class="primary-button" href="${esc(projectLink)}" target="_blank" rel="noopener">Acessar</a>` : ''}</div></div>`)
}

function projectModal(id, destination = 'projects') {
  const project = state.projects.find(item => item.id === id) || { name: '', description: '', tech: '', link: '', github: '', image: '', status: 'draft' }
  modal(`<form id="project-form"><div class="modal-head"><div><p class="eyebrow">PROJETOS</p><h2>${id ? 'Editar projeto' : 'Novo projeto'}</h2></div><button class="icon-button" type="button" data-close-modal><span data-icon="x"></span></button></div><div class="form-grid"><label class="field full"><span>Nome do projeto</span><input name="name" required maxlength="60" value="${esc(project.name)}"></label><label class="field full"><span>Descrição</span><textarea name="description" maxlength="180">${esc(project.description)}</textarea></label><div class="field full"><span>Imagem de capa</span><div class="project-image-upload"><div class="project-image-preview" id="project-image-preview">${project.image ? `<img src="${esc(project.image)}" alt="Imagem atual do projeto">` : '<span data-icon="upload"></span>'}</div><div class="project-image-upload-copy"><input id="project-image-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><button class="secondary-button nuda-browse" type="button" id="project-image-button">${UploadButton('Carregar do computador')}</button><strong id="project-image-name">${project.image ? 'Imagem atual do projeto' : 'Nenhum arquivo selecionado'}</strong><small>JPG, PNG ou WEBP, até 5 MB. Vídeos e outros arquivos não são aceitos.</small></div></div></div><label class="field full"><span>Tecnologias</span><input name="tech" value="${esc(project.tech)}" placeholder="React, Node.js, PostgreSQL"></label><label class="field"><span>Link publicado</span><input type="url" name="link" value="${esc(project.link)}" placeholder="https://"></label><label class="field"><span>Repositório GitHub</span><input name="github" value="${esc(project.github)}" placeholder="usuario/repositorio"></label><label class="field full"><span>Publicação</span><select name="status"><option value="published" ${project.status === 'published' ? 'selected' : ''}>Publicado</option><option value="progress" ${project.status === 'progress' ? 'selected' : ''}>Em desenvolvimento</option><option value="draft" ${project.status === 'draft' ? 'selected' : ''}>Rascunho</option></select></label></div><div class="modal-actions"><button class="secondary-button" type="button" data-close-modal>Cancelar</button><button class="primary-button" type="submit">${id ? 'Salvar alterações' : 'Criar projeto'}</button></div></form>`, { creationPanel: true })
  const imageInput = $('#project-image-file')
  const imageButton = $('#project-image-button')
  const imageName = $('#project-image-name')
  const imagePreview = $('#project-image-preview')
  let previewUrl = ''
  imageButton.onclick = () => imageInput.click()
  imageInput.onchange = () => {
    const file = imageInput.files?.[0]
    const validationError = validateProjectImage(file)
    if (validationError) {
      imageInput.value = ''
      imageName.textContent = project.image ? 'Imagem atual do projeto' : 'Nenhum arquivo selecionado'
      toast(validationError, 'error')
      return
    }
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    previewUrl = URL.createObjectURL(file)
    imageName.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`
    imagePreview.innerHTML = `<img src="${esc(previewUrl)}" alt="Prévia da imagem selecionada">`
  }
  $('#project-form').onsubmit = async event => {
    event.preventDefault()
    const button = event.currentTarget.querySelector('[type="submit"]')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const next = { id: id || Date.now(), image: project.image || '', sortOrder: id ? project.sortOrder : nextSortOrder(state.projects, destination), ...data }
    const imageFile = imageInput.files?.[0]
    const validationError = validateProjectImage(imageFile)
    if (validationError) return toast(validationError, 'error')
    setButtonLoading(button, true, 'Salvando...')
    try {
      if (imageFile) next.image = await uploadProjectImage(currentUser.id, next.id, imageFile)
      const saved = await saveProject(currentUser.id, next, id ? state.projects.findIndex(item => item.id === id) : 0)
      if (id) state.projects.splice(state.projects.findIndex(item => item.id === id), 1, saved)
      else state.projects.unshift(saved)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      closeModal(); render({ preserveScroll: true }); toast(id ? 'Projeto atualizado.' : 'Projeto criado com sucesso.')
    } catch (error) { reportError('Não foi possível salvar o projeto.', error); setButtonLoading(button, false) }
  }
}

function confirmDelete(id) {
  const project = state.projects.find(item => item.id === id)
  if (!project) return
  modal(`<div class="confirm-dialog"><span class="circle-icon danger-icon" data-icon="trash"></span><h2>Excluir ${esc(project.name)}?</h2><p>O projeto será removido do painel e do portfólio público.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancelar</button><button class="danger-button" id="confirm-delete">Excluir projeto</button></div></div>`)
  $('#confirm-delete').onclick = async event => {
    setButtonLoading(event.currentTarget, true, 'Excluindo...')
    try {
      await removeProject(currentUser.id, id)
      await removeProjectImage(currentUser.id, id)
      state.projects = state.projects.filter(item => item.id !== id)
      closeModal(); toast('Projeto excluído.'); render()
    } catch (error) { reportError('Não foi possível excluir o projeto.', error); setButtonLoading(event.currentTarget, false) }
  }
}

async function connectGithub(event) {
  const button = event.currentTarget
  setButtonLoading(button, true, 'Conectando ao GitHub...')
  screenLoading.show('Conectando GitHub...')
  try {
    const data = await authenticatedApi('/api/github/connect', { method: 'POST' })
    if (!data.authorizationUrl) throw new Error('A autorização do GitHub não retornou um endereço válido.')
    location.assign(data.authorizationUrl)
  } catch (error) {
    screenLoading.hide()
    reportError('Falha ao conectar o GitHub. Tente novamente.', error)
    setButtonLoading(button, false)
  }
}

async function disconnectGithub() {
  screenLoading.show('Desconectando GitHub...')
  try {
    await authenticatedApi('/api/github/connection', { method: 'DELETE' })
    state.githubConnected = false
    state.githubUsername = ''
    state.repos = []
    reposLoaded = false
    reposPromise = null
    render()
    screenLoading.hide()
    toast('Conta do GitHub desconectada.')
  } catch (error) {
    screenLoading.hide()
    reportError('Não foi possível desconectar o GitHub. Tente novamente.', error)
  }
}

async function fetchGithubRepos({ reportFailure = true } = {}) {
  githubConnectionChecked = true
  reposLoading = true; render()
  let loaded = false
  try {
    const data = await authenticatedApi('/api/github/repos')
    state.repos = Array.isArray(data.repositories) ? data.repositories : []
    state.githubConnected = true
    if (!state.githubUsername) {
      try {
        const account = await authenticatedApi('/api/github/connection')
        state.githubUsername = account.connection?.github_username || ''
      } catch (error) { console.warn('[Devifolio] Não foi possível atualizar o nome da conta GitHub.', error) }
    }
    repoLoadFailed = false
    loaded = true
  } catch (error) { state.repos = []; repoLoadFailed = true; if (reportFailure && state.githubConnected) reportError('Não foi possível carregar os repositórios.', error); else console.error('[Devifolio] Não foi possível carregar os repositórios.', error) } finally { reposLoading = false; reposLoaded = true; render() }
  return loaded
}

async function authenticatedApi(path, options = {}) {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new Error('Sua sessão expirou. Entre novamente.')
  const response = await fetch(path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `A integração respondeu com ${response.status}.`)
  return payload
}

async function showGithubCallbackResult() {
  const params = new URLSearchParams(location.search)
  const status = params.get('github')
  if (!status) return
  screenLoading.show('Confirmando conexão com o GitHub...')
  history.replaceState(null, '', location.pathname + (location.hash || '#github'))

  if (status === 'connected') {
    const repositories = reposPromise || (reposLoaded && state.githubConnected && !repoLoadFailed ? Promise.resolve(true) : fetchGithubRepos({ reportFailure: false }))
    screenLoading.show('Buscando repositórios do GitHub...')
    const repositoriesReady = await repositories
    if (!repositoriesReady) {
      screenLoading.hide()
      toast('GitHub conectado. Não foi possível carregar os repositórios; tente novamente.', 'error')
      return
    }
    screenLoading.hide()
    toast('Conta do GitHub conectada com sucesso.')
    return
  }

  screenLoading.hide()
  if (status === 'access_denied') toast('A autorização do GitHub foi cancelada.', 'error')
  else if (status === 'invalid_state') toast('A autorização expirou. Tente conectar novamente.', 'error')
  else toast('O GitHub não concluiu a autorização. Tente novamente.', 'error')
}

async function importSelected(event) {
  if (!state.githubConnected) return toast('Conecte o GitHub antes de adicionar repositórios.', 'error')
  const selected = $$('.repo-row input:checked').map(input => state.repos[Number(input.value)]).filter(Boolean)
  if (!selected.length) return toast('Selecione ao menos um repositório.', 'error')
  const button = event.currentTarget
  const oldFeedback = $('.repo-import-feedback')
  oldFeedback?.remove()
  setButtonLoading(button, true, 'Adicionando repositório...')
  let added = 0
  try {
    const response = await authenticatedApi('/api/github/repos')
    const plan = planGithubImport(selected, Array.isArray(response.repositories) ? response.repositories : [], state.projects)
    if (!plan.repositories.length) {
      const reason = plan.removed ? 'O repositório selecionado não está mais disponível no GitHub. Sincronize a lista e tente novamente.' : 'Este repositório já está no seu portfólio.'
      toast(reason, 'error')
      return
    }
    for (const repository of plan.repositories) {
      let id = Date.now() + state.projects.length
      while (state.projects.some(project => project.id === id)) id++
      const saved = await saveProject(currentUser.id, importedGithubProject(repository, state.projects, id))
      state.projects.push(saved)
      added++
    }
    location.hash = 'portfolio'
    render()
    toast(added === 1 ? 'Repositório adicionado.' : `${added} repositórios adicionados.`)
    if (plan.removed || plan.duplicates) toast(`${plan.duplicates} já adicionado(s); ${plan.removed} indisponível(is) no GitHub.`, 'error')
  } catch (error) {
    const expired = /sessão expir/i.test(error.message || '')
    const message = expired ? 'Sua sessão expirou. Entre novamente para adicionar o repositório.' : added ? `${added} repositório(s) adicionado(s). Os demais não puderam ser salvos. Tente novamente.` : 'Não foi possível adicionar. Verifique a conexão e tente novamente.'
    reportError(message, error)
    const feedback = document.createElement('p')
    feedback.className = 'repo-import-feedback'
    feedback.setAttribute('role', 'alert')
    feedback.textContent = message
    button.closest('.section-card-head')?.after(feedback)
  } finally { setButtonLoading(button, false) }
}

async function updateSetting(key) {
  const next = { ...state.settings, [key]: !state.settings[key] }
  try { await saveSettings(currentUser.id, next); Object.assign(state.settings, next); render() } catch (error) { reportError('Não foi possível salvar a configuração.', error) }
}


function exportData() {
  const payload = JSON.stringify({ profile: state.profile, published: state.published, projects: state.projects, settings: state.settings, analytics: state.analytics }, null, 2)
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `devifolio-${state.profile.username || 'dados'}.json`; anchor.click(); URL.revokeObjectURL(url)
  toast('Dados exportados.')
}

function confirmAccountDeletion() {
  modal(`<div class="confirm-dialog"><span class="circle-icon danger-icon" data-icon="trash"></span><h2>Excluir sua conta?</h2><p>Perfil, projetos e dados associados serão removidos permanentemente.</p><div class="modal-actions"><button class="secondary-button" data-close-modal>Cancelar</button><button class="danger-button" id="confirm-account-delete">Excluir definitivamente</button></div></div>`)
  $('#confirm-account-delete').onclick = async event => {
    setButtonLoading(event.currentTarget, true, 'Excluindo...')
    try { await deleteCurrentAccount(); await supabase.auth.signOut(); location.replace('index.html') } catch (error) { reportError('Não foi possível excluir a conta.', error); setButtonLoading(event.currentTarget, false) }
  }
}

async function sharePortfolio() {
  const url = publicPortfolioUrl()
  try {
    if (navigator.share) await navigator.share({ title: `Portfólio de ${realName()}`, url })
    else await copyText(url)
  } catch (error) { if (error.name !== 'AbortError') reportError('Não foi possível compartilhar.', error) }
}



async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Link copiado.') } catch (error) { reportError('Não foi possível copiar o link.', error) }
}


let modalCloseTimer = null
function modal(content, { creationPanel = false, dismissible = true, folderWindow = false } = {}) {
  const root = $('#modal-root')
  const opener = screenLoading.modalOpener() || document.activeElement
  if (modalCloseTimer) { clearTimeout(modalCloseTimer); modalCloseTimer = null }
  screenLoading.closeModal({ immediate: true, restoreFocus: false })
  root.innerHTML = `<div class="modal-backdrop${creationPanel ? ' creation-backdrop' : ''}${folderWindow ? ' portfolio-folder-modal-backdrop' : ''}"><div class="modal${creationPanel ? ' creation-panel' : ''}${folderWindow ? ' portfolio-folder-modal' : ''}" role="dialog" aria-modal="true">${content}</div></div>`
  const backdrop = root.querySelector('.modal-backdrop')
  hydrateIcons(root)
  root.querySelector('[role="dialog"]').setAttribute('aria-label',root.querySelector('h2')?.textContent || 'FolioDev')
  $$('[data-close-modal]').forEach(button => button.onclick = closeModal)
  backdrop.onclick = event => { if (dismissible && event.target === event.currentTarget) closeModal() }
  screenLoading.openModal(backdrop, { opener, onDismiss: closeModal, dismissible })
}

function closeModal(options = {}) {
  const backdrop = $('#modal-root .modal-backdrop')
  if (!backdrop || options.immediate || !motionDuration()) {
    if (modalCloseTimer) { clearTimeout(modalCloseTimer); modalCloseTimer = null }
    screenLoading.closeModal(options)
  } else if (!backdrop.classList.contains('is-closing')) {
    backdrop.classList.add('is-closing')
    modalCloseTimer = window.setTimeout(() => {
      modalCloseTimer = null
      screenLoading.closeModal({ restoreFocus: options.restoreFocus !== false })
    }, motionDuration())
  }
  $$('[data-folder-id].is-open').forEach(folder => folder.classList.remove('is-open'))
}

function setButtonLoading(button, loading, label = '') { if (!button) return; button.classList.toggle('is-loading',loading); if (loading) { button.dataset.original = button.innerHTML; button.dataset.originalWidth=button.style.width; button.style.width=button.getBoundingClientRect().width+'px'; button.disabled = true; button.textContent = label } else { button.disabled = false; button.style.width=button.dataset.originalWidth||''; if (button.dataset.original) button.innerHTML = button.dataset.original; hydrateIcons(button) } }
function reportError(message, error) { console.error(`[Devifolio] ${message}`, error); toast(message, 'error') }
function toast(message, type = 'success') { const element = document.createElement('div'); element.className = `toast ${type}`; element.innerHTML = `<span data-icon="${type === 'error' ? 'x' : 'check'}"></span>${esc(message)}`; $('#toast-stack').append(element); hydrateIcons(element); setTimeout(() => element.remove(), 4200) }
let userMenuCloseTimer = null
function closeUserMenu({ immediate = false } = {}) {
  const menu = $('#user-menu')
  $('#user-menu-toggle')?.setAttribute('aria-expanded', 'false')
  if (!menu || menu.hasAttribute('hidden') || menu.classList.contains('is-closing')) return
  if (immediate || !motionDuration()) { menu.setAttribute('hidden', ''); return }
  menu.classList.add('is-closing')
  userMenuCloseTimer = window.setTimeout(() => {
    menu.setAttribute('hidden', '')
    menu.classList.remove('is-closing')
    userMenuCloseTimer = null
  }, motionDuration())
}
let drawerCloseTimer = null
function closeMenu() {
  $('#sidebar')?.classList.remove('open')
  $('#sidebar')?.removeAttribute('role')
  $('#sidebar')?.removeAttribute('aria-modal')
  $('.main-content').inert=false
  const overlay = $('#sidebar-overlay')
  if (overlay?.classList.contains('show') && !overlay.classList.contains('is-closing')) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) overlay.classList.remove('show')
    else {
      overlay.classList.add('is-closing')
      drawerCloseTimer = window.setTimeout(() => { overlay.classList.remove('show', 'is-closing'); drawerCloseTimer = null }, 200)
    }
  }
  $('#menu-toggle')?.setAttribute('aria-expanded', 'false')
}
function setSidebarCollapsed(collapsed) {
  $('.app-shell')?.classList.toggle('sidebar-collapsed', collapsed)
  const toggle = $('#sidebar-toggle')
  toggle?.setAttribute('aria-expanded', String(!collapsed))
  toggle?.setAttribute('aria-label', collapsed ? 'Expandir menu' : 'Recolher menu')
  toggle?.setAttribute('data-tooltip', collapsed ? 'Expandir menu' : 'Recolher menu')
  try { localStorage.setItem('devifolio_sidebar_collapsed', String(collapsed)) } catch { /* armazenamento indisponível */ }
  syncSidebarResizeHandle()
}

const sidebarResizeHandle = $('#sidebar-resize-handle')
const sidebarWidthKey = 'devifolio_sidebar_width'
let sidebarResizeStart = null
function sidebarWidthLimits() { return { min: 180, max: Math.max(180, Math.min(320, Math.floor(window.innerWidth * .32))) } }
function setExpandedSidebarWidth(width, persist = false) {
  const { min, max } = sidebarWidthLimits()
  const next = Math.min(max, Math.max(min, Math.round(width)))
  $('.app-shell').style.setProperty('--sidebar-expanded-width', `${next}px`)
  sidebarResizeHandle?.setAttribute('aria-valuemax', String(max))
  sidebarResizeHandle?.setAttribute('aria-valuenow', String(next))
  if (persist) { try { localStorage.setItem(sidebarWidthKey, String(next)) } catch { /* armazenamento indisponível */ } }
}
function syncSidebarResizeHandle() {
  if (!sidebarResizeHandle) return
  const { max } = sidebarWidthLimits()
  sidebarResizeHandle.setAttribute('aria-valuemax', String(max))
  sidebarResizeHandle.setAttribute('aria-valuenow', String(Math.round($('#sidebar').getBoundingClientRect().width)))
}
try {
  const savedWidth = Number(localStorage.getItem(sidebarWidthKey))
  if (Number.isFinite(savedWidth) && savedWidth >= 180) setExpandedSidebarWidth(savedWidth)
} catch { /* armazenamento indisponível */ }
sidebarResizeHandle?.addEventListener('pointerdown', event => {
  if (event.button !== 0 || $('.app-shell').classList.contains('sidebar-collapsed') || window.innerWidth <= 820) return
  event.preventDefault()
  sidebarResizeStart = { x: event.clientX, width: $('#sidebar').getBoundingClientRect().width }
  $('.app-shell').classList.add('is-resizing')
  sidebarResizeHandle.setPointerCapture(event.pointerId)
})
sidebarResizeHandle?.addEventListener('pointermove', event => {
  if (!sidebarResizeStart) return
  setExpandedSidebarWidth(sidebarResizeStart.width + event.clientX - sidebarResizeStart.x)
})
function finishSidebarResize() {
  if (!sidebarResizeStart) return
  sidebarResizeStart = null
  $('.app-shell').classList.remove('is-resizing')
  setExpandedSidebarWidth($('#sidebar').getBoundingClientRect().width, true)
}
sidebarResizeHandle?.addEventListener('pointerup', finishSidebarResize)
sidebarResizeHandle?.addEventListener('pointercancel', finishSidebarResize)
sidebarResizeHandle?.addEventListener('keydown', event => {
  const { min, max } = sidebarWidthLimits()
  const width = $('#sidebar').getBoundingClientRect().width
  const next = event.key === 'ArrowLeft' ? width - 10 : event.key === 'ArrowRight' ? width + 10 : event.key === 'Home' ? min : event.key === 'End' ? max : null
  if (next === null) return
  event.preventDefault()
  setExpandedSidebarWidth(next, true)
})
window.addEventListener('resize', syncSidebarResizeHandle)
syncSidebarResizeHandle()

$('#menu-toggle').onclick = () => { if (drawerCloseTimer) { clearTimeout(drawerCloseTimer); drawerCloseTimer = null }; $('#sidebar-overlay').classList.remove('is-closing'); const open = $('#sidebar').classList.toggle('open'); $('#sidebar-overlay').classList.toggle('show', open); $('#menu-toggle').setAttribute('aria-expanded', String(open));$('.main-content').inert=open;if(open){$('#sidebar').setAttribute('role','dialog');$('#sidebar').setAttribute('aria-modal','true');$('#sidebar .nav-item.active')?.focus()}else{$('#sidebar').removeAttribute('role');$('#sidebar').removeAttribute('aria-modal')} }
$('#sidebar-overlay').onclick = closeMenu
$('#sidebar-toggle').onclick = () => setSidebarCollapsed(!$('.app-shell')?.classList.contains('sidebar-collapsed'))
$('#user-menu-toggle').onclick = event => {
  event.stopPropagation()
  const menu = $('#user-menu')
  const open = menu.hasAttribute('hidden') || menu.classList.contains('is-closing')
  if (userMenuCloseTimer) { clearTimeout(userMenuCloseTimer); userMenuCloseTimer = null }
  menu.classList.remove('is-closing')
  if (open) menu.removeAttribute('hidden')
  else closeUserMenu()
  $('#user-menu-toggle').setAttribute('aria-expanded', String(open))
}
document.addEventListener('click', event => { if (!event.target.closest('#user-menu') && !event.target.closest('#user-menu-toggle')) closeUserMenu() })
function renderWithTransition() {
  closeModal({ immediate: true })
  closeMenu()
  closeUserMenu()
  if (bootstrapping) { render(); return }
  const requestedRoute = location.hash.slice(1)
  const route = views[requestedRoute] ? requestedRoute : 'inicio'
  if (requestedRoute && !views[requestedRoute]) history.replaceState(null, '', `${location.pathname}${location.search}#inicio`)
  if (route === renderedRoute) return
  render()
}
window.addEventListener('hashchange', renderWithTransition)


async function bootstrap() {
  hydrateIcons()
  const entrance = screenLoading.enterDashboard(render)
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) { entrance.abort(); location.replace('cadastro.html#login'); return }
  currentUser = data.session.user
  try { state.folderNames = JSON.parse(localStorage.getItem(`devifolio_folder_names_${currentUser.id}`) || '{}'); if (!state.folderNames || typeof state.folderNames !== 'object' || Array.isArray(state.folderNames)) state.folderNames = {} } catch { state.folderNames = {} }
  try { state.folderOrder = JSON.parse(localStorage.getItem(`devifolio_folder_order_${currentUser.id}`) || '[]'); if (!Array.isArray(state.folderOrder)) state.folderOrder = [] } catch { state.folderOrder = [] }
  try { state.hiddenFolders = JSON.parse(localStorage.getItem(`devifolio_hidden_folders_${currentUser.id}`) || '[]'); if (!Array.isArray(state.hiddenFolders)) state.hiddenFolders = [] } catch { state.hiddenFolders = [] }
  visualPublications = readVisualPublications(localStorage, currentUser.id)
  restorePortfolioFolders(state.folderNames)
  render()
  try {
    const workspace = await loadWorkspace(currentUser.id)
    if (!workspace.available) throw new Error('A estrutura mais recente do banco ainda não foi aplicada.')
    const base = (currentUser.email?.split('@')[0] || 'dev').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'dev'
    const accountDefaults = {
      name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '',
      username: `${base}-${currentUser.id.slice(0, 6)}`,
      email: currentUser.email || '',
    }
    if (workspace.profile) {
      Object.assign(state.profile, workspace.profile)
      state.published = workspace.profile.published
      const missingAccountFields = !state.profile.name || !state.profile.username || !state.profile.email
      if (missingAccountFields) {
        state.profile.name ||= accountDefaults.name
        state.profile.username ||= accountDefaults.username
        state.profile.email ||= accountDefaults.email
        try { await saveProfile(currentUser.id, state.profile, state.published) } catch (initialProfileError) { console.error('[Devifolio] Perfil inicial não salvo', initialProfileError); toast('Não foi possível salvar o perfil inicial.', 'error') }
      }
    } else {
      Object.assign(state.profile, { ...blankProfile, ...accountDefaults })
      try { await saveProfile(currentUser.id, state.profile, false) } catch (initialProfileError) { console.error('[Devifolio] Perfil inicial não salvo', initialProfileError); toast('Não foi possível salvar o perfil inicial.', 'error') }
    }
    if (workspace.settingsAvailable && !workspace.settings) {
      try { await saveSettings(currentUser.id, state.settings) } catch (initialSettingsError) { console.error('[Devifolio] Configurações iniciais não salvas', initialSettingsError) }
    }
    state.projects = workspace.projects || []
    restorePortfolioFolders(state.folderNames, state.projects)
    state.analytics = workspace.analytics || []
    state.leads = workspace.leads || []
    state.leadsAvailable = workspace.leadsAvailable
    state.githubConnected = Boolean(workspace.githubConnection)
    state.githubUsername = workspace.githubConnection?.github_username || ''
    if (workspace.settings) Object.assign(state.settings, { email: workspace.settings.email_notifications, product: workspace.settings.product_notifications, publicProfile: workspace.settings.public_profile, compact: workspace.settings.compact_mode })
  } catch (loadError) {
    console.error('[Devifolio] Falha ao carregar dados reais', loadError)
    $('#page-content').innerHTML = `<section class="page-enter"><article class="card fatal-state">${emptyState('x', 'Não foi possível carregar seus dados.', 'Confira sua conexão e tente novamente. Se persistir, entre em contato com o suporte.', '<button class="primary-button" data-retry-workspace>Tentar novamente</button>')}</article></section>`
    hydrateIcons($('#page-content'))
    $('[data-retry-workspace]')?.addEventListener('click',()=>location.reload())
    toast('Confira sua conexão e tente novamente.', 'error')
    bootstrapping = false
    entrance.ready()
    return
  }
  hydrateIcons()
  setSidebarCollapsed(localStorage.getItem('devifolio_sidebar_collapsed') === 'true')
  if (onboardingRequested && !new URLSearchParams(location.search).has('github')) history.replaceState(null, '', `${location.pathname}${location.hash || '#inicio'}`)
  bootstrapping = false
  render()
  if (new URLSearchParams(location.search).has('github')) void showGithubCallbackResult()
  else entrance.ready()
}

supabase.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) { screenLoading.show('Saindo da conta...'); closeModal({ immediate: true }); location.replace('cadastro.html#login') } })
$$('[data-logout]').forEach(link => link.addEventListener('click', async event => { event.preventDefault(); await supabase.auth.signOut(); location.replace('cadastro.html#login') }))

bootstrap()

window.addEventListener('offline',()=>{if(document.querySelector('.offline-notice'))return;const notice=document.createElement('div');notice.className='offline-notice';notice.setAttribute('role','status');notice.textContent='Você está sem conexão. Aguarde a conexão retornar antes de salvar alterações.';document.querySelector('.main-content').prepend(notice)});window.addEventListener('online',()=>document.querySelector('.offline-notice')?.remove())

document.addEventListener('keydown',event=>{if(!document.querySelector('#sidebar.open')||window.innerWidth>820)return;if(event.key==='Escape'){event.preventDefault();closeMenu();$('#menu-toggle').focus()}else if(event.key==='Tab'){const controls=$$('#sidebar a[href],#sidebar button:not([disabled])').filter(el=>el.getClientRects().length),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}})
