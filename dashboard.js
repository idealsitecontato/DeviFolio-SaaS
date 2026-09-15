import { supabase } from './src/lib/supabase.js'
import {
  deleteCurrentAccount,
  loadPublicPortfolio,
  loadWorkspace,
  removeProject,
  removeProjectImage,
  saveProfile,
  saveProject,
  saveSettings,
  uploadAvatar,
  uploadProjectImage,
} from './src/lib/user-data.js'
import QRCode from 'qrcode'

const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
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
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/><path d="M2 20h22"/>',
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
    const paths = icons[element.dataset.icon]
    if (paths) element.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
  })
}

const blankProfile = { name: '', username: '', email: '', role: '', bio: '', skills: '', linkedin: '', github: '', website: '', avatar: '' }
const blankSettings = { email: true, product: true, publicProfile: true, compact: false, theme: 'light' }
const state = { projects: [], profile: { ...blankProfile }, published: false, githubConnected: false, githubUsername: '', repos: [], analytics: [], referrals: [], settings: { ...blankSettings } }
const statusLabel = { published: 'Publicado', progress: 'Em breve', draft: 'Em desenvolvimento' }
let currentUser = null
let reposLoading = false
let reposLoaded = false
let homeQrGenerated = true
const onboardingRequested = new URLSearchParams(location.search).get('onboarding') === '1'
const authLoadingRequested = new URLSearchParams(location.search).get('auth_loading') === '1'

const realName = () => state.profile.name.trim() || currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Você'
const initials = () => realName().split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase()
const profileComplete = () => Boolean(state.profile.name.trim() && state.profile.username.trim())
const publicPortfolioUrl = () => {
  const username = encodeURIComponent(state.profile.username.trim().toLowerCase())
  return /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? `${location.origin}/portfolio.html?username=${username}` : `${location.origin}/portfolio/${username}`
}
const normalizeExternalUrl = value => {
  const text = String(value || '').trim()
  if (!text) return ''
  return /^https?:\/\//i.test(text) ? text : `https://${text}`
}

function pageHead(title, description, action = '') {
  return `<header class="page-head"><div><p class="eyebrow">Painel Devifolio</p><h1>${title}</h1><p>${description}</p></div>${action}</header>`
}

function emptyState(icon, title, description, action = '') {
  return `<div class="empty-state-content"><span class="circle-icon" data-icon="${icon}"></span><h3>${title}</h3><p>${description}</p>${action}</div>`
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
    await QRCode.toCanvas(canvas, publicPortfolioUrl(), { width: 150, margin: 1, color: { dark: '#090b0f', light: '#ffffff' }, errorCorrectionLevel: 'M' })
  } catch (error) {
    console.error('[Devifolio] Falha ao gerar QR Code', error)
    toast('Não foi possível gerar o QR Code.', 'error')
  }
}

function projectRows(items = state.projects.slice(0, 5)) {
  if (!items.length) return `<div class="projects-empty">${emptyState('folder', 'Você ainda não possui projetos.', 'Crie seu primeiro projeto para começar.', '<button class="primary-button" data-new-project>Criar primeiro projeto</button>')}</div>`
  return items.map((project, index) => `<div class="project-row"><span class="project-number">${String(index + 1).padStart(2, '0')}</span><span>${esc(project.name)}</span><span class="project-desc">${esc(project.description)}</span><span class="status ${project.status}">${statusLabel[project.status]}</span><button class="icon-button" data-view-project="${project.id}" aria-label="Visualizar ${esc(project.name)}"><span data-icon="chevron"></span></button></div>`).join('')
}

function homeView() {
  const summary = analyticsSummary()
  const publishedProjects = state.projects.filter(project => project.status === 'published').length
  const linkReady = Boolean(state.profile.username.trim())
  const qrReady = linkReady && homeQrGenerated
  const heroTitle = linkReady ? 'Seu portfólio está pronto para ser<br>compartilhado.' : 'Seu espaço está sendo preparado.'
  const heroCopy = linkReady ? 'Acompanhe seus dados reais e mantenha seus projetos atualizados.' : 'Conclua seu perfil para compartilhar seu portfólio.'
  const qrContent = '<h3>QR Code do seu<br>portfólio</h3><div class="qr-wrap"><canvas id="portfolio-qr" width="150" height="150" aria-label="QR Code do portfólio público"></canvas></div><p class="generation-message">Seu QR Code já está disponível. Aponte a câmera e veja seus projetos.</p>'
  const linkContent = `<div class="portfolio-card-head"><span data-icon="link"></span><div><h3>Seu portfólio</h3><p>Seu link exclusivo já foi criado. Copie e envie para seus clientes.</p></div></div><div class="url-field"><span>${esc(publicPortfolioUrl())}</span><button class="icon-button" data-copy="${esc(publicPortfolioUrl())}" aria-label="Copiar link do portfólio"><span data-icon="copy"></span></button><button class="icon-button" data-share-portfolio aria-label="Compartilhar portfólio"><span data-icon="users"></span></button><button class="icon-button" data-open-preview aria-label="Abrir portfólio"><span data-icon="external"></span></button></div>`
  return `<section class="page-enter home-page"><div class="home-hero"><p class="eyebrow">Olá, ${esc(realName())}</p><h1>${heroTitle}</h1><p>${heroCopy}</p><button class="primary-button" data-route-button="${profileComplete() ? 'projetos' : 'portfolio'}"><span data-icon="${profileComplete() ? 'plus' : 'edit'}"></span>${profileComplete() ? 'Adicionar projeto' : 'Configurar portfólio'}</button></div><div class="dashboard-grid"><article class="card metric-card"><div class="metric-head"><span data-icon="eye"></span>Visualizações do portfólio</div><strong>${summary.views}</strong><small>dados reais acumulados</small></article><article class="card metric-card"><div class="metric-head"><span data-icon="folder"></span>Projetos publicados</div><strong>${publishedProjects}</strong><small>no seu portfólio</small></article><article class="card plan-card"><div class="metric-head"><span data-icon="crown"></span>Planos</div><button class="plan-link" type="button" data-route-button="planos">Ver planos <span data-icon="arrow"></span></button></article><article class="card qr-card ${qrReady ? '' : 'generator-card'}">${qrContent}</article><article class="card portfolio-card ${linkReady ? '' : 'generator-card'}">${linkContent}</article></div><section class="card projects-card"><div class="section-card-head"><h2>Últimos projetos</h2>${state.projects.length ? '<button class="link-button" data-route-button="projetos">Ver todos <span data-icon="arrow"></span></button>' : ''}</div>${projectRows()}</section></section>`
}

