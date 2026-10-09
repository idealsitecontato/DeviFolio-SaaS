import test from 'node:test'
import assert from 'node:assert/strict'
import { portfolioLeadPayload } from '../src/lib/portfolio-lead.js'
import { portfolioContactMarkup, submitPortfolioContact } from '../src/ui/portfolio-contact.js'

function fakeForm({ valid = true, data = {} } = {}) {
  const classes = new Set()
  const attributes = new Map()
  const button = {
    disabled: false,
    classList: { add:value => classes.add(value), remove:value => classes.delete(value), contains:value => classes.has(value) },
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name),
    hasAttribute: name => attributes.has(name),
  }
  const status = { textContent: '' }
  let resets = 0
  return {
    form: { reportValidity:()=>valid, querySelector:selector => selector.includes('submit') ? button : status, reset:()=>{ resets += 1 } },
    button,
    status,
    readForm:()=>data,
    resets:()=>resets,
  }
}

test('public contact markup contains the required fields and exact action copy', () => {
  const markup = portfolioContactMarkup()
  for (const field of ['name="name"', 'name="email"', 'name="subject"', 'name="message"']) assert.match(markup, new RegExp(field))
  assert.match(markup, />Enviar mensagem</)
  assert.doesNotMatch(markup, /name="phone"/)
})

test('contact submission shows real loading, blocks duplicates and confirms success', async () => {
  const view = fakeForm({ data:{ name:'Ana', email:'ana@example.com', subject:'Site', message:'Olá', website:'' } })
  let resolveRequest
  let calls = 0
  const request = new Promise(resolve => { resolveRequest = resolve })
  const first = submitPortfolioContact(view.form, async () => { calls += 1; await request }, { readForm:view.readForm })
  assert.equal(view.button.disabled, true)
  assert.equal(view.button.classList.contains('is-loading'), true)
  assert.equal(view.status.textContent, 'Enviando formulário...')
  assert.equal(await submitPortfolioContact(view.form, async () => { calls += 1 }, { readForm:view.readForm }), 'busy')
  assert.equal(calls, 1)
  resolveRequest()
  assert.equal(await first, 'success')
  assert.equal(view.status.textContent, 'Mensagem enviada com sucesso!')
  assert.equal(view.button.disabled, false)
  assert.equal(view.resets(), 1)
})

test('contact submission reports failure and allows another attempt', async () => {
  const view = fakeForm({ data:{ name:'Ana', email:'ana@example.com', subject:'Site', message:'Olá', website:'' } })
  const result = await submitPortfolioContact(view.form, async () => { throw new Error('offline') }, { readForm:view.readForm, reportError:()=>{} })
  assert.equal(result, 'error')
  assert.equal(view.button.disabled, false)
  assert.match(view.status.textContent, /tente novamente/i)
})

test('invalid and honeypot submissions never reach the lead integration', async () => {
  let calls = 0
  const submit = async () => { calls += 1 }
  const invalid = fakeForm({ valid:false, data:{ website:'' } })
  const spam = fakeForm({ data:{ website:'https://spam.invalid' } })
  assert.equal(await submitPortfolioContact(invalid.form, submit, { readForm:invalid.readForm }), 'invalid')
  assert.equal(await submitPortfolioContact(spam.form, submit, { readForm:spam.readForm }), 'spam')
  assert.equal(calls, 0)
})

test('lead payload preserves subject through the existing message column', () => {
  assert.deepEqual(portfolioLeadPayload('owner-1', { name:' Ana ', email:' a@example.com ', subject:' Orçamento ', message:' Preciso de um site. ' }), {
    user_id:'owner-1',
    name:'Ana',
    email:'a@example.com',
    phone:'',
    message:'Assunto: Orçamento\n\nPreciso de um site.',
  })
})
