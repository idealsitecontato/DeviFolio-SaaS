import { loadPublicPortfolio, trackPublicEvent } from './src/lib/user-data.js'

const root = document.getElementById('portfolio-root')
const esc = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
const normalizeUrl = value => { const text = String(value || '').trim(); return !text ? '' : /^https?:\/\//i.test(text) ? text : `https://${text}` }
const username = new URLSearchParams(location.search).get('username') || decodeURIComponent(location.pathname.match(/^\/portfolio\/([^/]+)/)?.[1] || '')

function visitorId() {
  const key = 'devifolio-public-visitor'
  let value = localStorage.getItem(key)
  if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value) }
  return value
}

function profileLink(label, value) {
  const url = normalizeUrl(value)
  return url ? `<a href="${esc(url)}" target="_blank" rel="noopener" data-profile-link>${label}</a>` : ''
}

function projectCard(project, ownerId) {
  const projectUrl = normalizeUrl(project.link)
  const githubUrl = project.github ? normalizeUrl(project.github.includes('/') && !project.github.includes('.') ? `github.com/${project.github}` : project.github) : ''
  return `<article class="public-project"><div class="project-image">${project.image ? `<img src="${esc(project.image)}" alt="Imagem do projeto ${esc(project.name)}">` : `<span>${esc(project.name.slice(0, 2).toUpperCase())}</span>`}</div><div class="project-content"><h3>${esc(project.name)}</h3>${project.description ? `<p>${esc(project.description)}</p>` : ''}<div class="skills">${project.tech.split(',').filter(Boolean).map(item => `<span>${esc(item.trim())}</span>`).join('')}</div><div class="project-actions">${projectUrl ? `<a class="public-button" href="${esc(projectUrl)}" target="_blank" rel="noopener" data-project-link="${project.id}" data-owner="${ownerId}">Ver projeto</a>` : ''}${githubUrl ? `<a class="public-button secondary" href="${esc(githubUrl)}" target="_blank" rel="noopener" data-project-link="${project.id}" data-owner="${ownerId}">GitHub</a>` : ''}</div></div></article>`
}

function notFound() {
  root.innerHTML = '<section class="public-state"><h1>Portfólio indisponível</h1><p>Este portfólio não existe ou ainda não foi publicado.</p><a class="public-button" href="/">Voltar ao Devifolio</a></section>'
}

try {
  const data = await loadPublicPortfolio(username)
  if (!data) notFound()
  else {
    const { profile, projects } = data
    document.title = `${profile.name || profile.username} — Devifolio`
    root.innerHTML = `<article class="portfolio-shell"><header class="profile-header"><div class="public-avatar">${profile.avatar ? `<img src="${esc(profile.avatar)}" alt="Foto de ${esc(profile.name)}">` : `<span>${esc((profile.name || profile.username).slice(0, 2).toUpperCase())}</span>`}</div><div class="profile-copy"><p class="kicker">PORTFÓLIO</p>${profile.name ? `<h1>${esc(profile.name)}</h1>` : ''}${profile.role ? `<h2>${esc(profile.role)}</h2>` : ''}${profile.bio ? `<p class="bio">${esc(profile.bio)}</p>` : ''}<div class="skills">${profile.skills.split(',').filter(Boolean).map(item => `<span>${esc(item.trim())}</span>`).join('')}</div><nav class="profile-links">${profileLink('GitHub', profile.github)}${profileLink('LinkedIn', profile.linkedin)}${profileLink('Site', profile.website)}</nav></div></header><section class="projects-section"><div class="section-heading"><h2>Projetos</h2><span>${projects.length} projeto${projects.length === 1 ? '' : 's'}</span></div>${projects.length ? `<div class="public-projects">${projects.map(project => projectCard(project, profile.userId)).join('')}</div>` : '<div class="empty-projects">Ainda não existem projetos publicados.</div>'}</section></article><footer class="public-footer"><span>Portfólio criado com Devifolio</span><a href="/cadastro.html#cadastro">Criar meu portfólio</a></footer>`
    const id = visitorId()
    trackPublicEvent(profile.userId, 'portfolio_view', null, id)
    document.querySelectorAll('[data-project-link]').forEach(link => link.addEventListener('click', () => trackPublicEvent(profile.userId, 'project_view', Number(link.dataset.projectLink), id)))
    document.querySelectorAll('[data-profile-link]').forEach(link => link.addEventListener('click', () => trackPublicEvent(profile.userId, 'link_click', null, id)))
  }
} catch (error) {
  console.error('[Devifolio] Falha ao carregar portfólio público', error)
  root.innerHTML = `<section class="public-state"><h1>Não foi possível carregar</h1><p>${esc(error.message || 'Tente novamente em instantes.')}</p><button class="public-button" onclick="location.reload()">Tentar novamente</button></section>`
}
