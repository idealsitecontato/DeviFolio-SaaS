let activeTab = 'portfolio'

function summary() {
  return `<div class="leads-summary" aria-label="Resumo de leads">
    <article><small>Total de leads</small><strong>—</strong></article>
    <article><small>Hoje</small><strong>—</strong></article>
    <article><small>Últimos 7 dias</small><strong>—</strong></article>
    <article><small>Últimos 30 dias</small><strong>—</strong></article>
  </div>`
}

function leadTable(kind) {
  const portfolio = kind === 'portfolio'
  const message = portfolio
    ? 'Nenhum lead captado ainda. Quando alguém entrar em contato pelo seu portfólio, aparecerá aqui.'
    : 'Os contatos captados pela Kaptei aparecerão aqui quando a captação estiver disponível.'
  return `<div class="leads-workspace">
    ${summary()}
    <div class="leads-toolbar"><div><h2>${portfolio ? 'Leads do seu portfólio' : 'Leads captados'}</h2><p>Organize os contatos recebidos e acompanhe cada oportunidade.</p></div><span class="status draft">Captação indisponível</span></div>
    <div class="leads-controls"><label>Buscar lead<input type="search" placeholder="Nome ou e-mail" disabled aria-describedby="leads-availability-${kind}"></label><label>Status<select disabled aria-describedby="leads-availability-${kind}"><option>Todos</option></select></label><label>Período<select disabled aria-describedby="leads-availability-${kind}"><option>Qualquer período</option></select></label></div>
    <p id="leads-availability-${kind}" class="leads-availability">A captação de leads ainda não está disponível nesta conta. As métricas e os filtros serão ativados quando houver dados reais.</p>
    <div class="data-table-wrap leads-table-wrap"><table class="data-table"><thead><tr><th>Nome</th><th>Contato</th><th>Origem</th><th>Portfólio</th><th>Projeto</th><th>Data e horário</th><th>Status</th><th>Ações</th></tr></thead><tbody><tr><td colspan="8" class="leads-empty-cell"><p>${message}</p><button type="button" class="secondary-button" data-route-button="${portfolio ? 'publicacoes' : 'portfolio'}">${portfolio ? 'Ver publicação' : 'Ver meu portfólio'}</button></td></tr></tbody></table></div>
  </div>`
}

export function kapteiView() {
  return `<section class="page-enter kaptei-page crm-page" aria-label="Kaptei">
    <header class="page-head"><div><h1>Leads</h1><p>Acompanhe contatos do portfólio e oportunidades da Kaptei em um só lugar.</p></div></header>
    <div class="kaptei-tabs" role="tablist" aria-label="Origem dos leads">
      <button id="kaptei-tab-portfolio" type="button" role="tab" data-kaptei-tab="portfolio" aria-selected="${activeTab === 'portfolio'}" aria-controls="kaptei-panel-portfolio" class="${activeTab === 'portfolio' ? 'is-active' : ''}">Leads do seu portfólio</button>
      <button id="kaptei-tab-captados" type="button" role="tab" data-kaptei-tab="captados" aria-selected="${activeTab === 'captados'}" aria-controls="kaptei-panel-captados" class="${activeTab === 'captados' ? 'is-active' : ''}">Leads captados</button>
    </div>
    <div id="kaptei-panel-portfolio" role="tabpanel" aria-labelledby="kaptei-tab-portfolio" ${activeTab === 'portfolio' ? '' : 'hidden'}>${leadTable('portfolio')}</div>
    <div id="kaptei-panel-captados" role="tabpanel" aria-labelledby="kaptei-tab-captados" ${activeTab === 'captados' ? '' : 'hidden'}>${leadTable('captados')}</div>
  </section>`
}

export function bindKapteiActions() {
  const root = document.querySelector('.kaptei-page')
  if (!root) return
  const tabs = [...root.querySelectorAll('[data-kaptei-tab]')]
  function activate(tab) {
    activeTab = tab.dataset.kapteiTab
    tabs.forEach(item => { const active = item === tab; item.classList.toggle('is-active', active); item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1 })
    root.querySelector('#kaptei-panel-portfolio').hidden = activeTab !== 'portfolio'
    root.querySelector('#kaptei-panel-captados').hidden = activeTab !== 'captados'
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab))
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const target = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
      activate(target)
      target.focus()
    })
  })
}
