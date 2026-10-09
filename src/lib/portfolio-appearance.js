export const portfolioColors = {
  white: { label: 'Branco', hex: '#ffffff', ink: '#151515', muted: '#555e68' },
  gray: { label: 'Cinza', hex: '#858b90', ink: '#111827', muted: '#18212c' },
  black: { label: 'Preto', hex: '#242424', ink: '#ffffff', muted: '#d5d7da' },
  blue: { label: 'Azul', hex: '#245df5', ink: '#ffffff', muted: '#eef2ff' },
  green: { label: 'Verde', hex: '#23a765', ink: '#081f13', muted: '#0b2d1b' },
  yellow: { label: 'Amarelo', hex: '#ffd43b', ink: '#25210b', muted: '#4d421b' },
  orange: { label: 'Laranja', hex: '#ff812c', ink: '#271407', muted: '#4a260d' },
  red: { label: 'Vermelho', hex: '#f34d55', ink: '#240b0e', muted: '#361217' },
  pink: { label: 'Rosa', hex: '#d454b0', ink: '#230b1c', muted: '#2d0e25' },
}

export const portfolioShapes = { standard: { label: 'Padrão', radius: '14px' }, rounded: { label: 'Mais arredondado', radius: '26px' }, square: { label: 'Quadrado', radius: '0px' } }

const preferencePrefix = 'webfolio:appearance:'

export function decodePortfolioPreferences(value) {
  if (typeof value !== 'string' || !value.startsWith(preferencePrefix)) return { model: value || 'white', appearance: normalizeAppearance() }
  try {
    const saved = JSON.parse(value.slice(preferencePrefix.length))
    return {
      model: typeof saved.model === 'string' && saved.model ? saved.model : 'white',
      appearance: normalizeAppearance({ portfolioBackground: saved.background, portfolioCards: saved.cards, portfolioShape: saved.shape }),
    }
  } catch { return { model: 'white', appearance: normalizeAppearance() } }
}

export function encodePortfolioPreferences(model, appearance) {
  return preferencePrefix + JSON.stringify({ model: model || 'white', ...appearance })
}

export function normalizeAppearance(profile = {}) {
  return {
    background: Object.hasOwn(portfolioColors, profile.portfolioBackground) ? profile.portfolioBackground : 'white',
    cards: Object.hasOwn(portfolioColors, profile.portfolioCards) ? profile.portfolioCards : 'white',
    shape: Object.hasOwn(portfolioShapes, profile.portfolioShape) ? profile.portfolioShape : 'standard',
  }
}

export function appearanceStyle(appearance) {
  const background = portfolioColors[appearance.background]
  const cards = portfolioColors[appearance.cards]
  return `--portfolio-background:${background.hex};--portfolio-ink:${background.ink};--portfolio-muted:${background.muted};--portfolio-card:${cards.hex};--portfolio-card-ink:${cards.ink};--portfolio-card-muted:${cards.muted};--portfolio-radius:${portfolioShapes[appearance.shape].radius}`
}
