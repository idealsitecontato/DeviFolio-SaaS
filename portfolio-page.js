import { supabase } from './src/lib/supabase.js'
import {
  loadPublicPortfolio,
  portfolioBannerUrl,
  trackPublicEvent,
  submitPortfolioLead,
} from './src/lib/user-data.js'
import { mountGooeySpinners } from './src/ui/visual-components.js'
import { normalizeAppearance, appearanceStyle } from './src/lib/portfolio-appearance.js'
import { portfolioShowcase } from './src/ui/portfolio-showcase.js'
import { projectCoverAlt, projectCoverUrl } from './src/ui/project-cover.js'
import { bindPortfolioContactForm, portfolioContactMarkup } from './src/ui/portfolio-contact.js'
import './src/lib/build-version.js'

const root = document.getElementById('portfolio-root')
mountGooeySpinners()
const placeholderUrl = new URL('./assets/user-placeholder.png', import.meta.url).href
const esc = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
const username = new URLSearchParams(location.search).get('username') || decodeURIComponent(location.pathname.match(/^\/portfolio\/([^/]+)/)?.[1] || '')
const folderId = new URLSearchParams(location.search).get('folder')
const folderLabel = new URLSearchParams(location.search).get('name')?.slice(0, 60) || ''
const visitorView = new URLSearchParams(location.search).get('visitor') === '1'
const previewMode = new URLSearchParams(location.search).get('preview') === '1'
document.body.classList.toggle('visitor-view', visitorView)
const builtInFolders = ['principal', 'profissional', 'destaque', 'github']
const folderBucket = folderId && (/^folder-\d+$/.test(folderId)
  ? Number(folderId.slice(7)) + 2
  : builtInFolders.includes(folderId) ? builtInFolders.indexOf(folderId) + 2 : null)
let portfolio = null
let isOwner = false

function normalizeUrl(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch { return '' }
}

function visitorId() {
  try {
    const key = 'devifolio-public-visitor'
    let value = localStorage.getItem(key)
    if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value) }
    return value
  } catch { return '' }
}

function profileLink(label, value) {
  const url = normalizeUrl(value)
  return url ? `<a href="${esc(url)}" target="_blank" rel="noopener" data-profile-link>${label}</a>` : ''
}

function renderPage() {
  const { profile, projects } = portfolio
  const name = profile.name || profile.username
  const banner = portfolioBannerUrl(profile.userId)
  const appearance = normalizeAppearance(profile)
  const showcase = portfolioShowcase({ profile, projects, name, banner, placeholderUrl, appearance, publicPage:true })
  document.title = `${folderId ? folderLabel || 'Portfólio secundário' : name} — WebFolio`
  const description=profile.bio || `Projetos de ${name}. Portfólio criado com WebFolio.`
  document.querySelector('meta[name="description"]').content=description
  document.querySelector('meta[property="og:title"]').content=document.title
  document.querySelector('meta[property="og:description"]').content=description
  if(profile.avatar)document.querySelector('meta[property="og:image"]').content=profile.avatar
  const contact = portfolioContactMarkup()
  const footerLinks = [profileLink('GitHub', profile.github), profileLink('LinkedIn', profile.linkedin), profileLink('Meu site', profile.website)].filter(Boolean).join('')
  root.innerHTML = `<article class="public-portfolio-page customized-portfolio" style="${appearanceStyle(appearance)}">${showcase}${contact}${footerLinks ? `<nav class="public-portfolio-links profile-links" aria-label="Links profissionais">${footerLinks}</nav>` : ''}</article>`

  root.querySelectorAll('[data-project-link]').forEach(link => link.addEventListener('click', () => {
    if (!isOwner) trackPublicEvent(profile.userId, 'project_view', Number(link.dataset.projectLink), visitorId())
  }))
  root.querySelectorAll('[data-profile-link]').forEach(link => link.addEventListener('click', () => {
    if (!isOwner) trackPublicEvent(profile.userId, 'link_click', null, visitorId())
  }))
  root.querySelectorAll('[data-view-project]').forEach(button => button.addEventListener('click', () => showProjectDetails(Number(button.dataset.viewProject))))
  bindPortfolioContactForm(root.querySelector('#portfolio-contact-form'), data => submitPortfolioLead(profile.userId, data))
}