function projectCards(items) {
  if (!items.length) return `<div class="card empty-state">${emptyState('folder', 'Você ainda não possui projetos.', 'Crie seu primeiro projeto para começar.', '<button class="primary-button" data-new-project>Novo projeto</button>')}</div>`
  return items.map(project => `<article class="card project-card"><div class="project-cover">${project.image ? `<img class="project-cover-image" src="${esc(project.image)}" alt="Capa do projeto ${esc(project.name)}">` : `<span>${esc(project.name.slice(0, 2).toUpperCase())}</span>`}<span class="status ${project.status}">${statusLabel[project.status]}</span></div><div class="project-card-body"><div class="project-card-title"><h2>${esc(project.name)}</h2></div>${project.description ? `<p>${esc(project.description)}</p>` : ''}<div class="tag-row">${project.tech.split(',').filter(Boolean).map(item => `<span>${esc(item.trim())}</span>`).join('')}</div><div class="project-actions"><button class="secondary-button" data-view-project="${project.id}"><span data-icon="eye"></span>Visualizar</button><button class="icon-button" data-edit-project="${project.id}" aria-label="Editar"><span data-icon="edit"></span></button><button class="icon-button danger-ghost" data-delete-project="${project.id}" aria-label="Excluir"><span data-icon="trash"></span></button></div></div></article>`).join('')
}

function projectsView() {
  return `<section class="page-enter">${pageHead('Projetos', 'Organize e publique os trabalhos que contam a sua história.', '<button class="primary-button" data-new-project><span data-icon="plus"></span>Novo projeto</button>')}<div class="toolbar"><label class="search-field"><span data-icon="search"></span><input id="project-search" type="search" placeholder="Buscar projetos" aria-label="Buscar projetos"></label><select id="status-filter" aria-label="Filtrar por status"><option value="all">Todos os status</option><option value="published">Publicado</option><option value="progress">Em breve</option><option value="draft">Em desenvolvimento</option></select><select id="project-sort" aria-label="Ordenar projetos"><option value="recent">Mais recentes</option><option value="name">Nome: A–Z</option><option value="status">Status</option></select></div><div class="project-grid" id="project-grid">${projectCards(state.projects)}</div></section>`
}

function previewMarkup() {
  const profile = state.profile
  const publishedProjects = state.projects.filter(project => project.status === 'published')
  return `<div class="public-preview">${profile.avatar ? `<div class="preview-avatar"><img src="${esc(profile.avatar)}" alt="Foto de ${esc(profile.name)}"></div>` : '<div class="preview-avatar preview-avatar-empty"><span data-icon="user"></span></div>'}${profile.name ? `<p class="preview-kicker">PORTFÓLIO</p><h2 data-preview="name">${esc(profile.name)}</h2>` : '<p class="preview-empty-copy">Adicione seu nome para visualizar a prévia.</p>'}${profile.role ? `<h3 data-preview="role">${esc(profile.role)}</h3>` : ''}${profile.bio ? `<p data-preview="bio">${esc(profile.bio)}</p>` : ''}<div class="preview-skills" data-preview="skills">${profile.skills.split(',').filter(Boolean).map(item => `<span>${esc(item.trim())}</span>`).join('')}</div>${publishedProjects.length ? `<div class="preview-project-list">${publishedProjects.slice(0, 3).map(project => `<span>${esc(project.name)}</span>`).join('')}</div>` : '<div class="preview-empty-copy">Nenhum projeto publicado.</div>'}</div>`
}

function portfolioManagerView() {
  const title = state.profile.name ? `Portfólio — ${state.profile.name}` : 'Meu portfólio'
  return `<section class="page-enter">${pageHead('Meus portfólios', 'Gerencie a versão pública associada à sua conta.', '<button class="primary-button" data-new-portfolio><span data-icon="plus"></span>Adicionar novo portfólio</button>')}<div class="portfolio-list"><article class="card portfolio-list-item"><div><p class="eyebrow">PORTFÓLIO PRINCIPAL</p><h2>${esc(title)}</h2><p>${state.published ? 'Seu portfólio está disponível para visitantes.' : 'Finalize o conteúdo e faça o deploy quando estiver pronto.'}</p></div><span class="status ${state.published ? 'published' : 'draft'}">${state.published ? 'Publicado' : 'Rascunho'}</span><div class="portfolio-list-actions"><button class="secondary-button" data-open-preview><span data-icon="eye"></span>Ver</button><button class="primary-button" data-edit-portfolio><span data-icon="edit"></span>Editar</button></div></article></div></section>`
}

