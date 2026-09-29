import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const require = createRequire(join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json'))
const { chromium } = require('playwright')
const base = process.env.FOLIODEV_TEST_URL || 'http://127.0.0.1:4180'
const directory = 'docs/comparativos'
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const errors = [], requests = [], results = []
const page = await browser.newPage({ viewport: { width: 1512, height: 801 }, reducedMotion: 'reduce' })
page.on('pageerror', error => errors.push(error.message))
page.on('requestfailed', request => requests.push({ url: request.url(), error: request.failure().errorText }))
async function ready(route) {
  await page.goto(base + route, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
}
async function geometry(selectors) {
  return page.evaluate(items => Object.fromEntries(items.map(selector => {
    const element = document.querySelector(selector), r = element.getBoundingClientRect(), s = getComputedStyle(element)
    return [selector, { x: r.x, y: r.y, width: r.width, height: r.height, font: s.font, background: s.backgroundColor }]
  })), selectors)
}
await ready('/')
await page.screenshot({ path: directory + '/hero-implementacao.png' })
results.push({ route: '/', geometry: await geometry(['.navbar', '.hero-copy h1', '.hero-copy p', '.hero-actions', '.hero-person', '.hero-status', '.integration-strip']) })
await page.setViewportSize({ width: 1456, height: 816 })
await ready('/cadastro.html#login')
await page.screenshot({ path: directory + '/login-implementacao.png' })
results.push({ route: '/cadastro.html#login', geometry: await geometry(['.auth-logo', '#login-title', '.auth-sub', '#login-email', '#login-senha', '.auth-row-between', '#form-login button[type=submit]', '.auth-divider', '.auth-providers', '.auth-switch', '.auth-right', '.auth-story h2']) })
await ready('/cadastro.html#cadastro')
await page.screenshot({ path: directory + '/cadastro-implementacao.png' })
for (const width of [375, 768, 1280, 1920]) {
  for (const route of ['/', '/cadastro.html#login', '/cadastro.html#cadastro', '/cadastro.html#recuperar', '/termos.html', '/privacidade.html', '/404.html']) {
    await page.setViewportSize({ width, height: 900 })
    await ready(route)
    const findings = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      brokenImages: [...document.images].filter(image => image.complete && !image.naturalWidth).map(image => image.src),
      badAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => a.hash && !document.querySelector(a.hash) && !a.dataset.switch && !['#login', '#cadastro', '#recuperar', '#redefinir'].includes(a.hash)).map(a => a.hash),
    }))
    results.push({ width, route, ...findings })
    assert.equal(findings.overflow, false, `${route} overflow at ${width}`)
    assert.deepEqual(findings.brokenImages, [], `${route} broken images at ${width}`)
    assert.deepEqual(findings.badAnchors, [], `${route} broken anchors at ${width}`)
    if (route === '/') {
      await page.screenshot({ path: `${directory}/landing-${width}.png`, fullPage: true })
      if (width < 1001) {
        await page.getByRole('button', { name: 'Abrir menu' }).click()
        assert.equal(await page.locator('#mobile-menu').isVisible(), true)
        await page.keyboard.press('Escape')
        assert.equal(await page.locator('#mobile-menu').isVisible(), false)
      }
      await page.locator('summary').first().click()
      assert.equal(await page.locator('details').first().getAttribute('open') !== null, true)
    }
  }
}
await ready('/cadastro.html#login')
await page.locator('[data-google-login]').first().click()
await page.getByText('O acesso com Google ainda precisa ser configurado. Use e-mail e senha ou GitHub.', { exact: true }).waitFor()
results.push({ google: 'disabled provider reported inside the form without navigation or console error' })
await page.locator('#login-email').fill('pessoa@example.com')
await page.locator('#login-senha').fill('Senha2026')
await page.getByRole('button', { name: 'Mostrar senha' }).click()
assert.equal(await page.locator('#login-senha').getAttribute('type'), 'text')
await page.getByRole('button', { name: 'Ocultar senha' }).click()
assert.equal(await page.locator('#login-senha').getAttribute('type'), 'password')
await page.getByText('Esqueci a senha').click()
assert.equal(await page.locator('#panel-recuperar').isVisible(), true)
await page.getByText('Voltar para o login').click()
await page.getByRole('link', { name: 'Criar conta', exact: true }).click()
assert.equal(await page.locator('#panel-cadastro').isVisible(), true)
await page.locator('#cad-nome').fill('Pessoa Teste')
await page.locator('#cad-email').fill('pessoa@example.com')
await page.locator('#cad-senha').fill('Projeto2026')
await page.locator('#cad-confirmar-senha').fill('Diferente2026')
await page.locator('#cad-termos').check()
await page.locator('#form-cadastro button[type=submit]').click()
assert.equal(await page.locator('#cad-confirmar-senha').evaluate(input => input.validity.customError), true)
await page.goto(base + '/dashboard.html', { waitUntil: 'networkidle' })
await page.waitForURL('**/cadastro.html#login')
results.push({ authControls: 'password visibility, recovery, panel navigation, terms and mismatched passwords passed', protectedDashboard: 'redirected to login without session' })
assert.deepEqual(errors, [])
assert.deepEqual(requests, [])
await writeFile(directory + '/verificacao-browser.json', JSON.stringify({ checkedAt: new Date().toISOString(), base, results, errors, requests }, null, 2))
console.log(JSON.stringify({ results: results.length, errors, requests, geometry: results.slice(0, 2) }, null, 2))
await browser.close()