function openDialog(title, content) {
  const dialog = document.createElement('dialog')
  dialog.className = 'portfolio-dialog'
  dialog.innerHTML = `<div class="portfolio-dialog-head"><h2>${esc(title)}</h2><button type="button" data-close-dialog aria-label="Fechar">×</button></div>${content}<p class="portfolio-dialog-error" role="alert" hidden></p>`
  document.body.append(dialog)
  dialog.querySelector('[data-close-dialog]').onclick = () => dialog.close()
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  dialog.showModal()
  return dialog
}

function showProjectDetails(id) {
  const project = portfolio.projects.find(item => item.id === id)
  if (!project) return
  if (!isOwner) trackPublicEvent(portfolio.profile.userId, 'project_view', id, visitorId())
  const projectUrl = normalizeUrl(project.link)
  const githubUrl = normalizeUrl(project.github && project.github.includes('/') && !project.github.includes('.') ? `github.com/${project.github}` : project.github)
  openDialog(project.name, `<div class="portfolio-project-detail"><img src="${esc(projectCoverUrl(project))}" alt="${esc(projectCoverAlt(project))}"${project.image ? '' : ' class="default-project-cover"'}><p>${esc(project.description || 'Sem descrição adicional.')}</p>${project.tech ? `<small>${esc(project.tech)}</small>` : ''}<div class="portfolio-dialog-actions">${projectUrl ? `<a class="public-button" href="${esc(projectUrl)}" target="_blank" rel="noopener">Acessar</a>` : ''}${githubUrl ? `<a class="public-button secondary" href="${esc(githubUrl)}" target="_blank" rel="noopener">GitHub</a>` : ''}</div></div>`)
}

async function start() {
  try {
    if (previewMode) {
      const { data: identity } = await supabase.auth.getUser()
      const ownerId = identity.user?.id
      const saved = ownerId ? sessionStorage.getItem(`foliodev_preview_${ownerId}`) : null
      if (!saved) throw new Error('Prévia indisponível. Abra novamente pelo painel.')
      const snapshot = JSON.parse(saved)
      if (snapshot.profile?.userId !== ownerId || !Array.isArray(snapshot.projects)) throw new Error('Prévia inválida. Abra novamente pelo painel.')
      portfolio = snapshot
      isOwner = true
      renderPage()
      return
    }
    const [data, identity] = await Promise.all([loadPublicPortfolio(username), supabase.auth.getUser().catch(() => ({ data: { user: null } }))])
    if (!data) {
      root.innerHTML = '<section class="public-state"><h1>Portfólio indisponível</h1><p>Este portfólio não existe ou ainda não foi publicado.</p><a class="public-button" href="/">Voltar ao WebFolio</a></section>'
      return
    }
    portfolio = folderId ? { ...data, projects: data.projects.filter(project => folderBucket !== null && Math.floor(project.sortOrder / 100000) === folderBucket) } : data
    isOwner = identity.data?.user?.id === data.profile.userId
    renderPage()
    if (!isOwner) trackPublicEvent(data.profile.userId, 'portfolio_view', null, visitorId())
  } catch (error) {
    console.error('[Devifolio] Falha ao carregar portfólio público', error)
    root.innerHTML = `<section class="public-state"><h1>Não foi possível carregar</h1><p>Confira sua conexão e tente novamente. Se persistir, entre em contato com o suporte.</p><button class="public-button" onclick="location.reload()">Tentar novamente</button></section>`
  }
}

start()
if (visitorView) document.addEventListener('keydown', event => { if (event.key === 'Escape') location.assign('/dashboard.html#portfolio') })
