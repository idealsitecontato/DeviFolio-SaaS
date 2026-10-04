import test from 'node:test'
import assert from 'node:assert/strict'
import { planGithubImport, importedGithubProject } from '../src/lib/github-import.js'
import { projectLocation } from '../src/lib/project-location.js'

test('GitHub import places live repositories in the principal portfolio without moving existing projects', () => {
  const existing = [{ id: 1, github: 'owner/old', sortOrder: 0 }]
  const selected = [{ id: 10 }, { id: 11 }, { id: 12 }]
  const available = [
    { id: 10, full_name: 'OWNER/OLD', name: 'old' },
    { id: 11, full_name: 'owner/new', name: 'new', html_url: 'https://github.com/owner/new' },
  ]
  const plan = planGithubImport(selected, available, existing)
  assert.deepEqual({ duplicates: plan.duplicates, removed: plan.removed }, { duplicates: 1, removed: 1 })
  const imported = importedGithubProject(plan.repositories[0], existing, 2)
  assert.equal(projectLocation(imported), 'principal')
  assert.equal(imported.status, 'published')
  assert.equal(imported.link, 'https://github.com/owner/new')
  assert.equal(projectLocation(existing[0]), 'projects')
})
