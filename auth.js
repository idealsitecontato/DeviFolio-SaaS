import { supabase } from './src/lib/supabase.js'

const panels = {
  login: document.getElementById('panel-login'),
  cadastro: document.getElementById('panel-cadastro'),
}

let redirecting = false

function showPanel(name, updateHash = false) {
  const selected = name === 'cadastro' ? 'cadastro' : 'login'
  Object.entries(panels).forEach(([key, panel]) => {
    panel.classList.toggle('is-active', key === selected)
  })
  clearMessage()
  if (updateHash) history.replaceState(null, '', `#${selected}`)
}

function messageElement() {
  let element = document.getElementById('auth-message')
  if (!element) {
    element = document.createElement('p')
    element.id = 'auth-message'
    element.className = 'auth-message'
    element.setAttribute('role', 'status')
    element.setAttribute('aria-live', 'polite')
    document.querySelector('.auth-panel.is-active')?.prepend(element)
  }
  return element
}

function showMessage(text, type = 'error') {
  const element = messageElement()
  element.className = `auth-message is-${type}`
  element.textContent = text
}

function clearMessage() {
  document.getElementById('auth-message')?.remove()
}

function friendlyError(error) {
  const message = error?.message?.toLowerCase() || ''
  if (message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (message.includes('already registered') || message.includes('already been registered')) return 'Este e-mail já possui uma conta.'
  if (message.includes('password')) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (message.includes('email')) return 'Digite um endereço de e-mail válido.'
  if (message.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
  return 'Não foi possível concluir agora. Tente novamente.'
}

function setLoading(button, active, label) {
  if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent
  button.disabled = active
  button.textContent = active ? label : button.dataset.originalLabel
}

function goToDashboard() {
  if (redirecting) return
  redirecting = true
  window.location.replace('dashboard.html#inicio')
}

document.querySelectorAll('[data-switch]').forEach(button => {
  button.addEventListener('click', () => showPanel(button.dataset.switch, true))
})

showPanel(window.location.hash.replace('#', '') || 'login')
window.addEventListener('hashchange', () => showPanel(window.location.hash.replace('#', '')))

document.getElementById('form-login').addEventListener('submit', async event => {
  event.preventDefault()
  clearMessage()
  const email = document.getElementById('login-email')
  const password = document.getElementById('login-senha')
  const button = event.currentTarget.querySelector('[type="submit"]')
  if (!event.currentTarget.reportValidity()) return

  setLoading(button, true, 'Entrando...')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  })
  setLoading(button, false)

  if (error) return showMessage(friendlyError(error))
  if (data.session) goToDashboard()
})

document.getElementById('form-cadastro').addEventListener('submit', async event => {
  event.preventDefault()
  clearMessage()
  const name = document.getElementById('cad-nome')
  const email = document.getElementById('cad-email')
  const password = document.getElementById('cad-senha')
  const button = event.currentTarget.querySelector('[type="submit"]')
  if (!event.currentTarget.reportValidity()) return

  setLoading(button, true, 'Criando conta...')
  const { data, error } = await supabase.auth.signUp({
    email: email.value.trim(),
    password: password.value,
    options: { data: { full_name: name.value.trim() } },
  })
  setLoading(button, false)

  if (error) return showMessage(friendlyError(error))
  if (data.session) return goToDashboard()
  showMessage('Conta criada. Confirme seu e-mail para entrar.', 'success')
})

document.querySelectorAll('#github-login, #github-cadastro').forEach(button => {
  button.addEventListener('click', async event => {
    event.preventDefault()
    clearMessage()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/dashboard.html#inicio` },
    })
    if (error) showMessage(friendlyError(error))
  })
})

document.querySelector('.auth-forgot')?.addEventListener('click', async event => {
  event.preventDefault()
  const email = document.getElementById('login-email')
  if (!email.value.trim() || !email.reportValidity()) return
  const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
    redirectTo: `${window.location.origin}/cadastro.html#login`,
  })
  if (error) return showMessage(friendlyError(error))
  showMessage('Enviamos as instruções para o seu e-mail.', 'success')
})

const { data: sessionData } = await supabase.auth.getSession()
if (sessionData.session) goToDashboard()

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) goToDashboard()
})
