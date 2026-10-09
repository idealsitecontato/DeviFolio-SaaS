export const portfolioColors = {
  white: { label: 'Branco', hex: '#ffffff', ink: '#000000', muted: '#000000' },
  gray: { label: 'Cinza', hex: '#858b90', ink: '#ffffff', muted: '#ffffff' },
  black: { label: 'Preto', hex: '#242424', ink: '#ffffff', muted: '#ffffff' },
  blue: { label: 'Azul', hex: '#245df5', ink: '#ffffff', muted: '#ffffff' },
  green: { label: 'Verde', hex: '#23a765', ink: '#ffffff', muted: '#ffffff' },
  yellow: { label: 'Amarelo', hex: '#ffd43b', ink: '#000000', muted: '#000000' },
  orange: { label: 'Laranja', hex: '#ff812c', ink: '#000000', muted: '#000000' },
  red: { label: 'Vermelho', hex: '#f34d55', ink: '#ffffff', muted: '#ffffff' },
  pink: { label: 'Rosa', hex: '#d454b0', ink: '#ffffff', muted: '#ffffff' },
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
  const darkCard = cards.ink === '#ffffff'
  return `--portfolio-background:${background.hex};--portfolio-ink:${background.ink};--portfolio-muted:${background.muted};--portfolio-card:${cards.hex};--portfolio-card-ink:${cards.ink};--portfolio-card-muted:${cards.muted};--portfolio-card-action:${darkCard ? '#ffffff' : '#000000'};--portfolio-card-action-ink:${darkCard ? '#000000' : '#ffffff'};--portfolio-logo-filter:${background.ink === '#ffffff' ? 'brightness(0) invert(1)' : 'brightness(0)'};--portfolio-radius:${portfolioShapes[appearance.shape].radius}`
}
