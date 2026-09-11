import { supabase } from './src/lib/supabase.js'

const panels = {
  login: document.getElementById('panel-login'),
  cadastro: document.getElementById('panel-cadastro'),
}

let redirecting = false

function showPanel(name, updateHash = false) {
  const selected = name === 'cadastro' ? 'cadastro' : 'login'
  Object.entries(panels).forEach(([key, panel]) => {
    const active = key === selected
    panel.classList.toggle('is-active', active)
    panel.hidden = !active
  })
  document.body.dataset.authView = selected
  document.title = selected === 'cadastro' ? 'Criar conta — Devifolio' : 'Entrar — Devifolio'
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

function reportAuthError(action, error) {
  console.error(`[Devifolio Auth] ${action}`, error)
  showMessage(friendlyError(error))
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

document.getElementById('cad-confirmar-senha')?.addEventListener('input', event => {
  event.currentTarget.setCustomValidity('')
})

function currentAuthView() {
  const hashView = window.location.hash.replace('#', '')
  if (hashView === 'login' || hashView === 'cadastro') return hashView
  return window.location.pathname.toLowerCase().endsWith('/cadastro.html') ? 'cadastro' : 'login'
}

showPanel(currentAuthView())
window.addEventListener('hashchange', () => showPanel(currentAuthView()))

document.getElementById('form-login').addEventListener('submit', async event => {
  event.preventDefault()
  clearMessage()
  const email = document.getElementById('login-email')
  const password = document.getElementById('login-senha')
  const button = event.currentTarget.querySelector('[type="submit"]')
  if (!event.currentTarget.reportValidity()) return

  setLoading(button, true, 'Entrando...')
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    })

    if (error) return reportAuthError('Falha no login', error)
    if (data.session) goToDashboard()
  } catch (error) {
    reportAuthError('Erro inesperado no login', error)
  } finally {
    setLoading(button, false)
  }
})

document.getElementById('form-cadastro').addEventListener('submit', async event => {
  event.preventDefault()
  clearMessage()
  const name = document.getElementById('cad-nome')
  const email = document.getElementById('cad-email')
  const password = document.getElementById('cad-senha')
  const passwordConfirmation = document.getElementById('cad-confirmar-senha')
  const button = event.currentTarget.querySelector('[type="submit"]')
  passwordConfirmation.setCustomValidity('')
  if (!event.currentTarget.reportValidity()) return
  if (password.value !== passwordConfirmation.value) {
    passwordConfirmation.setCustomValidity('As senhas precisam ser iguais.')
    passwordConfirmation.reportValidity()
    return
  }

  setLoading(button, true, 'Criando conta...')
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
      options: {
        data: { full_name: name.value.trim() },
        emailRedirectTo: `${window.location.origin}/dashboard.html#inicio`,
      },
    })

    if (error) return reportAuthError('Falha no cadastro', error)
    if (data.session) return goToDashboard()
    showMessage('Conta criada. Confirme seu e-mail para entrar.', 'success')
  } catch (error) {
    reportAuthError('Erro inesperado no cadastro', error)
  } finally {
    setLoading(button, false)
  }
})

document.querySelectorAll('#github-login, #github-cadastro').forEach(button => {
  button.addEventListener('click', async event => {
    event.preventDefault()
    clearMessage()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/dashboard.html#inicio` },
    })
    if (error) reportAuthError('Falha no login com GitHub', error)
  })
})

document.querySelector('.auth-forgot')?.addEventListener('click', async event => {
  event.preventDefault()
  const email = document.getElementById('login-email')
  if (!email.value.trim() || !email.reportValidity()) return
  const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
    redirectTo: `${window.location.origin}/cadastro.html#login`,
  })
  if (error) return reportAuthError('Falha na recuperação de senha', error)
  showMessage('Enviamos as instruções para o seu e-mail.', 'success')
})

const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
if (sessionError) reportAuthError('Falha ao recuperar a sessão', sessionError)
if (sessionData.session) goToDashboard()

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) goToDashboard()
})