function portfolioEditorView() {
  const profile = state.profile
  const ready = state.published && profileComplete()
  const publicationAction = state.published ? '<button class="secondary-button" type="button" data-toggle-publish>Despublicar</button>' : '<button class="primary-button" type="button" data-toggle-publish><span data-icon="upload"></span>Deploy</button>'
  return `<section class="page-enter">${pageHead('Editar portfólio', 'Edite a prévia que seus visitantes receberão.')}<div class="portfolio-actions"><span class="status ${state.published ? 'published' : 'draft'}">${state.published ? 'Publicado' : 'Não publicado'}</span><button class="secondary-button" type="button" data-open-preview><span data-icon="eye"></span>Visualizar como visitante</button>${publicationAction}</div><div class="editor-layout portfolio-editor"><form class="card form-card" id="portfolio-form"><div class="card-title"><span data-icon="edit"></span><div><h2>Editar conteúdo</h2><p>Altere os campos e acompanhe a prévia ao lado.</p></div></div><div class="form-grid"><label class="field"><span>Nome <i data-icon="edit"></i></span><input name="name" required value="${esc(profile.name)}"></label><label class="field"><span>Título profissional <i data-icon="edit"></i></span><input name="role" value="${esc(profile.role)}"></label><label class="field full"><span>Sobre você <i data-icon="edit"></i></span><textarea name="bio" maxlength="240">${esc(profile.bio)}</textarea><small>Até 240 caracteres</small></label><label class="field full"><span>Habilidades <i data-icon="edit"></i></span><input name="skills" value="${esc(profile.skills)}"><small>Separe as habilidades por vírgulas</small></label><label class="field"><span>GitHub <i data-icon="edit"></i></span><input name="github" value="${esc(profile.github)}" placeholder="github.com/usuario"></label><label class="field"><span>LinkedIn <i data-icon="edit"></i></span><input name="linkedin" value="${esc(profile.linkedin)}" placeholder="linkedin.com/in/usuario"></label><label class="field full"><span>Site pessoal <i data-icon="edit"></i></span><input name="website" value="${esc(profile.website)}" placeholder="https://"></label></div><div class="form-footer"><button class="primary-button" type="submit"><span data-icon="save"></span>Salvar alterações</button></div></form><aside class="card preview-card"><div class="preview-toolbar"><span>Prévia do visitante</span>${ready ? '<button class="icon-button" type="button" data-open-preview aria-label="Abrir prévia"><span data-icon="external"></span></button>' : ''}</div>${previewMarkup()}${ready ? `<div class="url-field"><span>${esc(publicPortfolioUrl())}</span><button class="icon-button" data-copy="${esc(publicPortfolioUrl())}" aria-label="Copiar URL"><span data-icon="copy"></span></button></div>` : '<div class="preview-link-empty">Use Deploy quando seu conteúdo estiver pronto.</div>'}</aside></div></section>`
}

function githubView() {
  if (!state.githubConnected) return `<section class="page-enter github-page">${pageHead('GitHub', 'Conecte sua conta para importar repositórios como projetos.')}<div class="card connect-card"><span class="connect-icon" data-icon="github"></span><h2>Traga seus projetos do GitHub</h2><p>Importe nome, descrição, tecnologias e links sem preencher tudo manualmente.</p><button class="primary-button" data-connect-github><span data-icon="github"></span>Conectar com GitHub</button><small>Você poderá desconectar a conta quando quiser.</small></div></section>`
  const content = reposLoading ? '<div class="repo-loading"><span class="spinner"></span>Buscando seus repositórios...</div>' : state.repos.length ? `<div class="repo-list">${state.repos.map((repository, index) => `<label class="repo-row"><input type="checkbox" value="${index}"><span class="repo-icon" data-icon="repo"></span><span><b>${esc(repository.name)}</b><small>${esc(repository.description || 'Sem descrição')}</small></span><span class="language-dot"></span><small>${esc(repository.language || '—')}</small><a href="${esc(repository.html_url)}" target="_blank" rel="noopener" aria-label="Abrir repositório"><span data-icon="external"></span></a></label>`).join('')}</div>` : `<div class="projects-empty">${emptyState('repo', 'Nenhum repositório encontrado.', 'Sua conta não possui repositórios disponíveis.')}</div>`
  return `<section class="page-enter github-page">${pageHead('GitHub', 'Selecione os repositórios que deseja transformar em projetos.', '<button class="secondary-button" data-disconnect-github>Desconectar</button>')}<div class="card connected-account"><span class="avatar">GH</span><div><small>Conta conectada</small><h2>@${esc(state.githubUsername || 'GitHub')}</h2></div><button class="secondary-button" data-sync-repos><span data-icon="refresh"></span>Sincronizar</button></div><div class="card repo-panel"><div class="section-card-head"><div><h2>Seus repositórios</h2><p>${state.repos.length} encontrado${state.repos.length === 1 ? '' : 's'}</p></div>${state.repos.length ? '<button class="primary-button" data-import-selected><span data-icon="upload"></span>Importar selecionados</button>' : ''}</div>${content}</div></section>`
}

function analyticsView() {
  const summary = analyticsSummary()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEvents = state.analytics.filter(event => event.event_type === 'portfolio_view' && new Date(event.created_at) >= monthStart)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dailyViews = Array.from({ length: daysInMonth }, (_, index) => monthEvents.filter(event => new Date(event.created_at).getDate() === index + 1).length)
  const maxDailyViews = Math.max(1, ...dailyViews)
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now)
  const monthlyChart = `<article class="card monthly-chart"><div class="section-card-head"><div><h2>Visualizações — ${esc(monthLabel)}</h2><p>${monthEvents.length} visualização${monthEvents.length === 1 ? '' : 'ões'} neste mês</p></div></div><div class="month-bars" aria-label="Visualizações por dia">${dailyViews.map((count, index) => `<span title="Dia ${index + 1}: ${count} visualizações"><i style="height:${Math.max(3, Math.round((count / maxDailyViews) * 100))}%"></i><small>${index + 1}</small></span>`).join('')}</div></article>`
  const projectCounts = new Map()
  state.analytics.filter(event => event.project_id && (event.event_type === 'project_view' || event.event_type === 'link_click')).forEach(event => projectCounts.set(Number(event.project_id), (projectCounts.get(Number(event.project_id)) || 0) + 1))
  const ranking = state.projects.map(project => ({ project, count: projectCounts.get(project.id) || 0 })).filter(item => item.count).sort((a, b) => b.count - a.count)
  const max = ranking[0]?.count || 1
  const metrics = `<div class="analytics-metrics"><article class="card analytic-stat"><span data-icon="eye"></span><small>Visualizações</small><strong>${summary.views}</strong></article><article class="card analytic-stat"><span data-icon="link"></span><small>Cliques em links</small><strong>${summary.clicks}</strong></article><article class="card analytic-stat"><span data-icon="users"></span><small>Visitantes únicos</small><strong>${summary.visitors}</strong></article><article class="card analytic-stat"><span data-icon="trending"></span><small>Taxa de clique</small><strong>${summary.rate}%</strong></article></div>`
  const details = state.analytics.length ? `<div class="analytics-layout"><article class="card chart-card"><div class="section-card-head"><div><h2>Atividade real</h2><p>Eventos registrados no portfólio público.</p></div><span class="chart-total">${state.analytics.length} total</span></div><div class="event-summary"><div><span>Visualizações</span><strong>${summary.views}</strong></div><div><span>Interações</span><strong>${summary.clicks}</strong></div></div></article><article class="card ranking-card"><div class="section-card-head"><div><h2>Projetos mais acessados</h2><p>Cliques registrados</p></div></div>${ranking.length ? ranking.slice(0, 5).map((item, index) => `<div class="rank-row"><span>${index + 1}</span><div><b>${esc(item.project.name)}</b><small>${item.count} acesso${item.count === 1 ? '' : 's'}</small></div><div class="rank-bar"><i style="width:${Math.round((item.count / max) * 100)}%"></i></div></div>`).join('') : `<div class="compact-empty">Nenhum projeto recebeu acessos ainda.</div>`}</article></div>` : `<article class="card analytics-empty">${emptyState('chart', 'Ainda não há dados de análise.', 'As métricas aparecerão quando o portfólio publicado receber visitas.')}</article>`
  return `<section class="page-enter">${pageHead('Análise', 'Entenda como as pessoas encontram e exploram seu portfólio.', `<label class="portfolio-select"><span>Selecionar portfólio</span><select aria-label="Selecionar portfólio"><option>${esc(state.profile.name ? `Portfólio — ${state.profile.name}` : 'Portfólio principal')}</option></select></label>`)}${metrics}${monthlyChart}${details}</section>`
}

