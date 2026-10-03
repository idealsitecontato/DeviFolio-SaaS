const kapteiBannerUrl = '/kaptei/kaptei-banner.png'
let activeTab = 'captados'

const leads = [
  { id: 1, name: 'Lucas Almeida', email: 'lucas@techsolucoes.com', phone: '(11) 98765-4321', company: 'Tech Soluções', interest: 'Site institucional', potential: 'Alto', date: '25/09/2026 14:32', message: 'Gostaria de conhecer as opções para um novo site institucional.' },
  { id: 2, name: 'Mariana Costa', email: 'mariana@auroradigital.com', phone: '(11) 91234-5678', company: 'Aurora Digital', interest: 'Identidade Visual', potential: 'Médio', date: '25/09/2026 12:18', message: 'Busco uma identidade visual para a Aurora Digital.' },
  { id: 3, name: 'Gabriel Santos', email: 'gabriel@nextcode.com', phone: '(11) 99876-5432', company: 'NextCode', interest: 'Desenvolvimento Web', potential: 'Alto', date: '25/09/2026 11:03', message: 'Preciso de uma proposta para desenvolvimento web.' },
  { id: 4, name: 'Juliana Ferreira', email: 'juliana@primeconsult.com', phone: '(11) 94456-8901', company: 'Prime Consult', interest: 'Site Institucional', potential: 'Médio', date: '24/09/2026 18:45', message: 'Queremos atualizar a presença digital da empresa.' },
  { id: 5, name: 'Rafael Lima', email: 'rafael@fluxostudio.com', phone: '(11) 92310-2334', company: 'Fluxo Studio', interest: 'Branding', potential: 'Alto', date: '24/09/2026 16:22', message: 'Estamos planejando uma nova marca para o estúdio.' },
  { id: 6, name: 'Beatriz Oliveira', email: 'beatriz@inovatech.com', phone: '(11) 97865-2210', company: 'InovaTech', interest: 'E-commerce', potential: 'Médio', date: '24/09/2026 14:07', message: 'Gostaria de avaliar uma loja virtual para nossa linha de produtos.' },
]

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])

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

function leadCard(lead) {
  return `<article class="kaptei-lead-card">
    <div class="kaptei-lead-card-head"><div><span>Lead captado</span><h2>${escapeHtml(lead.name)}</h2><p>${escapeHtml(lead.company)}</p></div><span class="kaptei-potential ${lead.potential.toLowerCase()}">${lead.potential}</span></div>
    <dl><div><dt>E-mail</dt><dd>${escapeHtml(lead.email)}</dd></div><div><dt>Telefone</dt><dd>${escapeHtml(lead.phone)}</dd></div><div><dt>Interesse</dt><dd>${escapeHtml(lead.interest)}</dd></div><div><dt>Recebido em</dt><dd>${lead.date}</dd></div></dl>
    <div class="kaptei-lead-actions"><button type="button" data-kaptei-info="${lead.id}">Informações</button><button type="button" data-kaptei-contact="${lead.id}">Entrar em contato</button></div>
  </article>`
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
        <h1>Leads Captados</h1>
        <div class="kaptei-capture-area"><div class="kaptei-filters">${filterGroups.map(filterGroup).join('')}</div>
          <button class="kaptei-generate" type="button" id="kaptei-generate">✣ &nbsp;Gerar Leads</button>
          <div class="kaptei-capture-cards">${leads.map(leadCard).join('')}</div>
        </div>
      </div>
    </div>
  </section>`
}

export function bindKapteiActions({ modal, toast }) {
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
  root.querySelector('.kaptei-capture-cards')?.addEventListener('click', event => {
    const info = event.target.closest('[data-kaptei-info]')
    const contact = event.target.closest('[data-kaptei-contact]')
    const lead = leads.find(item => item.id === Number(info?.dataset.kapteiInfo || contact?.dataset.kapteiContact))
    if (!lead) return
    if (info) modal(`<div class="kaptei-detail"><h2>${escapeHtml(lead.name)}</h2><p>${escapeHtml(lead.company)} · ${escapeHtml(lead.interest)}</p><dl><div><dt>E-mail</dt><dd>${escapeHtml(lead.email)}</dd></div><div><dt>Telefone</dt><dd>${escapeHtml(lead.phone)}</dd></div><div><dt>Potencial</dt><dd>${lead.potential}</dd></div><div><dt>Recebido em</dt><dd>${lead.date}</dd></div><div><dt>Mensagem</dt><dd>${escapeHtml(lead.message)}</dd></div></dl><button class="secondary-button" type="button" data-close-modal>Fechar</button></div>`)
    if (contact) modal(`<div class="kaptei-detail"><h2>Entrar em contato</h2><p>${escapeHtml(lead.name)}</p><dl><div><dt>E-mail</dt><dd>${escapeHtml(lead.email)}</dd></div><div><dt>Telefone</dt><dd>${escapeHtml(lead.phone)}</dd></div></dl><button class="secondary-button" type="button" data-close-modal>Fechar</button></div>`)
  })
}
