import { supabase } from './src/lib/supabase.js'
import {
  loadPublicPortfolio,
  portfolioBannerUrl,
  removePortfolioBanner,
  trackPublicEvent,
  submitPortfolioLead,
  updateProfileAvatar,
  uploadAvatar,
  uploadPortfolioBanner,
} from './src/lib/user-data.js'
import { mountGooeySpinners, UploadButton } from './src/ui/visual-components.js'
import { folioDevLogo } from './src/ui/brand.js'
import { normalizeAppearance, appearanceStyle } from './src/lib/portfolio-appearance.js'
import { portfolioShowcase } from './src/ui/portfolio-showcase.js'
import './src/lib/build-version.js'

const root = document.getElementById('portfolio-root')
mountGooeySpinners()
const brandUrl = folioDevLogo
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
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
let portfolio = null
let isOwner = false
let bannerRevision = ''

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
  const banner = `${portfolioBannerUrl(profile.userId)}${bannerRevision ? `?v=${bannerRevision}` : ''}`
  const appearance = normalizeAppearance(profile)
  const showcase = portfolioShowcase({ profile, projects, name, banner, placeholderUrl, appearance, publicPage:true, owner:isOwner })
  document.title = `${folderId ? folderLabel || 'Portfólio secundário' : name} — WebFolio`
  const description=profile.bio || `Projetos de ${name}. Portfólio criado com WebFolio.`
  document.querySelector('meta[name="description"]').content=description
  document.querySelector('meta[property="og:title"]').content=document.title
  document.querySelector('meta[property="og:description"]').content=description
  if(profile.avatar)document.querySelector('meta[property="og:image"]').content=profile.avatar
  const contact = isOwner ? '' : `<section class="public-contact" aria-labelledby="contact-title"><div><span>VAMOS CONVERSAR</span><h2 id="contact-title">Gostou do meu trabalho?</h2><p>Envie uma mensagem sobre seu projeto. Seu contato chega diretamente ao meu painel.</p></div><form id="portfolio-contact-form"><label>Nome<input name="name" maxlength="100" minlength="2" required autocomplete="name"></label><label>E-mail<input name="email" type="email" maxlength="254" required autocomplete="email"></label><label>Telefone<input name="phone" type="tel" maxlength="40" autocomplete="tel"></label><label>Mensagem<textarea name="message" maxlength="2000" rows="4" placeholder="Conte um pouco sobre o que você precisa"></textarea></label><label class="contact-honeypot" aria-hidden="true">Site<input name="website" tabindex="-1" autocomplete="off"></label><button class="public-button" type="submit">Enviar contato</button><p role="status" aria-live="polite"></p></form></section>`
  const footerLinks = [profileLink('GitHub', profile.github), profileLink('LinkedIn', profile.linkedin), profileLink('Meu site', profile.website)].filter(Boolean).join('')
  const returnLink = isOwner ? '/dashboard.html#inicio' : '/'
  root.innerHTML = `<article class="public-portfolio-page customized-portfolio" style="${appearanceStyle(appearance)}">${showcase}${contact}<footer class="public-footer"><a href="${returnLink}" aria-label="${isOwner ? 'Voltar ao início do painel' : 'Voltar ao WebFolio'}"><span class="folio-brand"><img src="${brandUrl}" alt="WebFolio" width="3189" height="573"></span></a>${footerLinks ? `<nav class="profile-links" aria-label="Links profissionais">${footerLinks}</nav>` : ''}<a href="/cadastro.html#cadastro" class="nav-action">Criar meu portfólio</a></footer></article>`

  root.querySelectorAll('[data-project-link]').forEach(link => link.addEventListener('click', () => {
    if (!isOwner) trackPublicEvent(profile.userId, 'project_view', Number(link.dataset.projectLink), visitorId())
  }))
  root.querySelectorAll('[data-profile-link]').forEach(link => link.addEventListener('click', () => {
    if (!isOwner) trackPublicEvent(profile.userId, 'link_click', null, visitorId())
  }))
  root.querySelectorAll('[data-view-project]').forEach(button => button.addEventListener('click', () => showProjectDetails(Number(button.dataset.viewProject))))
  root.querySelector('[data-edit-banner]')?.addEventListener('click', editBanner)
  root.querySelector('[data-edit-avatar]')?.addEventListener('click', editAvatar)
  root.querySelector('#portfolio-contact-form')?.addEventListener('submit', async event => {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form))
    if (data.website) return
    const button = form.querySelector('[type="submit"]')
    const message = form.querySelector('[role="status"]')
    button.disabled = true
    message.textContent = 'Enviando contato...'
    try {
      await submitPortfolioLead(profile.userId, data)
      form.reset()
      message.textContent = 'Contato enviado. Obrigado!'
    } catch (error) {
      console.error('[WebFolio] Falha ao enviar contato', error)
      message.textContent = 'Não foi possível enviar agora. Tente novamente.'
    } finally { button.disabled = false }
  })
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

