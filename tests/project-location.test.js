import test from 'node:test'
import assert from 'node:assert/strict'
import { portfolioFolders, projectLocation, allowedMove, nextSortOrder } from '../src/lib/project-location.js'

test('moves a project through the explorer and preserves its location after reload', () => {
  const projects = [{ id: 1, sortOrder: 0 }]
  const move = destination => {
    const from = projectLocation(projects[0])
    assert.equal(allowedMove(from, destination), true)
    projects[0].sortOrder = nextSortOrder(projects.filter(item => item.id !== 1), destination)
    assert.equal(projectLocation(JSON.parse(JSON.stringify(projects[0]))), destination)
  }
  move('loose')
  move('profissional')
  move('loose')
  move('projects')
})

test('rejects other sections and requires a folder project to leave via the loose area', () => {
  assert.equal(allowedMove('projects', 'github-page'), false)
  assert.equal(allowedMove('projects', 'principal'), true)
  assert.equal(allowedMove('loose', 'inicio'), false)
  assert.equal(allowedMove('profissional', 'projects'), false)
  assert.equal(allowedMove('profissional', 'principal'), false)
  assert.equal(allowedMove('profissional', 'loose'), true)
  for (const folder of portfolioFolders) assert.equal(allowedMove('loose', folder.id), true)
})

test('places multiple projects in the same folder without overwriting their positions', () => {
  const projects = []
  for (let id = 1; id <= 3; id++) projects.push({ id, sortOrder: nextSortOrder(projects, 'principal') })
  assert.deepEqual(projects.map(project => project.sortOrder), [200000, 200001, 200002])
})
