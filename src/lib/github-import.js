import { nextSortOrder } from './project-location.js'

export function planGithubImport(selected, available, projects) {
  const live = new Map(available.map(repository => [String(repository.id), repository]))
  const existing = new Set(projects.map(project => String(project.github || '').toLowerCase()).filter(Boolean))
  const repositories = []
  let duplicates = 0
  let removed = 0
  for (const item of selected) {
    const repository = live.get(String(item.id))
    if (!repository) { removed++; continue }
    const name = String(repository.full_name || '').toLowerCase()
    if (!name || existing.has(name)) { duplicates++; continue }
    repositories.push(repository)
    existing.add(name)
  }
  return { repositories, duplicates, removed }
}

export function importedGithubProject(repository, projects, id) {
  return {
    id,
    sortOrder: nextSortOrder(projects, 'principal'),
    name: repository.name,
    description: repository.description || '',
    tech: repository.language || '',
    link: repository.homepage || repository.html_url || '',
    github: repository.full_name,
    image: '',
    status: 'published',
  }
}
