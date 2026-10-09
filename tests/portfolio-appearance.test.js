import test from 'node:test'
import assert from 'node:assert/strict'
import { portfolioColors, portfolioShapes, normalizeAppearance, appearanceStyle, decodePortfolioPreferences, encodePortfolioPreferences, foregroundFor } from '../src/lib/portfolio-appearance.js'

test('palette choices use the requested black or white portfolio text', () => {
  assert.equal(Object.keys(portfolioColors).length, 9)
  const whiteText = new Set(['gray', 'black', 'blue', 'green', 'red', 'pink'])
  for (const [key, color] of Object.entries(portfolioColors)) {
    const expected = whiteText.has(key) ? '#ffffff' : '#000000'
    assert.equal(color.ink, expected, `${key} primary text`)
    assert.equal(color.muted, expected, `${key} secondary text`)
    const style = appearanceStyle({ background: key, cards: key, shape: 'standard' })
    assert.match(style, new RegExp(`--portfolio-background:${color.hex}`))
    assert.match(style, new RegExp(`--portfolio-card:${color.hex}`))
    assert.match(style, new RegExp(`--portfolio-card-action:${whiteText.has(key) ? '#ffffff' : '#000000'}`))
    assert.match(style, new RegExp(`--portfolio-card-action-ink:${whiteText.has(key) ? '#000000' : '#ffffff'}`))
  }
})

test('contrast is calculated from the real component color', () => {
  assert.equal(foregroundFor('#f7f7f7'), '#000000')
  assert.equal(foregroundFor('#171717'), '#ffffff')
  assert.equal(foregroundFor('#23a765'), '#ffffff')
  assert.equal(foregroundFor('#ff812c'), '#000000')
})

test('three shapes render distinct corners and invalid saved values use defaults', () => {
  assert.equal(new Set(Object.values(portfolioShapes).map(shape => shape.radius)).size, 3)
  assert.deepEqual(normalizeAppearance({ portfolioBackground: 'invalid', portfolioCards: 'red', portfolioShape: 'invalid' }), { background: 'white', cards: 'red', shape: 'standard' })
})

test('appearance shares the existing model field without losing the model choice', () => {
  const appearance = { background: 'blue', cards: 'black', shape: 'rounded' }
  assert.deepEqual(decodePortfolioPreferences(encodePortfolioPreferences('classic', appearance)), { model: 'classic', appearance })
  assert.deepEqual(decodePortfolioPreferences('white'), { model: 'white', appearance: normalizeAppearance() })
})
