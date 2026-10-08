import test from 'node:test'
import assert from 'node:assert/strict'
import { portfolioColors, portfolioShapes, normalizeAppearance, appearanceStyle, decodePortfolioPreferences, encodePortfolioPreferences } from '../src/lib/portfolio-appearance.js'

function contrast(foreground, background) {
  const luminance = hex => {
    const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    return channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
  }
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

test('all nine palette choices retain readable text on portfolio and cards', () => {
  assert.equal(Object.keys(portfolioColors).length, 9)
  for (const [key, color] of Object.entries(portfolioColors)) {
    assert.ok(contrast(color.ink, color.hex) >= 4.5, `${key} text contrast`)
    const style = appearanceStyle({ background: key, cards: key, shape: 'standard' })
    assert.match(style, new RegExp(`--portfolio-background:${color.hex}`))
    assert.match(style, new RegExp(`--portfolio-card:${color.hex}`))
  }
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
