// Demonstração visual do Kaptei, produto nativo da DeviFolio.
const kapteiBannerUrl = '/kaptei/kaptei-banner.png'

const leads = [
  { id: 1, name: 'Lucas Almeida', email: 'lucas@techsolucoes.com', phone: '(11) 98765-4321', company: 'Tech Soluções', interest: 'Site institucional', potential: 'Alto', date: '25/09/2026 14:32', message: 'Gostaria de conhecer as opções para um novo site institucional.' },
  { id: 2, name: 'Mariana Costa', email: 'mariana@auroradigital.com', phone: '(11) 91234-5678', company: 'Aurora Digital', interest: 'Identidade Visual', potential: 'Médio', date: '25/09/2026 12:18', message: 'Busco uma identidade visual para a Aurora Digital.' },
  { id: 3, name: 'Gabriel Santos', email: 'gabriel@nextcode.com', phone: '(11) 99876-5432', company: 'NextCode', interest: 'Desenvolvimento Web', potential: 'Alto', date: '25/09/2026 11:03', message: 'Preciso de uma proposta para desenvolvimento web.' },
  { id: 4, name: 'Juliana Ferreira', email: 'juliana@primeconsult.com', phone: '(11) 94456-8901', company: 'Prime Consult', interest: 'Site Institucional', potential: 'Médio', date: '24/09/2026 18:45', message: 'Queremos atualizar a presença digital da empresa.' },
  { id: 5, name: 'Rafael Lima', email: 'rafael@fluxostudio.com', phone: '(11) 92310-2334', company: 'Fluxo Studio', interest: 'Branding', potential: 'Alto', date: '24/09/2026 16:22', message: 'Estamos planejando uma nova marca para o estúdio.' },
  { id: 6, name: 'Beatriz Oliveira', email: 'beatriz@inovatech.com', phone: '(11) 97865-2210', company: 'InovaTech', interest: 'E-commerce', potential: 'Médio', date: '24/09/2026 14:07', message: 'Gostaria de avaliar uma loja virtual para nossa linha de produtos.' },
  { id: 7, name: 'Felipe Rodrigues', email: 'felipe@solarweb.com', phone: '(11) 96432-7799', company: 'SolarWeb', interest: 'Site institucional', potential: 'Baixo', date: '24/09/2026 11:51', message: 'Estou pesquisando preços para um site institucional.' },
]

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
const selected = new Set()
let visibleLeads = leads

function leadRow(lead) {
  const safeName = escapeHtml(lead.name)
  return `<tr>
    <td class="kaptei-check-cell"><input type="checkbox" class="kaptei-row-check" value="${lead.id}" aria-label="Selecionar ${safeName}" ${selected.has(lead.id) ? 'checked' : ''}></td>
    <td data-label="Nome"><strong>${safeName}</strong></td>
    <td data-label="E-mail">${escapeHtml(lead.email)}</td>
    <td data-label="Telefone">${escapeHtml(lead.phone)}</td>
    <td data-label="Empresa">${escapeHtml(lead.company)}</td>
    <td data-label="Interesse">${escapeHtml(lead.interest)}</td>
    <td data-label="Potencial"><span class="kaptei-potential ${lead.potential.toLowerCase()}"><i aria-hidden="true"></i>${lead.potential}</span></td>
    <td data-label="Data">${lead.date}</td>
    <td class="kaptei-actions-cell" data-label="Ações"><button type="button" data-kaptei-info="${lead.id}">Informações</button><button type="button" data-kaptei-contact="${lead.id}">Entrar em contato</button></td>
  </tr>`
}

export function kapteiView() {
  visibleLeads = leads
  return `<section class="page-enter kaptei-page" aria-label="Kaptei, produto do FolioDev">
    <div class="kaptei-banner"><img src="${kapteiBannerUrl}" alt="Kaptei" width="5120" height="612" fetchpriority="high"></div>
    <div class="kaptei-content"><p class="kaptei-demo-note">Demonstração do Kaptei. Os contatos desta tela são exemplos.</p>
      <div class="kaptei-toolbar">
        <div class="kaptei-heading"><h1>Lista de Leads</h1><p>Gerencie e acompanhe seus leads em um só lugar.</p></div>
        <div class="kaptei-controls">
          <button class="kaptei-download" type="button" id="kaptei-download">Baixar lista</button>
          <label class="kaptei-search"><span data-icon="search" aria-hidden="true"></span><input id="kaptei-search" type="search" placeholder="Buscar por nome, e-mail ou empresa..." aria-label="Buscar leads por nome, e-mail ou empresa"></label>
          <select id="kaptei-filter" aria-label="Filtrar por potencial"><option value="todos">Todos os potenciais</option><option value="Alto">Alto</option><option value="Médio">Médio</option><option value="Baixo">Baixo</option></select>
        </div>
      </div>
      <div class="kaptei-table-wrap"><table class="kaptei-table">
        <thead><tr><th class="kaptei-check-cell"><input id="kaptei-check-all" type="checkbox" aria-label="Selecionar todos os leads visíveis"></th><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Empresa</th><th>Interesse</th><th>Potencial</th><th>Data</th><th>Ações</th></tr></thead>
        <tbody id="kaptei-rows">${leads.map(leadRow).join('')}</tbody>
      </table></div>
      <p id="kaptei-empty" class="kaptei-empty" hidden>Nenhum lead encontrado.</p>
    </div>
  </section>`
}

