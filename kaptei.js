const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])

const localDay = value => {
  const date = new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function leadRows(leads) {
  return leads.map(lead => {
    const phone = String(lead.phone || '').replace(/[^0-9+]/g, '')
    const contact = phone ? `tel:${phone}` : `mailto:${encodeURIComponent(lead.email)}`
    const potential = ['Alto', 'Médio', 'Baixo'].includes(lead.potential) ? lead.potential : 'Médio'
    return `<tr data-lead-row data-search="${escapeHtml(`${lead.name} ${lead.email}`.toLowerCase())}" data-status="${escapeHtml(lead.status || 'Novo')}" data-date="${escapeHtml(lead.created_at)}"><td><input type="checkbox" data-lead-select value="${lead.id}" aria-label="Selecionar ${escapeHtml(lead.name)}"></td><td>${escapeHtml(lead.name)}</td><td><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></td><td>${escapeHtml(lead.phone || '—')}</td><td><span class="lead-potential ${potential === 'Alto' ? 'high' : potential === 'Baixo' ? 'low' : 'medium'}">${potential}</span></td><td><a class="lead-call" href="${escapeHtml(contact)}">Chamar</a></td></tr>`
  }).join('')
}

export function kapteiView(leads = [], available = true) {
  const today = localDay(new Date())
  const last7 = new Date(today); last7.setDate(last7.getDate() - 6)
  const last30 = new Date(today); last30.setDate(last30.getDate() - 29)
  const stats = [
    ['Total de leads', leads.length],
    ['Hoje', leads.filter(lead => localDay(lead.created_at).getTime() === today.getTime()).length],
    ['Últimos 7 dias', leads.filter(lead => localDay(lead.created_at) >= last7).length],
    ['Últimos 30 dias', leads.filter(lead => localDay(lead.created_at) >= last30).length],
  ]
  return `<section class="page-enter leads-page" aria-label="Leads do portfólio">
    <header class="leads-header"><h1>Leads</h1><p>Acompanhe contatos do portfólio e oportunidades da Kaptei em um só lugar.</p></header>
    <div class="leads-tab">Leads do seu portfólio</div>
    <div class="leads-stats">${stats.map(([label, value]) => `<article class="card"><span>${label}</span><strong>${available && leads.length ? value : '—'}</strong></article>`).join('')}</div>
    <div class="leads-section-head"><div><h2>Leads do seu portfólio</h2><p>Organize os contatos recebidos e acompanhe cada oportunidade.</p></div>${leads.length ? '<button class="primary-button" type="button" data-download-leads>↓ &nbsp;Baixar lista</button>' : ''}</div>
    <div class="leads-filters"><label>Buscar lead<input type="search" id="lead-search" placeholder="Nome ou e-mail"></label><label>Status<select id="lead-status"><option value="all">Todos</option><option>Novo</option><option>Em contato</option><option>Concluído</option></select></label><label>Período<select id="lead-period"><option value="all">Qualquer período</option><option value="today">Hoje</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option></select></label></div>
    <div class="card leads-table-wrap"><table class="leads-table"><thead><tr><th><input type="checkbox" id="lead-select-all" aria-label="Selecionar todos os leads visíveis"></th><th>Nome</th><th>E-mail</th><th>Contato</th><th>Potencial</th><th>Ações</th></tr></thead><tbody>${leadRows(leads)}</tbody></table><div class="leads-empty" ${leads.length ? 'hidden' : ''}><span aria-hidden="true">♙</span><h3>${available ? 'Nenhum lead encontrado' : 'Leads indisponíveis'}</h3><p>${available ? 'Verifique seu portfólio. Quando houver novos contatos, eles aparecerão aqui.' : 'Aplique a migração de leads do banco para receber contatos.'}</p></div><p class="leads-no-results" hidden>Nenhum lead corresponde aos filtros.</p></div>
  </section>`
}

function csvCell(value) {
  const text = String(value ?? '').replace(/^([=+\-@])/, "'$1")
  return `"${text.replace(/"/g, '""')}"`
}

export function bindKapteiActions({ toast }) {
  const root = document.querySelector('.leads-page')
  if (!root) return
  const rows = [...root.querySelectorAll('[data-lead-row]')]
  const search = root.querySelector('#lead-search')
  const status = root.querySelector('#lead-status')
  const period = root.querySelector('#lead-period')
  const selectAll = root.querySelector('#lead-select-all')
  const update = () => {
    const query = search.value.trim().toLowerCase()
    const threshold = new Date()
    if (period.value === 'today') threshold.setHours(0, 0, 0, 0)
    else if (period.value !== 'all') { threshold.setHours(0, 0, 0, 0); threshold.setDate(threshold.getDate() - Number(period.value) + 1) }
    rows.forEach(row => {
      const visible = row.dataset.search.includes(query) && (status.value === 'all' || row.dataset.status === status.value) && (period.value === 'all' || new Date(row.dataset.date) >= threshold)
      row.hidden = !visible
      if (!visible) row.querySelector('[data-lead-select]').checked = false
    })
    root.querySelector('.leads-no-results').hidden = !rows.length || rows.some(row => !row.hidden)
    selectAll.checked = false
  }
  search.addEventListener('input', update)
  status.addEventListener('change', update)
  period.addEventListener('change', update)
  selectAll.addEventListener('change', () => rows.filter(row => !row.hidden).forEach(row => { row.querySelector('[data-lead-select]').checked = selectAll.checked }))
  root.querySelector('[data-download-leads]')?.addEventListener('click', () => {
    const selected = rows.filter(row => row.querySelector('[data-lead-select]').checked)
    const target = selected.length ? selected : rows.filter(row => !row.hidden)
    if (!target.length) return toast('Nenhum lead para baixar.')
    const lines = [['Nome', 'E-mail', 'Contato', 'Potencial', 'Status', 'Recebido em'].map(csvCell).join(',')]
    target.forEach(row => {
      const cells = row.querySelectorAll('td')
      lines.push([cells[1].textContent, cells[2].textContent, cells[3].textContent, cells[4].textContent, row.dataset.status, new Date(row.dataset.date).toLocaleString('pt-BR')].map(csvCell).join(','))
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }))
    link.download = 'webfolio-leads.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  })
}
