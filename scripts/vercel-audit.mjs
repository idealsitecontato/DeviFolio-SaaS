import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const { token } = JSON.parse(await readFile(join(process.env.APPDATA, 'com.vercel.cli/Data/auth.json'), 'utf8'))
const team = 'team_tw2PoJ02ZuKutJLgmZRbkBeA'
const project = 'prj_IjEiVkDfoRYPbOLaJ7hIOVgvcn5X'
async function api(route, options = {}) {
  const response = await fetch(`https://api.vercel.com${route}${route.includes('?') ? '&' : '?'}teamId=${team}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
  if (!response.ok) throw new Error(`Vercel ${response.status}: ${await response.text()}`)
  return response.json()
}
const config = await api(`/v9/projects/${project}`)
const deployments = await api(`/v6/deployments?projectId=${project}&limit=5`)
const environments = await api(`/v9/projects/${project}/env`)
if (process.argv.includes('--fix-preview')) {
  for (const variable of environments.envs.filter(e => ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'].includes(e.key))) {
    if (!variable.target.includes('preview')) {
      await api(`/v9/projects/${project}/env/${variable.id}`, { method: 'PATCH', body: JSON.stringify({ target: [...variable.target, 'preview'] }) })
      variable.target.push('preview')
      console.log(`${variable.key}: Production + Preview (valor preservado)`)
    }
  }
}
const evidence = {
  checkedAt: new Date().toISOString(),
  project: { id: config.id, name: config.name, framework: config.framework, rootDirectory: config.rootDirectory, outputDirectory: config.outputDirectory, buildCommand: config.buildCommand, installCommand: config.installCommand, link: { type: config.link.type, repo: config.link.repo, org: config.link.org, productionBranch: config.link.productionBranch }, targets: Object.fromEntries(Object.entries(config.targets || {}).map(([name, value]) => [name, { id: value.id, url: value.url, meta: value.meta }])) },
  deployments: deployments.deployments.map(d => ({ uid: d.uid, url: d.url, state: d.state, target: d.target, meta: d.meta })),
  environments: environments.envs.map(e => ({ key: e.key, target: e.target, gitBranch: e.gitBranch })),
}
await writeFile('docs/deploy-evidence.json', JSON.stringify(evidence, null, 2) + '\n')
console.log(JSON.stringify(evidence, null, 2))