function updateSelectAll() {
  const all = document.querySelector('#kaptei-check-all')
  if (!all) return
  const count = visibleLeads.filter(lead => selected.has(lead.id)).length
  all.checked = visibleLeads.length > 0 && count === visibleLeads.length
  all.indeterminate = count > 0 && count < visibleLeads.length
}

function renderRows() {
  const query = document.querySelector('#kaptei-search').value.trim().toLocaleLowerCase('pt-BR')
  const potential = document.querySelector('#kaptei-filter').value
  visibleLeads = leads.filter(lead =>
    (potential === 'todos' || lead.potential === potential) &&
    `${lead.name} ${lead.email} ${lead.company}`.toLocaleLowerCase('pt-BR').includes(query)
  )
  document.querySelector('#kaptei-rows').innerHTML = visibleLeads.map(leadRow).join('')
  document.querySelector('#kaptei-empty').hidden = visibleLeads.length > 0
  updateSelectAll()
}

function downloadCsv(items) {
  const columns = ['Nome', 'E-mail', 'Telefone', 'Empresa', 'Interesse', 'Potencial', 'Data', 'Mensagem']
  const quote = value => `"${String(value).replaceAll('"', '""')}"`
  const rows = items.map(lead => [lead.name, lead.email, lead.phone, lead.company, lead.interest, lead.potential, lead.date, lead.message].map(quote).join(';'))
  const blob = new Blob(['\uFEFF', columns.map(quote).join(';'), '\r\n', rows.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'kaptei-leads.csv'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function bindKapteiActions({ modal, toast }) {
  const root = document.querySelector('.kaptei-page')
  if (!root) return
  root.querySelector('#kaptei-search').addEventListener('input', renderRows)
  root.querySelector('#kaptei-filter').addEventListener('change', renderRows)
  root.querySelector('#kaptei-check-all').addEventListener('change', event => {
    visibleLeads.forEach(lead => event.target.checked ? selected.add(lead.id) : selected.delete(lead.id))
    renderRows()
  })
  root.querySelector('#kaptei-rows').addEventListener('change', event => {
    if (!event.target.matches('.kaptei-row-check')) return
    const id = Number(event.target.value)
    event.target.checked ? selected.add(id) : selected.delete(id)
    updateSelectAll()
  })
  root.querySelector('#kaptei-rows').addEventListener('click', event => {
    const info = event.target.closest('[data-kaptei-info]')
    const contact = event.target.closest('[data-kaptei-contact]')
    const lead = leads.find(item => item.id === Number(info?.dataset.kapteiInfo || contact?.dataset.kapteiContact))
    if (!lead) return
    if (info) modal(`<div class="kaptei-detail"><h2>${escapeHtml(lead.name)}</h2><p>${escapeHtml(lead.company)} · ${escapeHtml(lead.interest)}</p><dl><div><dt>E-mail</dt><dd>${escapeHtml(lead.email)}</dd></div><div><dt>Telefone</dt><dd>${escapeHtml(lead.phone)}</dd></div><div><dt>Potencial</dt><dd>${lead.potential}</dd></div><div><dt>Recebido em</dt><dd>${lead.date}</dd></div><div><dt>Mensagem</dt><dd>${escapeHtml(lead.message)}</dd></div></dl><button class="secondary-button" type="button" data-close-modal>Fechar</button></div>`)
    if (contact) modal(`<div class="kaptei-detail"><h2>Entrar em contato</h2><p>Dados de demonstração de ${escapeHtml(lead.name)}.</p><dl><div><dt>E-mail</dt><dd>${escapeHtml(lead.email)}</dd></div><div><dt>Telefone</dt><dd>${escapeHtml(lead.phone)}</dd></div></dl><button class="secondary-button" type="button" data-close-modal>Fechar</button></div>`)
  })
  root.querySelector('#kaptei-download').addEventListener('click', () => {
    const items = selected.size ? leads.filter(lead => selected.has(lead.id)) : visibleLeads
    if (!items.length) return toast('Nenhum lead para baixar.', 'error')
    downloadCsv(items)
  })
  updateSelectAll()
}
