import test from 'node:test'
import assert from 'node:assert/strict'
import { portfolioFolders, projectLocation, allowedMove, nextSortOrder, orderedFolders, restorePortfolioFolders, planProjectMove, persistProjectMove } from '../src/lib/project-location.js'

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

test('rejects unrelated sections and allows direct moves between all explorer destinations', () => {
  assert.equal(allowedMove('projects', 'github-page'), false)
  assert.equal(allowedMove('projects', 'principal'), true)
  assert.equal(allowedMove('loose', 'inicio'), false)
  assert.equal(allowedMove('profissional', 'projects'), true)
  assert.equal(allowedMove('profissional', 'principal'), true)
  assert.equal(allowedMove('profissional', 'loose'), true)
  for (const folder of portfolioFolders) assert.equal(allowedMove('loose', folder.id), true)
})

test('folder reorder never changes the persisted project bucket', () => {
  const project = { id: 4, sortOrder: 300006 }
  assert.deepEqual(orderedFolders(['github', 'github', 'principal', 'unknown']).map(folder => folder.id), ['github', 'principal', 'profissional', 'destaque'])
  assert.equal(projectLocation(project), 'profissional')
})

test('moves and reorders dense project ranks without losing other folders', async () => {
  let projects = [{ id: 1, sortOrder: 100000 }, { id: 2, sortOrder: 100001 }, { id: 3, sortOrder: 100002 }, { id: 4, sortOrder: 300000 }]
  const server = new Map(projects.map(project => [project.id, { ...project }]))
  const save = async (id, sortOrder) => { const saved = { ...server.get(id), sortOrder }; server.set(id, saved); return saved }
  projects = await persistProjectMove(projects, planProjectMove(projects, 3, 'loose', 1), save)
  const idsAt = destination => projects.filter(project => projectLocation(project) === destination).sort((a, b) => a.sortOrder - b.sortOrder).map(project => project.id)
  assert.deepEqual(idsAt('loose'), [3, 1, 2])
  projects = await persistProjectMove(projects, planProjectMove(projects, 4, 'loose', 1), save)
  assert.deepEqual(idsAt('loose'), [3, 4, 1, 2])
  projects = await persistProjectMove(projects, planProjectMove(projects, 4, 'github'), save)
  assert.deepEqual(idsAt('github'), [4])
  assert.equal(projectLocation(JSON.parse(JSON.stringify(server.get(4)))), 'github')
  assert.equal(new Set(projects.map(project => project.sortOrder)).size, projects.length)
})

test('failed multi-row save restores the server order and leaves client state intact', async () => {
  const projects = [{ id: 1, sortOrder: 100000 }, { id: 2, sortOrder: 100001 }, { id: 3, sortOrder: 100002 }]
  const server = new Map(projects.map(project => [project.id, { ...project }]))
  let requests = 0
  const save = async (id, sortOrder) => { if (++requests === 2) throw new Error('network'); const saved = { id, sortOrder }; server.set(id, saved); return saved }
  await assert.rejects(persistProjectMove(projects, planProjectMove(projects, 3, 'loose', 1), save), /network/)
  assert.deepEqual([...server.values()], projects)
})

test('invalid positions and unrelated destinations cannot corrupt ranks', () => {
  const projects = [{ id: 1, sortOrder: 100000 }]
  assert.throws(() => planProjectMove(projects, 1, 'inicio'))
  assert.throws(() => planProjectMove(projects, 1, 'principal', 88))
  assert.deepEqual(projects, [{ id: 1, sortOrder: 100000 }])
})

test('places multiple projects in the same folder without overwriting their positions', () => {
  const projects = []
  for (let id = 1; id <= 3; id++) projects.push({ id, sortOrder: nextSortOrder(projects, 'principal') })
  assert.deepEqual(projects.map(project => project.sortOrder), [200000, 200001, 200002])
})

test('recovers custom folder buckets after reload even without local names', () => {
  restorePortfolioFolders({}, [{ id: 9, sortOrder: 600012 }])
  assert.equal(projectLocation({ sortOrder: 600012 }), 'folder-4')
  assert.equal(allowedMove('principal', 'folder-4'), true)
  assert.equal(projectLocation({ sortOrder: 300000 }), 'profissional')
})

test('signals when rollback also fails so the dashboard can reload server truth', async () => {
  const projects = [{ id: 1, sortOrder: 100000 }, { id: 2, sortOrder: 100001 }]
  let requests = 0
  await assert.rejects(persistProjectMove(projects, planProjectMove(projects, 2, 'loose', 1), async (id, sortOrder) => {
    if (++requests > 1) throw new Error('offline')
    return { id, sortOrder }
  }), error => error.rollbackFailed === true)
})
