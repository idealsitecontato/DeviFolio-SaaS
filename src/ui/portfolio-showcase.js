import { appearanceStyle } from '../lib/portfolio-appearance.js'
import { projectCoverAlt, projectCoverUrl } from './project-cover.js'

const esc = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])

const editIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4z"/></svg>'
function externalUrl(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch { return '' }
}

export function showcaseProject(project, { publicPage = false, ownerId = '' } = {}) {
  const url = externalUrl(project.link)
  const view = publicPage ? `data-view-project="${project.id}"` : `data-preview-project="${project.id}"`
  const visit = url
    ? `<a class="public-button" href="${esc(url)}" target="_blank" rel="noopener"${publicPage ? ` data-project-link="${project.id}" data-owner="${esc(ownerId)}"` : ''}>Acessar</a>`
    : `<button class="public-button" type="button" ${view}>Acessar</button>`
  const cover = `<img src="${esc(projectCoverUrl(project))}" alt="${esc(projectCoverAlt(project))}" loading="lazy" draggable="false"${project.image ? '' : ' class="default-project-cover"'}>`
  return `<article class="public-project my-portfolio-project${project.image ? '' : ' has-default-cover'}"><div class="project-image">${cover}</div><div class="project-content"><h3>${esc(project.name)}</h3><p>${esc(project.description || 'Conheça este projeto.')}</p>${project.tech ? `<div class="tag-row">${project.tech.split(',').filter(Boolean).map(item => `<span class="tag mono">${esc(item.trim())}</span>`).join('')}</div>` : ''}<div class="project-actions">${visit}<button class="public-button secondary" type="button" ${view}>Ver</button></div></div></article>`
}

export function portfolioShowcase({ profile, projects, name, banner, placeholderUrl, appearance, publicPage = false } = {}) {
  const username = profile.username ? `@${profile.username.replace(/^@/, '')}` : '@usuario'
  const biography = profile.bio || profile.role || 'Adicione uma biografia para apresentar seu trabalho aos visitantes.'
  const avatar = profile.portfolioAvatar || profile.avatar || placeholderUrl
  const hasAvatar = Boolean(profile.portfolioAvatar || profile.avatar)
  const bannerEdit = !publicPage
    ? `<input id="profile-banner-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><button class="icon-button banner-edit-button" type="button" data-upload-profile-banner aria-label="Editar banner">${editIcon}</button>`
    : ''
  const avatarEdit = !publicPage
    ? `<input id="portfolio-avatar-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><button class="icon-button avatar-edit-button" type="button" data-upload-portfolio-avatar aria-label="Editar foto do portfólio">${editIcon}</button>`
    : ''
  const biographyEdit = publicPage ? '' : `<button class="icon-button biography-edit-button" type="button" data-edit-biography aria-label="Editar biografia">${editIcon}</button>`
  const biographyForm = publicPage ? '' : `<form class="folio-biography-form" id="biography-form" hidden><textarea name="bio" rows="4" maxlength="240" aria-label="Biografia">${esc(profile.bio)}</textarea><div><button type="button" class="secondary-button" data-cancel-biography>Cancelar</button><button type="submit" class="primary-button">Salvar</button></div></form>`
  const createProject = publicPage ? '' : '<button class="primary-button folio-create-project" type="button" data-new-project>+ &nbsp;Criar projeto</button>'
  const projectContent = projects.length
    ? `<div class="section-heading"><h2>Meus projetos</h2><span>${projects.length} projeto${projects.length === 1 ? '' : 's'}</span></div><div class="public-projects">${projects.map(project => showcaseProject(project, { publicPage, ownerId:profile.userId })).join('')}</div>`
    : `<div class="empty-projects folio-empty-projects"><span class="folio-empty-folder" aria-hidden="true">▱</span><h2>Nenhum projeto encontrado</h2><p>Você ainda não desenvolveu nenhum projeto.<br>Crie um novo projeto para começar.</p>${createProject}</div>`
  return `<div class="portfolio-page folio-showcase ${publicPage ? 'public-showcase' : 'my-portfolio-preview'}" style="${appearanceStyle(appearance)}"><div class="portfolio-shell folio-showcase-shell"><article class="folio-showcase-card"><div class="my-portfolio-banner"><img class="public-banner-image" src="${esc(banner)}" alt="Banner do portfólio" onerror="this.hidden=true">${bannerEdit}</div><div class="folio-showcase-profile"><div class="public-avatar"><img src="${esc(avatar)}" alt="${hasAvatar ? `Foto de ${esc(name)}` : 'Ícone de usuário'}" onerror="this.src='${esc(placeholderUrl)}'">${avatarEdit}</div><div class="folio-showcase-copy"><h2>${esc(name)}</h2><p class="folio-username">${esc(username)}</p><div class="folio-biography-row"><p class="folio-biography">${esc(biography)}</p>${biographyEdit}</div>${biographyForm}</div><div class="folio-profile-metrics" aria-label="Estatísticas do portfólio"><div><strong>${projects.length}</strong><span>Projetos</span></div></div></div><section class="projects-section folio-showcase-projects">${projectContent}</section></article></div></div>`
}
