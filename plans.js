export const plans = [
  { id: 'gratis', name: 'Devi Grátis', price: '0,00', description: 'Recursos essenciais', benefits: ['1 Portfólio', '15 Projetos por mês', '2 Modelos', 'Recursos essenciais'] },
  { id: 'essencial', name: 'Devi Essencial', price: '19,90', description: 'Mais opções para apresentar seu trabalho', benefits: ['2 Portfólios', '25 Projetos por mês', '10 Modelos', 'Personalização básica', 'Mais opções para apresentar seu trabalho'] },
  { id: 'avancado', name: 'Devi Avançado', price: '49,90', description: 'Recursos profissionais', featured: true, benefits: ['5 Portfólios', 'Projetos ilimitados', 'Todos os modelos — 15+', 'Personalização avançada', 'Recursos profissionais', 'Destaque no portfólio'] },
  { id: 'plus', name: 'Devi Plus', price: '79,90', description: 'Recursos exclusivos', benefits: ['10 Portfólios', 'Projetos ilimitados', 'Todos os modelos — 15+', 'Personalização completa', 'Domínio personalizado', 'Remoção da marca DeviFolio', 'Recursos exclusivos', 'Suporte prioritário'] },
]

export function renderPlanCards({ internal = false } = {}) {
  return plans.map(plan => `<article class="devi-plan-card devi-plan-card--${plan.id}">
    <div class="devi-plan-head"><h3>${plan.name}</h3>${plan.featured ? '<span class="devi-plan-badge">MAIS ESCOLHIDO</span>' : ''}</div>
    <p class="devi-plan-description">${plan.description}</p>
    <div class="devi-plan-price"><strong>R$ ${plan.price}</strong><span>por mês</span></div>
    <ul>${plan.benefits.map(benefit => `<li><span aria-hidden="true">•</span>${benefit}</li>`).join('')}</ul>
    ${internal ? '<button type="button" disabled aria-label="Assinaturas em breve">Em breve</button>' : '<a href="cadastro.html#cadastro">Criar conta <span aria-hidden="true">↗</span></a>'}
  </article>`).join('')
}
