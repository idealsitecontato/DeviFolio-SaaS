import { supabase } from './src/lib/supabase.js'
import {
  loadPublicPortfolio,
  portfolioBannerUrl,
  removePortfolioBanner,
  trackPublicEvent,
  updateProfileAvatar,
  updateProjectDetails,
  uploadAvatar,
  uploadPortfolioBanner,
  uploadProjectImage,
} from './src/lib/user-data.js'
import { getPortfolioModel } from './src/lib/portfolio-models.js'

const root = document.getElementById('portfolio-root')
const brandUrl = new URL('./assets/devifolio-mark.png', import.meta.url).href
const placeholderUrl = new URL('./assets/user-placeholder.png', import.meta.url).href
const esc = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
const username = new URLSearchParams(location.search).get('username') || decodeURIComponent(location.pathname.match(/^\/portfolio\/([^/]+)/)?.[1] || '')
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

function projectCard(project, ownerId) {
  const projectUrl = normalizeUrl(project.link)
  const editor = isOwner ? `<button class="portfolio-edit-button project-edit-button" type="button" data-edit-project="${project.id}" aria-label="Editar projeto ${esc(project.name)}">✎</button>` : ''
  return `<article class="public-project"><div class="project-image">${project.image ? `<img src="${esc(project.image)}" alt="Capa de ${esc(project.name)}">` : `<span>${esc(project.name.slice(0, 2).toUpperCase())}</span>`}${editor}</div><div class="project-content"><h3>${esc(project.name)}</h3><p>${esc(project.description || 'Conheça este projeto.')}</p><div class="project-actions">${projectUrl ? `<a class="public-button" href="${esc(projectUrl)}" target="_blank" rel="noopener" data-project-link="${project.id}" data-owner="${ownerId}">Acessar</a>` : `<button class="public-button" type="button" data-view-project="${project.id}">Acessar</button>`}<button class="public-button secondary" type="button" data-view-project="${project.id}">Ver</button></div></div></article>`
}

function renderPage() {
  const { profile, projects } = portfolio
  const model = getPortfolioModel(profile.selectedModel)
  const name = profile.name || profile.username
  const avatar = profile.avatar || placeholderUrl
  const banner = `${portfolioBannerUrl(profile.userId)}${bannerRevision ? `?v=${bannerRevision}` : ''}`
  document.title = `${name} — Devifolio`
  root.innerHTML = `<article class="portfolio-page" data-model="${model.id}" style="--model-image:url('${model.image}');--model-ink:${model.ink}"><header class="public-nav"><a href="/" class="public-brand" aria-label="Devifolio, início"><img src="${brandUrl}" alt="Devifolio"></a><a href="/cadastro.html#cadastro" class="nav-action">Criar meu portfólio</a></header><div class="portfolio-shell"><section class="public-hero"><img class="public-banner-image" src="${esc(banner)}" alt="" aria-hidden="true">${isOwner ? '<button class="portfolio-edit-button banner-edit-button" type="button" data-edit-banner aria-label="Editar banner">✎</button>' : ''}<div class="profile-header"><div class="public-avatar"><img src="${esc(avatar)}" alt="${profile.avatar ? `Foto de ${esc(name)}` : 'Ícone de usuário'}">${isOwner ? '<button class="portfolio-edit-button avatar-edit-button" type="button" data-edit-avatar aria-label="Editar foto de perfil">✎</button>' : ''}</div><div class="profile-copy"><h1>${esc(name)}</h1>${profile.role ? `<h2>${esc(profile.role)}</h2>` : ''}${profile.bio ? `<p class="bio">${esc(profile.bio)}</p>` : ''}<nav class="profile-links">${profileLink('GitHub', profile.github)}${profileLink('LinkedIn', profile.linkedin)}${profileLink('Meu site', profile.website)}</nav></div></div></section><section class="projects-section"><div class="section-heading"><h2>Meus projetos</h2><span>${projects.length} projeto${projects.length === 1 ? '' : 's'}</span></div>${projects.length ? `<div class="public-projects">${projects.map(project => projectCard(project, profile.userId)).join('')}</div>` : '<div class="empty-projects">Ainda não existem projetos publicados.</div>'}</section></div></article>`

  const bannerImage = root.querySelector('.public-banner-image')
  bannerImage.addEventListener('load', () => root.querySelector('.public-hero')?.classList.add('has-banner'))
  bannerImage.addEventListener('error', () => bannerImage.remove())
  if (bannerImage.complete && bannerImage.naturalWidth) root.querySelector('.public-hero')?.classList.add('has-banner')
  root.querySelector('.public-avatar > img').addEventListener('error', event => {
    if (event.currentTarget.src !== placeholderUrl) event.currentTarget.src = placeholderUrl
  })

  root.querySelectorAll('[data-project-link]').forEach(link => link.addEventListener('click', () => {
    if (!isOwner) trackPublicEvent(profile.userId, 'project_view', Number(link.dataset.projectLink), visitorId())
  }))
  root.querySelectorAll('[data-profile-link]').forEach(link => link.addEventListener('click', () => {
    if (!isOwner) trackPublicEvent(profile.userId, 'link_click', null, visitorId())
  }))
  root.querySelectorAll('[data-view-project]').forEach(button => button.addEventListener('click', () => showProjectDetails(Number(button.dataset.viewProject))))
  root.querySelector('[data-edit-banner]')?.addEventListener('click', editBanner)
  root.querySelector('[data-edit-avatar]')?.addEventListener('click', editAvatar)
  root.querySelectorAll('[data-edit-project]').forEach(button => button.addEventListener('click', () => editProject(Number(button.dataset.editProject))))
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
  const dialog = openDialog('Editar banner', `<form class="portfolio-edit-form"><label>Imagem do banner<input type="file" name="banner" accept="image/jpeg,image/png,image/webp" required></label><div class="portfolio-dialog-actions"><button type="button" class="public-button secondary" data-remove-banner>Usar cinza</button><button type="submit" class="public-button">Salvar banner</button></div></form>`)
  dialog.querySelector('form').onsubmit = async event => {
    event.preventDefault()
    const button = dialog.querySelector('[type="submit"]')
    const file = dialog.querySelector('input').files[0]
    try {
      validateImage(file)
      button.disabled = true
      await uploadPortfolioBanner(portfolio.profile.userId, file)
      bannerRevision = Date.now()
      dialog.close()
      renderPage()
    } catch (error) { showDialogError(dialog, error) } finally { button.disabled = false }
  }
  dialog.querySelector('[data-remove-banner]').onclick = async event => {
    const button = event.currentTarget
    try {
      button.disabled = true
      await removePortfolioBanner(portfolio.profile.userId)
      bannerRevision = Date.now()
      dialog.close()
      renderPage()
    } catch (error) { showDialogError(dialog, error) } finally { button.disabled = false }
  }
}