function avatarMarkup(className = 'avatar avatar-large') {
  return state.profile.avatar ? `<span class="${className}"><img src="${esc(state.profile.avatar)}" alt="Foto de ${esc(realName())}"></span>` : `<span class="${className}">${esc(initials())}</span>`
}

function profileView() {
  const profile = state.profile
  return `<section class="page-enter compact-panel-page"><form class="card form-card compact-panel" id="profile-form"><div class="profile-summary">${avatarMarkup()}<div><p class="eyebrow">Perfil</p><h1>${esc(realName())}</h1><p>${esc(profile.email)}</p></div><div><input id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><button class="secondary-button" type="button" data-upload-avatar>Alterar foto</button></div></div><div class="panel-section"><h2>Informações pessoais</h2><div class="form-grid"><label class="field"><span>Nome</span><input name="name" required value="${esc(profile.name)}"></label><label class="field"><span>Usuário</span><div class="input-prefix"><i>@</i><input name="username" required pattern="[a-zA-Z0-9._-]+" value="${esc(profile.username)}"></div></label><label class="field full"><span>E-mail</span><input type="email" name="email" required value="${esc(profile.email)}"></label></div></div><div class="form-footer"><button class="primary-button" type="submit"><span data-icon="save"></span>Salvar perfil</button></div></form></section>`
}

function switchRow(icon, title, description, key, on) {
  return `<div class="setting-row"><span class="circle-icon" data-icon="${icon}"></span><div><b>${title}</b><small>${description}</small></div><button class="switch ${on ? 'on' : ''}" type="button" data-setting="${key}" aria-pressed="${on}"><i></i></button></div>`
}

function settingsView() {
  return `<section class="page-enter compact-panel-page"><div class="card settings-card compact-panel"><div class="settings-card-head"><span data-icon="settings"></span><div><h1>Configurações</h1><p>Preferências, privacidade e integrações.</p></div></div><div class="settings-tabs"><span>Preferências</span><span>Privacidade</span><span>Integrações</span><span>Conta</span></div><div class="panel-section"><h2>Preferências</h2><div class="setting-row"><div><b>Tema do painel</b><small>Use uma visualização escura e consistente.</small></div><select data-theme-select><option value="dark" ${state.settings.theme === 'dark' ? 'selected' : ''}>Modo escuro</option><option value="light" ${state.settings.theme === 'light' ? 'selected' : ''}>Modo claro</option></select></div>${switchRow('menu', 'Modo compacto', 'Reduz o espaço entre os elementos.', 'compact', state.settings.compact)}${switchRow('mail', 'Resumo por e-mail', 'Receba um relatório semanal.', 'email', state.settings.email)}</div><div class="panel-section"><h2>Privacidade e integrações</h2>${switchRow('eye', 'Aparecer em buscas públicas', 'Permitir que o portfólio seja indexado.', 'publicProfile', state.settings.publicProfile)}<div class="setting-row"><div><b>GitHub</b><small>${state.githubConnected ? `Conectado como @${esc(state.githubUsername)}` : 'Nenhuma conta conectada'}</small></div><button class="secondary-button" data-route-button="github">Gerenciar</button></div></div><div class="panel-section"><h2>Conta</h2><div class="setting-row"><div><b>Exportar dados</b><small>Baixe uma cópia das informações da conta.</small></div><button class="secondary-button" data-export>Exportar</button></div><div class="setting-row"><div><b>Excluir conta</b><small>Essa ação não poderá ser desfeita.</small></div><button class="danger-button" data-delete-account>Excluir conta</button></div></div></div></section>`
}

function referralView() {
  const link = `${location.origin}/cadastro.html?ref=${encodeURIComponent(state.profile.username)}#cadastro`
  const active = state.referrals.filter(item => item.status === 'active').length
  return `<section class="page-enter">${pageHead('Indicação', 'Convide outros devs e acompanhe indicações reais.')}<div class="referral-hero card"><div><span class="badge">PROGRAMA DE INDICAÇÃO</span><h2>Compartilhe o Devifolio.</h2><p>Seu convite usa um link exclusivo vinculado à sua conta.</p><div class="url-field referral-link"><span>${esc(link)}</span><button class="icon-button" data-copy="${esc(link)}"><span data-icon="copy"></span></button></div><button class="primary-button" data-share-referral data-share-url="${esc(link)}"><span data-icon="users"></span>Compartilhar convite</button></div><div class="benefit-orbit"><span data-icon="users"></span><strong>${active}</strong><small>amigos ativos</small></div></div><div class="referral-stats"><article class="card"><small>Indicações registradas</small><strong>${state.referrals.length}</strong></article><article class="card"><small>Amigos ativos</small><strong>${active}</strong></article><article class="card"><small>Pendentes</small><strong>${state.referrals.length - active}</strong></article></div><article class="card history-card"><div class="section-card-head"><div><h2>Histórico de indicações</h2><p>Acompanhe o status dos seus convites.</p></div></div>${state.referrals.length ? state.referrals.map(item => `<div class="history-row"><span class="avatar avatar-small">${esc(item.referred_email.slice(0, 1).toUpperCase())}</span><div><b>${esc(item.referred_email)}</b><small>${new Date(item.created_at).toLocaleDateString('pt-BR')}</small></div><span class="status ${item.status === 'active' ? 'published' : 'progress'}">${item.status === 'active' ? 'Ativa' : 'Pendente'}</span></div>`).join('') : `<div class="projects-empty">${emptyState('users', 'Nenhuma indicação registrada.', 'Compartilhe seu link para começar.')}</div>`}</article></section>`
}

