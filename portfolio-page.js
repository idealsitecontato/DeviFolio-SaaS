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
import { getPortfolioModel, modelPreviewUrl } from './src/lib/portfolio-models.js'
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

function projectCard(project, ownerId) {
  const projectUrl = normalizeUrl(project.link)
  return `<article class="public-project"><div class="project-image">${project.image ? `<img src="${esc(project.image)}" alt="Capa de ${esc(project.name)}" loading="lazy" width="540" height="300">` : `<span>${esc(project.name.slice(0, 2).toUpperCase())}</span>`}</div><div class="project-content"><h3>${esc(project.name)}</h3><p>${esc(project.description || 'Conheça este projeto.')}</p>${project.tech?`<div class="tag-row">${project.tech.split(',').filter(Boolean).map(tech=>`<span class="tag mono">${esc(tech.trim())}</span>`).join('')}</div>`:''}<div class="project-actions">${projectUrl ? `<a class="public-button" href="${esc(projectUrl)}" target="_blank" rel="noopener" data-project-link="${project.id}" data-owner="${ownerId}">Acessar</a>` : `<button class="public-button" type="button" data-view-project="${project.id}">Acessar</button>`}<button class="public-button secondary" type="button" data-view-project="${project.id}">Ver</button></div></div></article>`
}

function renderPage() {
  const { profile, projects } = portfolio
  const selectedModel = getPortfolioModel(profile.selectedModel)
  const emptyProject = `<div class="empty-projects folio-empty-projects"><span class="folio-empty-folder" aria-hidden="true">▱</span><h2>Nenhum projeto encontrado</h2><p>Você ainda não desenvolveu nenhum projeto.<br>Crie um novo projeto para começar.</p>${isOwner ? '<a href="/dashboard.html#projetos" class="folio-create-project">+ &nbsp;Criar projeto</a>' : ''}</div>`
  const profileMetrics = !projects.length ? `<div class="folio-profile-metrics"><div><strong>0</strong><span>Projetos</span></div><div><strong>${[profile.github, profile.linkedin, profile.website].filter(Boolean).length}</strong><span>Links profissionais</span></div><div><strong>${profile.role ? '1' : '0'}</strong><span>Área de atuação</span></div></div>` : ''
  const name = profile.name || profile.username
  const avatar = profile.avatar || placeholderUrl
  const banner = `${portfolioBannerUrl(profile.userId)}${bannerRevision ? `?v=${bannerRevision}` : ''}`
  document.title = `${folderId ? folderLabel || 'Portfólio secundário' : name} — FolioDev`
  const description=profile.bio || `Projetos de ${name}. Portfólio criado com FolioDev.`
  document.querySelector('meta[name="description"]').content=description
  document.querySelector('meta[property="og:title"]').content=document.title
  document.querySelector('meta[property="og:description"]').content=description
  if(profile.avatar)document.querySelector('meta[property="og:image"]').content=profile.avatar
  root.innerHTML = `<article class="portfolio-page" data-model="${esc(selectedModel.id)}" data-model-category="${esc(selectedModel.category || 'Portfólio')}" data-site-template="${modelPreviewUrl(selectedModel) ? 'yes' : 'no'}" style="--portfolio-model-accent:${esc(selectedModel.accent || '#333333')};--portfolio-model-ink:${esc(selectedModel.ink || '#111111')};${modelPreviewUrl(selectedModel) ? '' : `--portfolio-model-cover:url('${esc(selectedModel.image)}');`}"><header class="public-nav"><a href="${isOwner ? '/dashboard.html#inicio' : '/'}" aria-label="${isOwner ? 'Voltar ao início do painel' : 'Voltar ao FolioDev'}">${isOwner ? '← Voltar ao início' : '← FolioDev'}</a><a href="/cadastro.html#cadastro" class="nav-action">Criar meu portfólio</a></header><div class="portfolio-shell"><section class="public-hero"><img class="public-banner-image" src="${esc(banner)}" alt="" aria-hidden="true">${isOwner ? '<button class="portfolio-edit-button banner-edit-button" type="button" data-edit-banner aria-label="Editar banner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4z"/></svg></button>' : ''}<div class="profile-header"><div class="public-avatar"><img src="${esc(avatar)}" alt="${profile.avatar ? `Foto de ${esc(name)}` : 'Ícone de usuário'}" width="112" height="112">${isOwner ? '<button class="portfolio-edit-button avatar-edit-button" type="button" data-edit-avatar aria-label="Editar foto de perfil"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4z"/></svg></button>' : ''}</div><div class="profile-copy"><h1>${esc(name)}</h1><p class="folio-username">@${esc(profile.username)}</p>${profile.role ? `<h2>${esc(profile.role)}</h2>` : ''}${profile.bio ? `<p class="bio">${esc(profile.bio)}</p>` : ''}<nav class="profile-links">${profileLink('GitHub', profile.github)}${profileLink('LinkedIn', profile.linkedin)}${profileLink('Meu site', profile.website)}</nav></div>${profileMetrics}</div></section><section class="projects-section"><div class="section-heading"><h2>Meus projetos</h2><span>${projects.length} projeto${projects.length === 1 ? '' : 's'}</span></div>${projects.length ? `<div class="public-projects">${projects.map(project => projectCard(project, profile.userId)).join('')}</div>` : emptyProject}</section>${!isOwner ? `<section class="public-contact" aria-labelledby="contact-title"><div><span>VAMOS CONVERSAR</span><h2 id="contact-title">Gostou do meu trabalho?</h2><p>Envie uma mensagem sobre seu projeto. Seu contato chega diretamente ao meu painel.</p></div><form id="portfolio-contact-form"><label>Nome<input name="name" maxlength="100" minlength="2" required autocomplete="name"></label><label>E-mail<input name="email" type="email" maxlength="254" required autocomplete="email"></label><label>Telefone<input name="phone" type="tel" maxlength="40" autocomplete="tel"></label><label>Mensagem<textarea name="message" maxlength="2000" rows="4" placeholder="Conte um pouco sobre o que você precisa"></textarea></label><label class="contact-honeypot" aria-hidden="true">Site<input name="website" tabindex="-1" autocomplete="off"></label><button class="public-button" type="submit">Enviar contato</button><p role="status" aria-live="polite"></p></form></section>` : ''}</div><footer class="public-footer"><a href="/" aria-label="Criado com FolioDev"><span class="folio-brand"><img src="${brandUrl}" alt="FolioDev" width="1086" height="162"></span></a><span>Trabalho de ${esc(name)}.</span></footer></article>`

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
      console.error('[FolioDev] Falha ao enviar contato', error)
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
      root.innerHTML = '<section class="public-state"><h1>Portfólio indisponível</h1><p>Este portfólio não existe ou ainda não foi publicado.</p><a class="public-button" href="/">Voltar ao FolioDev</a></section>'
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