function editAvatar() {
  if (!isOwner) return
  const dialog = openDialog('Editar foto de perfil', `<form class="portfolio-edit-form"><label>Nova foto<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" required></label><div class="portfolio-dialog-actions"><button type="submit" class="public-button">Salvar foto</button></div></form>`)
  dialog.querySelector('form').onsubmit = async event => {
    event.preventDefault()
    const button = dialog.querySelector('[type="submit"]')
    const file = dialog.querySelector('input').files[0]
    try {
      validateImage(file)
      button.disabled = true
      const url = await uploadAvatar(portfolio.profile.userId, file)
      await updateProfileAvatar(portfolio.profile.userId, url)
      portfolio.profile.avatar = url
      dialog.close()
      renderPage()
    } catch (error) { showDialogError(dialog, error) } finally { button.disabled = false }
  }
}

function editProject(id) {
  if (!isOwner) return
  const project = portfolio.projects.find(item => item.id === id)
  if (!project) return
  const dialog = openDialog('Editar projeto', `<form class="portfolio-edit-form"><label>Título<input name="name" required maxlength="100" value="${esc(project.name)}"></label><label>Descrição<textarea name="description" rows="3" maxlength="500">${esc(project.description)}</textarea></label><label>Tecnologias<input name="tech" value="${esc(project.tech)}"></label><label>Link do projeto<input name="link" value="${esc(project.link)}"></label><label>GitHub<input name="github" value="${esc(project.github)}"></label><label>Imagem de capa<input type="file" name="cover" accept="image/jpeg,image/png,image/webp"></label><div class="portfolio-dialog-actions"><button type="submit" class="public-button">Salvar projeto</button></div></form>`)
  dialog.querySelector('form').onsubmit = async event => {
    event.preventDefault()
    const form = event.currentTarget
    const button = form.querySelector('[type="submit"]')
    const cover = form.elements.namedItem('cover').files[0]
    try {
      if (cover) validateImage(cover)
      button.disabled = true
      const changes = Object.fromEntries(['name', 'description', 'tech', 'link', 'github'].map(key => [key, form.elements.namedItem(key).value.trim()]))
      if (!changes.name) throw new Error('Informe o título do projeto.')
      if (cover) changes.image_url = await uploadProjectImage(portfolio.profile.userId, id, cover)
      Object.assign(project, await updateProjectDetails(portfolio.profile.userId, id, changes))
      dialog.close()
      renderPage()
    } catch (error) { showDialogError(dialog, error) } finally { button.disabled = false }
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
    const [data, identity] = await Promise.all([loadPublicPortfolio(username), supabase.auth.getUser().catch(() => ({ data: { user: null } }))])
    if (!data) {
      root.innerHTML = '<section class="public-state"><h1>Portfólio indisponível</h1><p>Este portfólio não existe ou ainda não foi publicado.</p><a class="public-button" href="/">Voltar ao Devifolio</a></section>'
      return
    }
    portfolio = data
    isOwner = identity.data?.user?.id === data.profile.userId
    renderPage()
    if (!isOwner) trackPublicEvent(data.profile.userId, 'portfolio_view', null, visitorId())
  } catch (error) {
    console.error('[Devifolio] Falha ao carregar portfólio público', error)
    root.innerHTML = `<section class="public-state"><h1>Não foi possível carregar</h1><p>${esc(error.message || 'Tente novamente em instantes.')}</p><button class="public-button" onclick="location.reload()">Tentar novamente</button></section>`
  }
}

start()
