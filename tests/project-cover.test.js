import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultProjectCoverUrl, projectCoverAlt, projectCoverUrl } from '../src/ui/project-cover.js'
import { portfolioShowcase, showcaseProject } from '../src/ui/portfolio-showcase.js'

test('projects without an uploaded image use the supplied default cover', () => {
  const project = { id:1, name:'Projeto exemplo', description:'', tech:'', link:'', image:'' }
  assert.equal(projectCoverUrl(project), defaultProjectCoverUrl)
  assert.equal(projectCoverAlt(project), 'Capa padrão do projeto')
  const markup = showcaseProject(project)
  assert.match(markup, /project-cover-placeholder\.png/)
  assert.match(markup, /default-project-cover/)
  assert.doesNotMatch(markup, /Adicionar capa|project-cover-empty/)
})

test('an uploaded project cover always takes priority', () => {
  const project = { id:2, name:'Projeto com capa', description:'', tech:'', link:'', image:'https://cdn.example.com/cover.webp' }
  assert.equal(projectCoverUrl(project), project.image)
  assert.equal(projectCoverAlt(project), 'Capa de Projeto com capa')
  assert.match(showcaseProject(project), /https:\/\/cdn\.example\.com\/cover\.webp/)
})

test('the public showcase is read only even for an authenticated owner', () => {
  const markup = portfolioShowcase({
    profile:{ username:'isabella', bio:'Bio', avatar:'', userId:'owner-1' },
    projects:[],
    name:'Isabella',
    banner:'banner.webp',
    placeholderUrl:'avatar.png',
    appearance:{ background:'white', cards:'white', shape:'standard' },
    publicPage:true,
    owner:true,
  })
  assert.doesNotMatch(markup, /data-edit-|data-upload-|data-new-project|Criar projeto/)
})
