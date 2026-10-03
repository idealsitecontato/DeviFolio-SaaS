const kapteiBannerUrl = '/kaptei/kaptei-banner.png'
let activeTab = 'captados'

const filterGroups = [
  { title: 'Nichos', name: 'nicho', options: ['Tecnologia / Software', 'E-commerce', 'Marketing Digital', 'Design', 'Educação', 'Saúde', 'Outros'] },
  { title: 'Quantidade de leads', name: 'quantidade', options: ['1 - 10', '11 - 25', '26 - 50', '51 - 100', '101 - 200', '201+'] },
  { title: 'Região', name: 'regiao', options: ['Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste', 'Norte'] },
  { title: 'Potencial', name: 'potencial', options: ['Alto', 'Médio', 'Baixo'] },
  { title: 'Possui site', name: 'site', options: ['Com site', 'Sem site'] },
]

function filterGroup(group) {
  return `<fieldset class="kaptei-filter-group"><legend>${group.title}</legend><select aria-label="Filtrar ${group.title.toLowerCase()}"><option>Todos${group.name === 'nicho' ? ' os nichos' : group.name === 'potencial' ? ' os potenciais' : ''}</option>${group.options.map(option => `<option>${option}</option>`).join('')}</select><div class="kaptei-filter-options">${group.options.map(option => `<label><input type="checkbox" name="${group.name}" value="${option}"><span>${option}</span></label>`).join('')}</div></fieldset>`
}

export function kapteiView() {
  return `<section class="page-enter kaptei-page" aria-label="Kaptei">
    <div class="kaptei-banner"><img src="${kapteiBannerUrl}" alt="Kaptei" width="5120" height="612"></div>
    <div class="kaptei-content">
      <div class="kaptei-tabs" role="tablist" aria-label="Contexto dos leads">
        <button id="kaptei-tab-portfolio" type="button" role="tab" data-kaptei-tab="portfolio" aria-selected="${activeTab === 'portfolio'}" aria-controls="kaptei-panel-portfolio" class="${activeTab === 'portfolio' ? 'is-active' : ''}"><span data-icon="users" aria-hidden="true"></span> Leads do seu Portfólio</button>
        <button id="kaptei-tab-captados" type="button" role="tab" data-kaptei-tab="captados" aria-selected="${activeTab === 'captados'}" aria-controls="kaptei-panel-captados" class="${activeTab === 'captados' ? 'is-active' : ''}"><span data-icon="user" aria-hidden="true"></span> Leads Captados</button>
      </div>
      <div id="kaptei-panel-portfolio" role="tabpanel" aria-labelledby="kaptei-tab-portfolio" ${activeTab === 'portfolio' ? '' : 'hidden'}>
        <h1>Leads do seu Portfólio</h1><div class="kaptei-context-empty"><span aria-hidden="true">✉</span><h2>Nenhum lead do portfólio por enquanto</h2><p>Quando houver contatos associados ao seu portfólio, eles aparecerão aqui.</p></div>
      </div>
      <div id="kaptei-panel-captados" role="tabpanel" aria-labelledby="kaptei-tab-captados" ${activeTab === 'captados' ? '' : 'hidden'}>
        <h1>Lista de Leads</h1>
        <div class="kaptei-capture-area"><div class="kaptei-filters">${filterGroups.map(filterGroup).join('')}</div>
          <button class="kaptei-generate" type="button" id="kaptei-generate">✣ &nbsp;Gerar Leads</button>
          <div class="kaptei-capture-table"><table><thead><tr><th><input type="checkbox" disabled aria-label="Selecionar todos"></th><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Nicho</th><th>Quantidade</th><th>Região</th><th>Potencial</th><th>Possui site</th><th>Ações</th></tr></thead><tbody></tbody></table><p>Nenhum lead captado disponível por enquanto.</p></div>
        </div>
      </div>
    </div>
  </section>`
}

export function bindKapteiActions({ toast }) {
  const root = document.querySelector('.kaptei-page')
  if (!root) return
  root.querySelectorAll('[data-kaptei-tab]').forEach(tab => tab.addEventListener('click', () => {
    activeTab = tab.dataset.kapteiTab
    root.querySelectorAll('[data-kaptei-tab]').forEach(item => {
      const active = item === tab
      item.classList.toggle('is-active', active)
      item.setAttribute('aria-selected', String(active))
    })
    root.querySelector('#kaptei-panel-portfolio').hidden = activeTab !== 'portfolio'
    root.querySelector('#kaptei-panel-captados').hidden = activeTab !== 'captados'
  }))
  root.querySelector('#kaptei-generate')?.addEventListener('click', () => toast('Em breve...'))
}
