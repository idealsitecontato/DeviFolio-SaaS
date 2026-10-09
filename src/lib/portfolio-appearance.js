function colorLuminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
  const [red, green, blue] = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return red * 0.2126 + green * 0.7152 + blue * 0.0722
}

export function foregroundFor(hex) {
  return colorLuminance(hex) < 0.34 ? '#ffffff' : '#000000'
}

const paletteColor = (label, hex, ink = foregroundFor(hex)) => {
  return { label, hex, ink, muted: ink }
}

export const portfolioColors = {
  white: paletteColor('Branco', '#ffffff', '#000000'),
  gray: paletteColor('Cinza', '#858b90', '#000000'),
  black: paletteColor('Preto', '#242424', '#ffffff'),
  blue: paletteColor('Azul', '#245df5', '#ffffff'),
  green: paletteColor('Verde', '#23a765', '#ffffff'),
  yellow: paletteColor('Amarelo', '#ffd43b', '#000000'),
  orange: paletteColor('Laranja', '#ff812c', '#000000'),
  red: paletteColor('Vermelho', '#f34d55', '#ffffff'),
  pink: paletteColor('Rosa', '#d454b0', '#ffffff'),
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
