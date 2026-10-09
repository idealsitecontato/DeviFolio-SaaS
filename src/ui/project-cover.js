export const defaultProjectCoverUrl = new URL('../../assets/project-cover-placeholder.png', import.meta.url).href

export function projectCoverUrl(project = {}) {
  return project.image || defaultProjectCoverUrl
}

export function projectCoverAlt(project = {}) {
  return project.image ? `Capa de ${project.name || 'projeto'}` : 'Capa padrão do projeto'
}