function plansView() {
  const plan = (name, price, description, benefits) => `<article class="card pricing-card"><h2>${name}</h2><strong>R$ ${price}<small>/mês</small></strong><p>${description}</p><ul>${benefits.map(item => `<li><span data-icon="check"></span>${item}</li>`).join('')}</ul><button class="secondary-button" type="button" disabled>Em breve</button></article>`
  return `<section class="page-enter">${pageHead('Planos', 'Escolha os recursos certos para sua presença profissional.')}<div class="plans-grid">${plan('Essencial', '19,90', 'Para apresentar seu trabalho com clareza.', ['1 portfólio', 'Personalização básica', 'Link público', 'Edição de perfil'])}${plan('Pro', '29,90', 'Para profissionais que precisam de mais alcance.', ['Até 3 portfólios', 'Domínio personalizado', 'Analytics', 'Integração com GitHub', 'Mais personalizações'])}${plan('Premium', '59,90', 'Para uma operação de portfólios completa.', ['Portfólios ilimitados', 'Domínio personalizado', 'Analytics avançado', 'Suporte prioritário', 'Recursos premium'])}</div></section>`
}

const views = { inicio: homeView, projetos: projectsView, portfolio: portfolioManagerView, 'portfolio-editar': portfolioEditorView, github: githubView, analise: analyticsView, perfil: profileView, planos: plansView, configuracoes: settingsView, indicacao: referralView }

function render() {
  const route = views[location.hash.slice(1)] ? location.hash.slice(1) : 'inicio'
  $('#page-content').innerHTML = views[route]()
  document.title = `${{ inicio: 'Início', projetos: 'Projetos', portfolio: 'Meus portfólios', 'portfolio-editar': 'Editar portfólio', github: 'GitHub', analise: 'Análise', perfil: 'Perfil', planos: 'Planos', configuracoes: 'Configurações', indicacao: 'Indicação' }[route]} — Devifolio`
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.route === route))
  hydrateIcons($('#page-content'))
  bindActions()
  if (route === 'inicio') renderPortfolioQR()
  if (route === 'github' && state.githubConnected && !reposLoaded && !reposLoading) fetchGithubRepos()
  updateUserChrome()
  closeMenu()
  closeUserMenu()
  window.scrollTo({ top: 0, behavior: 'instant' })
}

function updateUserChrome() {
  const user = $('#user-menu-toggle')
  if (user) user.innerHTML = `${avatarMarkup('avatar')}<span><b>${esc(realName())}</b><small>@${esc(state.profile.username || 'conta')}</small></span><span data-icon="chevron"></span>`
  const mobile = $('.mobile-topbar [data-route-button="perfil"]')
  if (mobile) mobile.innerHTML = state.profile.avatar ? `<img src="${esc(state.profile.avatar)}" alt="">` : esc(initials())
  hydrateIcons(user || document)
}

function bindActions() {
  $$('[data-route-button]').forEach(button => button.onclick = () => { location.hash = button.dataset.routeButton })
  $$('[data-copy]').forEach(button => button.onclick = () => copyText(button.dataset.copy))
  $$('[data-open-preview]').forEach(button => button.onclick = () => window.open(publicPortfolioUrl(), '_blank', 'noopener'))
  $$('[data-edit-portfolio]').forEach(button => button.onclick = () => { location.hash = 'portfolio-editar' })
  $$('[data-new-portfolio]').forEach(button => button.onclick = () => toast('A conta possui um portfólio principal. A criação de múltiplos portfólios será liberada quando o modelo de dados for expandido.', 'error'))
  $$('[data-share-portfolio]').forEach(button => button.onclick = sharePortfolio)
  $$('[data-new-project]').forEach(button => button.onclick = () => projectModal())
  bindProjectGrid()

  const search = $('#project-search'), filter = $('#status-filter'), sort = $('#project-sort')
  if (search && filter && sort) {
    const update = () => {
      const query = search.value.toLowerCase(), status = filter.value
      const items = state.projects.filter(project => `${project.name} ${project.description} ${project.tech}`.toLowerCase().includes(query) && (status === 'all' || project.status === status))
      if (sort.value === 'name') items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      if (sort.value === 'status') items.sort((a, b) => statusLabel[a.status].localeCompare(statusLabel[b.status], 'pt-BR'))
      $('#project-grid').innerHTML = projectCards(items)
      hydrateIcons($('#project-grid'))
      bindProjectGrid()
    }
    search.oninput = update; filter.onchange = update; sort.onchange = update
  }

  $('#portfolio-form')?.addEventListener('submit', savePortfolioForm)
  $('[data-toggle-publish]')?.addEventListener('click', togglePublished)
  $('#profile-form')?.addEventListener('submit', saveProfileForm)
  $('#password-form')?.addEventListener('submit', changePassword)
  $('[data-upload-avatar]')?.addEventListener('click', () => $('#avatar-file')?.click())
  $('#avatar-file')?.addEventListener('change', handleAvatarUpload)
  $('[data-connect-github]')?.addEventListener('click', connectGithub)
  $('[data-disconnect-github]')?.addEventListener('click', disconnectGithub)
  $('[data-sync-repos]')?.addEventListener('click', fetchGithubRepos)
  $('[data-import-selected]')?.addEventListener('click', importSelected)
  $$('[data-setting]').forEach(button => button.onclick = () => updateSetting(button.dataset.setting))
  $('[data-theme-select]')?.addEventListener('change', event => updateTheme(event.currentTarget.value))
  $('[data-export]')?.addEventListener('click', exportData)
  $('[data-delete-account]')?.addEventListener('click', confirmAccountDeletion)
  $('[data-share-referral]')?.addEventListener('click', shareReferral)
}

