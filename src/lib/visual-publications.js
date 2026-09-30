// Frontend-only publication journal. The existing portfolio API stays unchanged.
const key = userId => `devifolio_visual_publications_${userId}`

export function readVisualPublications(storage, userId) {
  try {
    const value = JSON.parse(storage.getItem(key(userId)) || '{}')
    return {
      folders: value?.folders && typeof value.folders === 'object' && !Array.isArray(value.folders) ? value.folders : {},
      events: Array.isArray(value?.events) ? value.events : [],
    }
  } catch {
    return { folders: {}, events: [] }
  }
}

export function recordVisualPublication(storage, userId, current, { folderId = null, name, published, url = '', snapshot = null }) {
  const next = {
    folders: folderId ? { ...current.folders, [folderId]: Boolean(published) } : { ...current.folders },
    events: [{
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      folderId,
      name,
      action: published ? 'published' : 'unpublished',
      url: published ? url : '',
      snapshot: published ? snapshot : null,
      createdAt: new Date().toISOString(),
    }, ...current.events].slice(0, 100),
  }
  storage.setItem(key(userId), JSON.stringify(next))
  return next
}
