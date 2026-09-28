export const portfolioFolders = [
  { id: 'principal', name: 'Portfólio Principal' },
  { id: 'profissional', name: 'Portfólio profissional' },
  { id: 'destaque', name: 'Projetos em destaque' },
  { id: 'github', name: 'Portfólio GitHub' },
]

export const PROJECT_LOCATION_STEP = 100000

export function restorePortfolioFolders(names = {}, projects = []) {
  const namedIndexes = Object.keys(names).filter(id => /^folder-\d+$/.test(id)).map(id => Number(id.slice(7)))
  const storedIndexes = projects.map(project => Math.floor((Number(project.sortOrder) || 0) / PROJECT_LOCATION_STEP) - 2)
  const max = Math.min(21472, Math.max(3, ...namedIndexes, ...storedIndexes))
  for (let index = portfolioFolders.length; index <= max; index++) portfolioFolders.push({ id: `folder-${index}`, name: `Portfólio ${index + 1}` })
}

export function locationBase(destination) {
  if (destination === 'projects') return 0
  if (destination === 'loose') return PROJECT_LOCATION_STEP
  const index = portfolioFolders.findIndex(folder => folder.id === destination)
  if (index < 0) throw new Error('Destino de projeto inválido.')
  return (index + 2) * PROJECT_LOCATION_STEP
}

export function projectLocation(project) {
  const bucket = Math.floor((Number(project.sortOrder) || 0) / PROJECT_LOCATION_STEP)
  return bucket === 0 ? 'projects' : bucket === 1 ? 'loose' : portfolioFolders[bucket - 2]?.id || 'projects'
}

export function allowedMove(from, to) {
  const valid = value => value === 'projects' || value === 'loose' || portfolioFolders.some(folder => folder.id === value)
  return valid(from) && valid(to)
}

export function nextSortOrder(projects, destination) {
  const base = locationBase(destination)
  const rank = Math.max(-1, ...projects.filter(project => projectLocation(project) === destination).map(project => project.sortOrder - base)) + 1
  if (rank >= PROJECT_LOCATION_STEP || base + rank > 2147483647) throw new Error('Esta seção atingiu o limite de projetos.')
  return base + rank
}

// Folder positions are presentation only: bucket indexes must never change.
export function orderedFolders(order = []) {
  const ids = [...new Set([...order, ...portfolioFolders.map(folder => folder.id)])]
  return ids.map(id => portfolioFolders.find(folder => folder.id === id)).filter(Boolean)
}

export function planProjectMove(projects, id, destination, beforeId = null) {
  const project = projects.find(item => item.id === id)
  if (!project || !allowedMove(projectLocation(project), destination)) throw new Error('Destino de projeto inválido.')
  const items = projects.filter(item => item.id !== id && projectLocation(item) === destination).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
  const index = beforeId === null ? items.length : items.findIndex(item => item.id === beforeId)
  if (index < 0) throw new Error('A posição de destino mudou. Tente novamente.')
  const base = locationBase(destination)
  const end = Math.min(base + PROJECT_LOCATION_STEP, 2147483648)
  if (items.length >= end - base) throw new Error('Esta seção atingiu o limite de projetos.')
  const left = index ? items[index - 1].sortOrder : base - 1
  const right = index < items.length ? items[index].sortOrder : end
  const rank = left + 1
  if (rank < right && rank < base + PROJECT_LOCATION_STEP) {
    return project.sortOrder === rank ? [] : [{ id, sortOrder: rank }]
  }
  items.splice(index, 0, project)
  return items.map((item, position) => ({ id: item.id, sortOrder: base + position }))
    .filter(change => projects.find(item => item.id === change.id).sortOrder !== change.sortOrder)
}

// Keep multi-row reorders recoverable while using the existing authenticated update.
export async function persistProjectMove(projects, changes, save) {
  const saved = []
  try {
    for (const change of changes) saved.push(await save(change.id, change.sortOrder))
    return projects.map(project => saved.find(item => item.id === project.id) || project)
  } catch (error) {
    const rollback = await Promise.allSettled(saved.map(project => save(project.id, projects.find(item => item.id === project.id).sortOrder)))
    if (rollback.some(result => result.status === 'rejected')) error.rollbackFailed = true
    throw error
  }
}