function bindProjectGrid() {
  $$('[data-view-project]').forEach(button => button.onclick = () => showProject(Number(button.dataset.viewProject)))
  $$('[data-edit-project]').forEach(button => button.onclick = () => projectModal(Number(button.dataset.editProject)))
  $$('[data-delete-project]').forEach(button => button.onclick = () => confirmDelete(Number(button.dataset.deleteProject)))
}

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

async function togglePublished(event) {
  if (!state.published && !profileComplete()) return toast('Adicione seu nome e username antes de publicar.', 'error')
  const button = event.currentTarget
  const publishing = !state.published
  setButtonLoading(button, true, publishing ? 'Fazendo deploy...' : 'Despublicando...')
  try {
    await runStatusProcess(publishing ? 'Publicando portfólio' : 'Despublicando portfólio', publishing ? ['Preparando projeto...', 'Validando informações...', 'Gerando build...', 'Preparando publicação...', 'Publicando portfólio...'] : ['Preparando despublicação...', 'Removendo versão pública...', 'Atualizando status...', 'Finalizando...'])
    await saveProfile(currentUser.id, state.profile, publishing)
    state.published = publishing
    toast(publishing ? 'Deploy realizado com sucesso.' : 'Portfólio despublicado.')
    render()
  } catch (error) { reportError('Não foi possível alterar a publicação.', error) } finally { setButtonLoading(button, false) }
}

