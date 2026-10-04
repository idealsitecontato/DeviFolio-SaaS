export const plans = [
  { id: 'gratis', name: 'Folio Grátis', price: '0,00', description: 'Recursos essenciais', benefits: ['1 Portfólio', '15 Projetos por mês', 'Publicação com template padrão', 'Recursos essenciais'] },
  { id: 'essencial', name: 'Folio Essencial', price: '19,90', description: 'Mais opções para apresentar seu trabalho', benefits: ['2 Portfólios', '25 Projetos por mês', 'Personalização básica', 'Mais opções para apresentar seu trabalho'] },
  { id: 'avancado', name: 'Folio Avançado', price: '49,90', description: 'Recursos profissionais', featured: true, benefits: ['5 Portfólios', 'Projetos ilimitados', 'Personalização avançada', 'Recursos profissionais', 'Destaque no portfólio'] },
  { id: 'plus', name: 'Folio Plus', price: '79,90', description: 'Recursos exclusivos', benefits: ['10 Portfólios', 'Projetos ilimitados', 'Personalização completa', 'Domínio personalizado', 'Remoção da marca FolioDev', 'Recursos exclusivos', 'Suporte prioritário'] },
]

export function renderPlanCards({ internal = false } = {}) {
  return plans.map(plan => `<article class="devi-plan-card devi-plan-card--${plan.id}">
    <div class="devi-plan-head"><h3>${plan.name}</h3>${plan.featured ? '<span class="devi-plan-badge">Recomendado</span>' : ''}</div>
    <p class="devi-plan-description">${plan.description}</p>
    <div class="devi-plan-price"><strong>R$ ${plan.price}</strong><span>por mês</span></div>
    <ul>${plan.benefits.map(benefit => `<li><span aria-hidden="true">•</span>${benefit}</li>`).join('')}</ul>
    ${internal ? '<button type="button" data-plan-coming-soon>Em breve</button>' : '<a href="cadastro.html#cadastro">Criar conta <span aria-hidden="true">↗</span></a>'}
  </article>`).join('')
}
