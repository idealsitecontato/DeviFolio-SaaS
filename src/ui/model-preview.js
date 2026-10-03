const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char])

export function modelPreviewMarkup({ model, profile, projects = [] }) {
  const name = profile.name?.trim() || 'Seu nome'
  const introduction = profile.role?.trim() || profile.bio?.trim() || 'Sua apresentação aparece aqui.'
  const visibleProjects = projects.filter(project => project.status === 'published').slice(0, 2)
  return `<div class="model-live-preview" data-model="${esc(model.id)}" aria-hidden="true">
    <div class="model-live-nav"><span>${esc(name)}</span><span>PORTFÓLIO</span></div>
    <div class="model-live-intro"><span>DESENVOLVEDOR · PORTFÓLIO</span><strong>${esc(name)}</strong><p>${esc(introduction)}</p></div>
    <div class="model-live-projects">${visibleProjects.length ? visibleProjects.map((project, index) => `<div><small>0${index + 1}</small><b>${esc(project.name)}</b><span>${esc(project.tech || 'Projeto')}</span></div>`).join('') : '<div class="model-live-empty">Seus projetos publicados aparecem aqui.</div>'}</div>
  </div>`
}