async function saveProfileForm(event) {
  event.preventDefault()
  const form = event.currentTarget
  const button = form.querySelector('[type="submit"]')
  const changes = Object.fromEntries(new FormData(form))
  changes.username = changes.username.trim().toLowerCase()
  setButtonLoading(button, true, 'Salvando...')
  try {
    const authChanges = { data: { full_name: changes.name } }
    if (changes.email !== currentUser.email) authChanges.email = changes.email
    const { error } = await supabase.auth.updateUser(authChanges)
    if (error) throw error
    const next = { ...state.profile, ...changes }
    await saveProfile(currentUser.id, next, state.published)
    Object.assign(state.profile, next)
    currentUser.email = changes.email
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

function showProject(id) {
  const project = state.projects.find(item => item.id === id)
  if (!project) return
  const projectLink = normalizeExternalUrl(project.link)
  const githubLink = project.github ? normalizeExternalUrl(project.github.includes('/') && !project.github.includes('.') ? `github.com/${project.github}` : project.github) : ''
  modal(`<div class="project-detail"><div class="project-cover detail-cover">${project.image ? `<img class="project-cover-image" src="${esc(project.image)}" alt="">` : `<span>${esc(project.name.slice(0, 2).toUpperCase())}</span>`}</div><span class="status ${project.status}">${statusLabel[project.status]}</span><h2>${esc(project.name)}</h2>${project.description ? `<p>${esc(project.description)}</p>` : ''}<div class="tag-row">${project.tech.split(',').filter(Boolean).map(item => `<span>${esc(item.trim())}</span>`).join('')}</div><div class="modal-actions"><button class="secondary-button" data-close-modal>Fechar</button>${githubLink ? `<a class="secondary-button" href="${esc(githubLink)}" target="_blank" rel="noopener">GitHub</a>` : ''}${projectLink ? `<a class="primary-button" href="${esc(projectLink)}" target="_blank" rel="noopener">Ver projeto <span data-icon="external"></span></a>` : ''}<button class="primary-button" data-edit-project="${project.id}"><span data-icon="edit"></span>Editar</button></div></div>`)
  $('[data-edit-project]')?.addEventListener('click', () => projectModal(project.id))
}

function projectModal(id) {
  const project = state.projects.find(item => item.id === id) || { name: '', description: '', tech: '', link: '', github: '', image: '', status: 'draft' }
  modal(`<form id="project-form"><div class="modal-head"><div><p class="eyebrow">PROJETOS</p><h2>${id ? 'Editar projeto' : 'Novo projeto'}</h2></div><button class="icon-button" type="button" data-close-modal><span data-icon="x"></span></button></div><div class="form-grid"><label class="field full"><span>Nome do projeto</span><input name="name" required maxlength="60" value="${esc(project.name)}"></label><label class="field full"><span>Descrição</span><textarea name="description" maxlength="180">${esc(project.description)}</textarea></label><div class="field full"><span>Imagem de capa</span><div class="project-image-upload"><div class="project-image-preview" id="project-image-preview">${project.image ? `<img src="${esc(project.image)}" alt="Imagem atual do projeto">` : '<span data-icon="upload"></span>'}</div><div class="project-image-upload-copy"><input id="project-image-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><button class="secondary-button" type="button" id="project-image-button"><span data-icon="upload"></span>Carregar do computador</button><strong id="project-image-name">${project.image ? 'Imagem atual do projeto' : 'Nenhum arquivo selecionado'}</strong><small>JPG, PNG ou WEBP, até 5 MB. Vídeos e outros arquivos não são aceitos.</small></div></div></div><label class="field full"><span>Tecnologias</span><input name="tech" value="${esc(project.tech)}" placeholder="React, Node.js, PostgreSQL"></label><label class="field"><span>Link publicado</span><input type="url" name="link" value="${esc(project.link)}" placeholder="https://"></label><label class="field"><span>Repositório GitHub</span><input name="github" value="${esc(project.github)}" placeholder="usuario/repositorio"></label><label class="field full"><span>Status</span><select name="status"><option value="published" ${project.status === 'published' ? 'selected' : ''}>Publicado</option><option value="progress" ${project.status === 'progress' ? 'selected' : ''}>Em breve</option><option value="draft" ${project.status === 'draft' ? 'selected' : ''}>Em desenvolvimento</option></select></label></div><div class="modal-actions"><button class="secondary-button" type="button" data-close-modal>Cancelar</button><button class="primary-button" type="submit">${id ? 'Salvar alterações' : 'Criar projeto'}</button></div></form>`)
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
    const next = { id: id || Date.now(), image: project.image || '', ...data }
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
      closeModal(); toast(id ? 'Projeto atualizado.' : 'Projeto criado com sucesso.'); render()
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
  setButtonLoading(button, true, 'Conectando...')
  try {
    const data = await authenticatedApi('/api/github/connect', { method: 'POST' })
    location.assign(data.authorizationUrl)
  } catch (error) { reportError('Não foi possível conectar o GitHub.', error); setButtonLoading(button, false) }
}

async function disconnectGithub() {
  try {
    await authenticatedApi('/api/github/connection', { method: 'DELETE' })
    state.githubConnected = false; state.githubUsername = ''; state.repos = []; reposLoaded = false
    toast('Conta do GitHub desconectada.'); render()
  } catch (error) { reportError('Não foi possível desconectar o GitHub.', error) }
}

async function fetchGithubRepos() {
  reposLoading = true; render()
  try {
    const data = await authenticatedApi('/api/github/repos')
    state.repos = data.repositories || []
  } catch (error) { reportError('Não foi possível carregar os repositórios.', error) } finally { reposLoading = false; reposLoaded = true; render() }
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

function showGithubCallbackResult() {
  const params = new URLSearchParams(location.search)
  const status = params.get('github')
  if (!status) return
  if (status === 'connected') toast('Conta do GitHub conectada com sucesso.')
  else if (status === 'access_denied') toast('A autorização do GitHub foi cancelada.', 'error')
  else if (status === 'invalid_state') toast('A autorização expirou. Tente conectar novamente.', 'error')
  else toast('O GitHub não concluiu a autorização. Tente novamente.', 'error')
  history.replaceState(null, '', `${location.pathname}${location.hash || '#github'}`)
}

async function importSelected(event) {
  const selected = $$('.repo-row input:checked').map(input => state.repos[Number(input.value)]).filter(Boolean)
  if (!selected.length) return toast('Selecione ao menos um repositório.', 'error')
  const button = event.currentTarget
  setButtonLoading(button, true, 'Importando...')
  try {
    for (const repository of selected) {
      if (state.projects.some(project => project.github === repository.full_name)) continue
      const project = { id: Date.now() + state.projects.length, name: repository.name, description: repository.description || '', tech: repository.language || '', link: repository.homepage || '', github: repository.full_name, image: '', status: 'draft' }
      const saved = await saveProject(currentUser.id, project, 0)
      state.projects.unshift(saved)
    }
    toast(`${selected.length} repositório${selected.length === 1 ? '' : 's'} importado${selected.length === 1 ? '' : 's'}.`); render()
  } catch (error) { reportError('Não foi possível importar os projetos.', error); setButtonLoading(button, false) }
}

async function updateSetting(key) {
  const next = { ...state.settings, [key]: !state.settings[key] }
  try { await saveSettings(currentUser.id, next); Object.assign(state.settings, next); render() } catch (error) { reportError('Não foi possível salvar a configuração.', error) }
}

async function updateTheme(theme) {
  const next = { ...state.settings, theme }
  try { await saveSettings(currentUser.id, next); Object.assign(state.settings, next); document.documentElement.dataset.theme = theme; render() } catch (error) { reportError('Não foi possível alterar o tema.', error) }
}

function exportData() {
  const payload = JSON.stringify({ profile: state.profile, published: state.published, projects: state.projects, settings: state.settings, analytics: state.analytics, referrals: state.referrals }, null, 2)
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

async function shareReferral(event) {
  const url = event.currentTarget.dataset.shareUrl
  try {
    if (navigator.share) await navigator.share({ title: 'Devifolio', text: 'Crie seu portfólio profissional.', url })
    else await copyText(url)
  } catch (error) { if (error.name !== 'AbortError') reportError('Não foi possível compartilhar.', error) }
}

async function sharePortfolio() {
  const url = publicPortfolioUrl()
  try {
    if (navigator.share) await navigator.share({ title: `Portfólio de ${realName()}`, url })
    else await copyText(url)
  } catch (error) { if (error.name !== 'AbortError') reportError('Não foi possível compartilhar.', error) }
}

async function ensurePublicPortfolio(button, loadingLabel) {
  if (!profileComplete()) {
    toast('Complete seu nome e username antes de gerar o portfólio.', 'error')
    location.hash = 'perfil'
    return false
  }
  setButtonLoading(button, true, loadingLabel)
  try {
    if (!state.published) {
      await saveProfile(currentUser.id, state.profile, true)
      state.published = true
    }
    const publicData = await loadPublicPortfolio(state.profile.username)
    if (!publicData || publicData.profile.userId !== currentUser.id) throw new Error('O portfólio público ainda não pôde ser confirmado.')
    return true
  } catch (error) {
    reportError('Não foi possível publicar o portfólio.', error)
    return false
  } finally {
    setButtonLoading(button, false)
  }
}

async function generatePortfolioLink(event) {
  if (!await ensurePublicPortfolio(event.currentTarget, 'Gerando link...')) return
  toast('Link público gerado com sucesso.')
  render()
}

async function generatePortfolioQr(event) {
  if (!await ensurePublicPortfolio(event.currentTarget, 'Gerando QR Code...')) return
  homeQrGenerated = true
  render()
  toast('QR Code gerado com sucesso.')
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Link copiado.') } catch (error) { reportError('Não foi possível copiar o link.', error) }
}

async function runStatusProcess(title, steps) {
  modal(`<div class="process-panel"><p class="eyebrow">Devifolio</p><h2>${esc(title)}</h2><p>Estamos atualizando seu portfólio.</p><ol>${steps.map((step, index) => `<li data-process-step="${index}"><span class="process-indicator"></span>${esc(step)}</li>`).join('')}</ol></div>`)
  for (const step of $$('[data-process-step]')) {
    step.classList.add('is-active')
    await wait(1050)
    step.classList.remove('is-active')
    step.classList.add('is-complete')
  }
  closeModal()
}

function modal(content) {
  $('#modal-root').innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true">${content}</div></div>`
  hydrateIcons($('#modal-root'))
  $$('[data-close-modal]').forEach(button => button.onclick = closeModal)
  $('.modal-backdrop').onclick = event => { if (event.target === event.currentTarget) closeModal() }
}

function closeModal() { $('#modal-root').innerHTML = '' }
function setButtonLoading(button, loading, label = '') { if (!button) return; if (loading) { button.dataset.original = button.innerHTML; button.disabled = true; button.textContent = label } else { button.disabled = false; if (button.dataset.original) button.innerHTML = button.dataset.original; hydrateIcons(button) } }
function reportError(message, error) { console.error(`[Devifolio] ${message}`, error); toast(error?.message ? `${message} ${error.message}` : message, 'error') }
function toast(message, type = 'success') { const element = document.createElement('div'); element.className = `toast ${type}`; element.innerHTML = `<span data-icon="${type === 'error' ? 'x' : 'check'}"></span>${esc(message)}`; $('#toast-stack').append(element); hydrateIcons(element); setTimeout(() => element.remove(), 4200) }
function closeUserMenu() { $('#user-menu')?.setAttribute('hidden', ''); $('#user-menu-toggle')?.setAttribute('aria-expanded', 'false') }
function closeMenu() { $('#sidebar')?.classList.remove('open'); $('#sidebar-overlay')?.classList.remove('show'); $('#menu-toggle')?.setAttribute('aria-expanded', 'false') }
function setSidebarCollapsed(collapsed) {
  $('.app-shell')?.classList.toggle('sidebar-collapsed', collapsed)
  $('#sidebar-toggle')?.setAttribute('aria-expanded', String(!collapsed))
  $('#sidebar-toggle')?.setAttribute('aria-label', collapsed ? 'Expandir menu' : 'Recolher menu')
  try { localStorage.setItem('devifolio_sidebar_collapsed', String(collapsed)) } catch { /* armazenamento indisponível */ }
}

$('#menu-toggle').onclick = () => { const open = $('#sidebar').classList.toggle('open'); $('#sidebar-overlay').classList.toggle('show', open); $('#menu-toggle').setAttribute('aria-expanded', String(open)) }
$('#sidebar-overlay').onclick = closeMenu
$('#sidebar-toggle').onclick = () => setSidebarCollapsed(!$('.app-shell')?.classList.contains('sidebar-collapsed'))
$('#user-menu-toggle').onclick = event => { event.stopPropagation(); const menu = $('#user-menu'), open = menu.hasAttribute('hidden'); menu.toggleAttribute('hidden', !open); $('#user-menu-toggle').setAttribute('aria-expanded', String(open)) }
document.addEventListener('click', event => { if (!event.target.closest('#user-menu') && !event.target.closest('#user-menu-toggle')) closeUserMenu() })
let routeLoadingTimer
function renderWithTransition() {
  clearTimeout(routeLoadingTimer)
  $('#page-content').innerHTML = '<section class="route-loader" aria-live="polite"><span></span><p>Carregando<i>.</i><i>.</i><i>.</i></p></section>'
  routeLoadingTimer = window.setTimeout(render, 650)
}
window.addEventListener('hashchange', renderWithTransition)

function onboardingView() {
  return `<section class="onboarding-screen" aria-live="polite"><div class="onboarding-panel"><p class="eyebrow">Devifolio</p><h1>Estamos preparando seu portfólio.</h1><p>Isso leva só alguns instantes.</p><ol>${['Gerando seu link', 'Gerando seu QR Code', 'Organizando o seu perfil', 'Finalizando seu portfólio'].map((label, index) => `<li data-onboarding-step="${index}"><span class="onboarding-status"></span><span>${label}</span></li>`).join('')}</ol></div></section>`
}

function startupLoadingView() {
  return '<section class="startup-loader" aria-live="polite"><span class="spinner" aria-hidden="true"></span><p>Entrando no seu painel...</p></section>'
}

const wait = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds))
async function runOnboarding() {
  $('#page-content').innerHTML = onboardingView()
  for (const step of $$('[data-onboarding-step]')) {
    step.classList.add('is-active')
    await wait(7000)
    step.classList.remove('is-active')
    step.classList.add('is-complete')
  }
  history.replaceState(null, '', `${location.pathname}${location.hash || '#inicio'}`)
  render()
  showGithubCallbackResult()
}

async function bootstrap() {
  if (authLoadingRequested) $('#page-content').innerHTML = startupLoadingView()
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) { location.replace('cadastro.html#login'); return }
  currentUser = data.session.user
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
        await saveProfile(currentUser.id, state.profile, state.published)
      }
    } else {
      Object.assign(state.profile, { ...blankProfile, ...accountDefaults })
      await saveProfile(currentUser.id, state.profile, false)
    }
    if (!workspace.settings) await saveSettings(currentUser.id, state.settings)
    state.projects = workspace.projects || []
    state.analytics = workspace.analytics || []
    state.referrals = workspace.referrals || []
    state.githubConnected = Boolean(workspace.githubConnection)
    state.githubUsername = workspace.githubConnection?.github_username || ''
    if (workspace.settings) Object.assign(state.settings, { email: workspace.settings.email_notifications, product: workspace.settings.product_notifications, publicProfile: workspace.settings.public_profile, compact: workspace.settings.compact_mode, theme: workspace.settings.theme })
  } catch (loadError) {
    console.error('[Devifolio] Falha ao carregar dados reais', loadError)
    $('#page-content').innerHTML = `<section class="page-enter"><article class="card fatal-state">${emptyState('x', 'Não foi possível carregar seus dados.', 'A estrutura do banco precisa ser atualizada antes de usar o painel.')}</article></section>`
    hydrateIcons($('#page-content'))
    toast(loadError.message, 'error')
    return
  }
  document.documentElement.dataset.theme = state.settings.theme === 'dark' ? 'dark' : 'light'
  hydrateIcons()
  setSidebarCollapsed(localStorage.getItem('devifolio_sidebar_collapsed') === 'true')
  if (authLoadingRequested) history.replaceState(null, '', `${location.pathname}${onboardingRequested ? '?onboarding=1' : ''}${location.hash || '#inicio'}`)
  if (onboardingRequested) return runOnboarding()
  render(); showGithubCallbackResult()
}

supabase.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) location.replace('cadastro.html#login') })
$$('[data-logout]').forEach(link => link.addEventListener('click', async event => { event.preventDefault(); await supabase.auth.signOut(); location.replace('cadastro.html#login') }))

bootstrap()
