import { createRequire } from 'node:module'
import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'
const require = createRequire(join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json'))
const sharp = require('sharp')
const pixelmatchModule = require('pixelmatch')
const pixelmatch = pixelmatchModule.default || pixelmatchModule
const directory = 'docs/comparativos'
const results = []
for (const name of ['hero', 'login']) {
  const reference = await sharp(`${directory}/${name}-referencia.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const implementation = await sharp(`${directory}/${name}-implementacao.png`).ensureAlpha().raw().toBuffer()
  const { width, height } = reference.info
  const difference = Buffer.alloc(width * height * 4)
  const pixels = pixelmatch(reference.data, implementation, difference, width, height, { threshold: .1, includeAA: false })
  await sharp(difference, { raw: { width, height, channels: 4 } }).png().toFile(`${directory}/${name}-diferenca.png`)
  const header = Buffer.from(`<svg width="${width * 2}" height="54"><rect width="100%" height="100%" fill="#172033"/><g fill="white" font-family="Arial" font-size="24"><text x="24" y="36">Referência</text><text x="${width + 24}" y="36">Implementação</text></g></svg>`)
  await sharp({ create: { width: width * 2, height: height + 54, channels: 3, background: '#fff' } }).composite([
    { input: header, top: 0, left: 0 },
    { input: `${directory}/${name}-referencia.png`, top: 54, left: 0 },
    { input: `${directory}/${name}-implementacao.png`, top: 54, left: width },
  ]).png().toFile(`${directory}/${name}-lado-a-lado.png`)
  results.push({ name, width, height, method: 'pixelmatch', threshold: .1, includeAA: false, differentPixels: pixels, differentPercent: +(100 * pixels / (width * height)).toFixed(3) })
}
await writeFile(`${directory}/diferencas.json`, JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
