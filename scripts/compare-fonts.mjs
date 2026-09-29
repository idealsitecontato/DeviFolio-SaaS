import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
const require = createRequire(join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json'))
const { chromium } = require('playwright')
const sharp = require('sharp')
const candidates = ['Google Sans', 'Plus Jakarta Sans', 'Outfit', 'Figtree', 'DM Sans', 'Manrope']
const samples = 'docs/comparativos/fontes'
let rules = ''
for (const name of candidates) {
  for (const [i, weight] of [400, 600, 700].entries()) {
    const bytes = await readFile(name === 'Google Sans' ? 'assets/fonts/google-sans-latin.woff2' : `${samples}/${name.replaceAll(' ', '-')}-${i}.font`)
    rules += `@font-face{font-family:'${name}';font-weight:${weight};src:url(data:font/woff2;base64,${bytes.toString('base64')})}`
  }
}
const title = 'Seu projeto,<br>Seu link,<br>Seu portfólio.'
const paragraph = 'O FolioDev é uma plataforma feita para desenvolvedores e vibecoders, com organização de portfólio, integração com o GitHub e um sistema de captura de leads para transformar visitas em oportunidades.'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1150, height: 1000 } })
const ref = await sharp('docs/comparativos/hero-referencia.png').extract({ left: 147, top: 207, width: 475, height: 340 }).png().toBuffer()
await page.setContent(`<style>${rules}*{box-sizing:border-box}body{margin:0;font-family:Arial;background:#f8fcff}.row{display:grid;grid-template-columns:520px 1fr;border-bottom:1px solid #d5deee;padding:24px;gap:30px}.row>img{width:475px;height:340px}h2{font:600 18px Arial;margin:0 0 16px;color:#111}.sample{background:#067cfe;color:#fff;width:475px;padding:0}h1{font-size:66.528px;font-weight:600;line-height:1.075;letter-spacing:-.025em;margin:0}p{font-size:18px;line-height:1.38;max-width:460px;margin:24px 0 0}</style>${candidates.map(name => `<section class="row"><div><h2>Referência</h2><img src="data:image/png;base64,${ref.toString('base64')}"></div><div><h2>${name}</h2><div class="sample" style="font-family:'${name}'"><h1>${title}</h1><p>${paragraph}</p></div></div></section>`).join('')}`)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: 'docs/comparativos/comparacao-fontes.png', fullPage: true })
const metrics = await page.locator('.sample h1').evaluateAll(items => items.map(e => ({ font: getComputedStyle(e).fontFamily, width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height })))
await writeFile('docs/comparativos/fontes/metricas.json', JSON.stringify(metrics, null, 2))
console.log(metrics)
await browser.close()