function showDialogError(dialog, error) {
  console.error('[Devifolio] Falha ao editar portfólio', error)
  const message = dialog.querySelector('.portfolio-dialog-error')
  message.textContent = error?.message || 'Não foi possível salvar. Tente novamente.'
  message.hidden = false
}

function validateImage(file) {
  if (!file || !imageTypes.has(file.type)) throw new Error('Escolha uma imagem JPG, PNG ou WEBP.')
  if (file.size > 5 * 1024 * 1024) throw new Error('A imagem deve ter até 5 MB.')
}

function editBanner() {
  if (!isOwner) return
  const dialog = openDialog('Editar banner', `<form class="portfolio-edit-form"><label>Imagem do banner<input type="file" name="banner" accept="image/jpeg,image/png,image/webp" required><span class="nuda-browse">${UploadButton('Selecionar banner')}</span></label><div class="portfolio-dialog-actions"><button type="button" class="public-button secondary" data-remove-banner>Usar cinza</button><button type="submit" class="public-button">Salvar banner</button></div></form>`)
  dialog.querySelector('form').onsubmit = async event => {
    event.preventDefault()
    const button = dialog.querySelector('[type="submit"]')
    const file = dialog.querySelector('input').files[0]
    try {
      validateImage(file)
      button.disabled = true; button.classList.add("is-loading")
      await uploadPortfolioBanner(portfolio.profile.userId, file)
      bannerRevision = Date.now()
      dialog.close()
      renderPage()
    } catch (error) { showDialogError(dialog, error) } finally { button.disabled = false; button.classList.remove("is-loading") }
  }
  dialog.querySelector('[data-remove-banner]').onclick = async event => {
    const button = event.currentTarget
    try {
      button.disabled = true; button.classList.add("is-loading")
      await removePortfolioBanner(portfolio.profile.userId)
      bannerRevision = Date.now()
      dialog.close()
      renderPage()
    } catch (error) { showDialogError(dialog, error) } finally { button.disabled = false; button.classList.remove("is-loading") }
  }
}

function editAvatar() {
  if (!isOwner) return
  const dialog = openDialog('Editar foto de perfil', `<form class="portfolio-edit-form"><label>Nova foto<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" required><span class="nuda-browse">${UploadButton('Selecionar foto')}</span></label><div class="portfolio-dialog-actions"><button type="submit" class="public-button">Salvar foto</button></div></form>`)
  dialog.querySelector('form').onsubmit = async event => {
    event.preventDefault()
    const button = dialog.querySelector('[type="submit"]')
    const file = dialog.querySelector('input').files[0]
    try {
      validateImage(file)
      button.disabled = true; button.classList.add("is-loading")
      const url = await uploadAvatar(portfolio.profile.userId, file)
      await updateProfileAvatar(portfolio.profile.userId, url)
      portfolio.profile.avatar = url
      dialog.close()
      renderPage()
    } catch (error) { showDialogError(dialog, error) } finally { button.disabled = false; button.classList.remove("is-loading") }
  }
}

function showProjectDetails(id) {
  const project = portfolio.projects.find(item => item.id === id)
  if (!project) return
  if (!isOwner) trackPublicEvent(portfolio.profile.userId, 'project_view', id, visitorId())
  const projectUrl = normalizeUrl(project.link)
  const githubUrl = normalizeUrl(project.github && project.github.includes('/') && !project.github.includes('.') ? `github.com/${project.github}` : project.github)
  openDialog(project.name, `<div class="portfolio-project-detail">${project.image ? `<img src="${esc(project.image)}" alt="Capa de ${esc(project.name)}">` : ''}<p>${esc(project.description || 'Sem descrição adicional.')}</p>${project.tech ? `<small>${esc(project.tech)}</small>` : ''}<div class="portfolio-dialog-actions">${projectUrl ? `<a class="public-button" href="${esc(projectUrl)}" target="_blank" rel="noopener">Acessar</a>` : ''}${githubUrl ? `<a class="public-button secondary" href="${esc(githubUrl)}" target="_blank" rel="noopener">GitHub</a>` : ''}</div></div>`)
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
