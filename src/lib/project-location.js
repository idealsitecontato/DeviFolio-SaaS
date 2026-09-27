export const portfolioFolders = [
  { id: 'principal', name: 'Portfólio Principal' },
  { id: 'profissional', name: 'Portfólio profissional' },
  { id: 'destaque', name: 'Projetos em destaque' },
  { id: 'github', name: 'Portfólio GitHub' },
]

export const PROJECT_LOCATION_STEP = 100000

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
  if (from === to) return true
  if (from === 'projects') return to === 'loose' || portfolioFolders.some(folder => folder.id === to)
  if (from === 'loose') return to === 'projects' || portfolioFolders.some(folder => folder.id === to)
  return to === 'loose'
}

export function nextSortOrder(projects, destination) {
  const base = locationBase(destination)
  const rank = Math.max(-1, ...projects.filter(project => projectLocation(project) === destination).map(project => project.sortOrder - base)) + 1
  if (rank >= PROJECT_LOCATION_STEP) throw new Error('Esta seção atingiu o limite de projetos.')
  return base + rank
}
