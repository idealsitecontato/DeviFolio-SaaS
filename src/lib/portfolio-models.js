// The ZIP's images are kept byte-for-byte in assets/models, in archive order.
// Its entries are color backgrounds, so the named models use the matching colors.
export const portfolioModels = [
  { id: 'black', name: 'Modelo Preto', description: 'Elegante, com contraste marcante.', image: new URL('../../assets/models/model-10.png', import.meta.url).href, available: true, ink: '#ffffff', muted: '#d2d2d2' },
  { id: 'white', name: 'Modelo Branco', description: 'Claro, versátil e minimalista.', image: new URL('../../assets/models/model-06.png', import.meta.url).href, available: true, ink: '#17191b', muted: '#51565b' },
  { id: 'blue', name: 'Modelo Azul', description: 'Expressivo e profissional.', image: new URL('../../assets/models/model-02.png', import.meta.url).href, available: true, ink: '#ffffff', muted: '#dce6ff' },
  { id: 'red', name: 'Modelo Vermelho', description: 'Uma presença visual intensa.', image: new URL('../../assets/models/model-01.png', import.meta.url).href, available: false, ink: '#ffffff', muted: '#ffe0dc' },
  { id: 'orange', name: 'Modelo Laranja', description: 'Cor e energia na medida certa.', image: new URL('../../assets/models/model-03.png', import.meta.url).href, available: false, ink: '#17191b', muted: '#342820' },
  { id: 'pink', name: 'Modelo Rosa', description: 'Uma identidade vibrante.', image: new URL('../../assets/models/model-04.png', import.meta.url).href, available: false, ink: '#ffffff', muted: '#ffe1eb' },
  { id: 'lime', name: 'Modelo Lima', description: 'Criativo e cheio de personalidade.', image: new URL('../../assets/models/model-05.png', import.meta.url).href, available: false, ink: '#17191b', muted: '#3d4500' },
  { id: 'yellow', name: 'Modelo Amarelo', description: 'Luminosa e acolhedora.', image: new URL('../../assets/models/model-07.png', import.meta.url).href, available: false, ink: '#17191b', muted: '#493c15' },
  { id: 'green', name: 'Modelo Verde', description: 'Natural e contemporâneo.', image: new URL('../../assets/models/model-08.png', import.meta.url).href, available: false, ink: '#10231a', muted: '#183f2c' },
  { id: 'purple', name: 'Modelo Roxo', description: 'Criativo com profundidade.', image: new URL('../../assets/models/model-09.png', import.meta.url).href, available: false, ink: '#ffffff', muted: '#e6d9ff' },
]

export const getPortfolioModel = id => portfolioModels.find(model => model.id === id) || portfolioModels[1]
