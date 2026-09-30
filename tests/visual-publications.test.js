import test from 'node:test'
import assert from 'node:assert/strict'
import { readVisualPublications, recordVisualPublication } from '../src/lib/visual-publications.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

test('publication changes survive a browser reload and stay scoped to the user', () => {
  const storage = memoryStorage()
  const initial = readVisualPublications(storage, 'julia')
  const published = recordVisualPublication(storage, 'julia', initial, {
    folderId: 'folder-4', name: 'Portfólio da Juh', published: true,
    url: '/portfolio.html?username=julia&folder=folder-4', snapshot: { projects: [1, 2] },
  })
  assert.equal(published.folders['folder-4'], true)
  assert.equal(readVisualPublications(storage, 'julia').events.length, 1)
  assert.deepEqual(readVisualPublications(storage, 'julia').events[0].snapshot, { projects: [1, 2] })
  assert.deepEqual(readVisualPublications(storage, 'other'), { folders: {}, events: [] })

  const unpublished = recordVisualPublication(storage, 'julia', published, {
    folderId: 'folder-4', name: 'Portfólio da Juh', published: false,
  })
  assert.equal(readVisualPublications(storage, 'julia').folders['folder-4'], false)
  assert.equal(unpublished.events[0].action, 'unpublished')
  assert.equal(unpublished.events[0].snapshot, null)
})

test('corrupt visual publication data falls back to an empty journal', () => {
  const storage = { getItem: () => '{broken' }
  assert.deepEqual(readVisualPublications(storage, 'julia'), { folders: {}, events: [] })
})
