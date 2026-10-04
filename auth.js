import { createScreenLoading } from './screen-loading.js'
import { mountGooeySpinners } from './src/ui/visual-components.js'
import './src/lib/build-version.js'

const panels = {
  login: document.getElementById('panel-login'),
  cadastro: document.getElementById('panel-cadastro'),
  recuperar: document.getElementById('panel-recuperar'),
  redefinir: document.getElementById('panel-redefinir'),
}

let redirecting = false
const screenLoading = createScreenLoading({ shell: document.querySelector('.auth-shell'), loading: document.getElementById('auth-loading') })
mountGooeySpinners()
let supabasePromise

function getSupabase() {
  if (!supabasePromise) {
    supabasePromise = import('./src/lib/supabase.js').then(module => module.supabase)
  }
  return supabasePromise
}

function showPanel(name, updateHash = false) {
  const selected = Object.hasOwn(panels, name) ? name : 'login'
  Object.entries(panels).forEach(([key, panel]) => {
    const active = key === selected
    panel.classList.toggle('is-active', active)
    panel.hidden = !active
  })
  document.body.dataset.authView = selected
  document.title = `${({login:'Entrar',cadastro:'Criar conta',recuperar:'Recuperar acesso',redefinir:'Nova senha'})[selected]} — FolioDev`
  clearMessage()
  if (updateHash) history.replaceState(null, '', `#${selected}`)
  if (updateHash) panels[selected].querySelector('h1')?.focus({ preventScroll: true })
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
  const code = error?.code || ''
  if (code === 'supabase_configuration_missing') return 'Não foi possível iniciar o acesso neste ambiente. Entre em contato com o suporte.'
  if (code === 'supabase_configuration_invalid') return 'Não foi possível iniciar o acesso. Entre em contato com o suporte.'
  if (message.includes('failed to fetch') || message.includes('networkerror') || message.includes('network request failed')) return 'Não foi possível conectar ao servidor de autenticação. Verifique sua conexão e tente novamente.'
  if (message.includes('invalid api key') || message.includes('invalid jwt') || message.includes('apikey')) return 'Não foi possível validar o acesso neste ambiente. Entre em contato com o suporte.'
  if (message.includes('signups not allowed') || message.includes('signup is disabled')) return 'Novos cadastros estão temporariamente desativados.'
  if (message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (message.includes('already registered') || message.includes('already been registered')) return 'Não foi possível concluir o cadastro. Confira seus dados ou recupere o acesso.'
  if (message.includes('email not confirmed')) return 'Não foi possível concluir o acesso. Confira seus dados e as instruções enviadas por e-mail.'
  if (message.includes('provider is not enabled') || message.includes('unsupported provider')) return 'O acesso com Google ainda precisa ser configurado. Use e-mail e senha ou GitHub.'
  if (message.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
  if (message.includes('weak password')) return 'A senha informada não atende aos requisitos de segurança.'
  if (message.includes('password')) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (message.includes('email')) return 'Digite um endereço de e-mail válido.'
  if (Number(error?.status) >= 500) return 'O servidor de autenticação está indisponível no momento. Tente novamente em alguns instantes.'
  return 'Não foi possível concluir o acesso. Tente novamente ou entre em contato com o suporte.'
}

function reportAuthError(action, error) {
  console.error(`[Devifolio Auth] ${action}`, {
    name: error?.name,
    code: error?.code,
    status: error?.status,
    message: error?.message,
    error,
  })
  showMessage(friendlyError(error))
}

function setLoading(button, active, label) {
  if (!button.dataset.originalMarkup) button.dataset.originalMarkup = button.innerHTML
  button.disabled = active
  button.classList.toggle('is-loading', active)
  if (active) button.textContent = label
  else button.innerHTML = button.dataset.originalMarkup
}

function goToDashboard(onboarding = false) {
  if (redirecting) return
  redirecting = true
  const destination = 'dashboard.html' + (onboarding ? '?onboarding=1' : '') + '#inicio'
  screenLoading.exitAuth(() => window.location.replace(destination), { duration: onboarding ? 3000 : 1000 })
}

document.querySelectorAll('[data-switch]').forEach(control => {
  control.addEventListener('click', event => {
    event.preventDefault()
    showPanel(control.dataset.switch, true)
  })
})

document.getElementById('cad-confirmar-senha')?.addEventListener('input', event => {
  event.currentTarget.setCustomValidity('')
})

function currentAuthView() {
  const hashView = window.location.hash.replace('#', '')
  if (Object.hasOwn(panels, hashView)) return hashView
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
    const { setRememberMe } = await import('./src/lib/supabase.js')
    setRememberMe(document.getElementById('login-remember').checked)
    const supabase = await getSupabase()
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
  if (password.value.length < 8 || !/[a-zA-Z]/.test(password.value) || !/[0-9]/.test(password.value)) {
    password.setCustomValidity('Use pelo menos 8 caracteres, incluindo uma letra e um número.')
    password.reportValidity()
    return
  }

  setLoading(button, true, 'Criando conta...')
  try {
    const { setRememberMe } = await import('./src/lib/supabase.js')
    setRememberMe(true)
    const supabase = await getSupabase()
    const response = await fetch('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value.trim(), email: email.value.trim(), password: password.value, confirmation: passwordConfirmation.value, terms: document.getElementById('cad-termos').checked }),
    })
    const data = await response.json()
    if (!response.ok) { showMessage(data.error || 'Não foi possível concluir o cadastro.'); return }
    if (data.session) {
      const { error } = await supabase.auth.setSession(data.session)
      if (error) return reportAuthError('Falha ao iniciar a sessão', error)
      return goToDashboard(true)
    }
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
    if (currentAuthView() === 'cadastro' && !document.getElementById('cad-termos').checked) {
      document.getElementById('cad-termos').reportValidity()
      return
    }
    try {
      const { setRememberMe } = await import('./src/lib/supabase.js')
      setRememberMe(currentAuthView() === 'cadastro' || document.getElementById('login-remember').checked)
    } catch (error) { reportAuthError('Falha ao preparar a sessão', error); return }
    button.disabled = true
    sessionStorage.setItem('devifolio_auth_intent', currentAuthView())
    window.location.assign('/api/auth/github/start')
  })
})

document.querySelectorAll('[data-google-login]').forEach(button => {
  button.addEventListener('click', async () => {
    clearMessage()
    const signup = currentAuthView() === 'cadastro'
    if (signup && !document.getElementById('cad-termos').checked) { document.getElementById('cad-termos').reportValidity(); return }
    setLoading(button, true, 'Conectando...')
    try {
      const { setRememberMe, isGoogleEnabled } = await import('./src/lib/supabase.js')
      if (!await isGoogleEnabled()) { showMessage('O acesso com Google ainda precisa ser configurado. Use e-mail e senha ou GitHub.', 'error'); return }
      setRememberMe(signup || document.getElementById('login-remember').checked)
      const supabase = await getSupabase()
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard.html${signup ? '?onboarding=1' : ''}#inicio` } })
      if (error) reportAuthError('Falha ao conectar Google', error)
    } catch (error) { reportAuthError('Falha ao conectar Google', error) }
    finally { setLoading(button, false) }
  })
})

let recoveryEmail = ''
let resendTimer = null
let recoverySession = false
function cooldown() {
  const button = document.querySelector('[data-resend]'); button.hidden = false; let remaining = 60
  clearInterval(resendTimer)
  const tick = () => { button.disabled = remaining > 0; button.textContent = remaining > 0 ? 'Reenviar em ' + remaining-- + 's' : 'Reenviar instruções'; if (!button.disabled) clearInterval(resendTimer) }
  tick(); resendTimer = setInterval(tick, 1000)
}
async function sendRecovery(button) {
  clearMessage(); setLoading(button, true, 'Enviando...'); let sent=false
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, { redirectTo: window.location.origin + '/cadastro.html#login' })
    if (error) return reportAuthError('Falha na recuperação de senha', error)
    showMessage('Se houver uma conta com esse e-mail, você receberá as instruções. Confira também a caixa de spam.', 'success'); sent=true
  } catch (error) { reportAuthError('Erro inesperado na recuperação de senha', error) }
  finally { setLoading(button, false); if(sent)cooldown() }
}
document.querySelector('.auth-forgot')?.addEventListener('click', event => { event.preventDefault(); document.getElementById('recovery-email').value = document.getElementById('login-email').value; showPanel('recuperar', true) })
document.getElementById('form-recuperar').addEventListener('submit', event => { event.preventDefault(); if (!event.currentTarget.reportValidity()) return; recoveryEmail = document.getElementById('recovery-email').value.trim(); void sendRecovery(event.currentTarget.querySelector('[type="submit"]')) })
document.querySelector('[data-resend]').onclick = event => { if(recoveryEmail) void sendRecovery(event.currentTarget) }
document.getElementById('form-redefinir').addEventListener('submit', async event => {
  event.preventDefault(); clearMessage(); const form=event.currentTarget, password=document.getElementById('reset-password'), confirm=document.getElementById('reset-confirm'), button=form.querySelector('[type="submit"]')
  confirm.setCustomValidity(''); if(password.value !== confirm.value) confirm.setCustomValidity('As senhas precisam ser iguais.'); if(!form.reportValidity()) return
  if(!recoverySession) return showMessage('Abra o link enviado por e-mail para redefinir sua senha. Se ele expirou, solicite outro.')
  setLoading(button,true,'Salvando...')
  try { const supabase=await getSupabase(); const {error}=await supabase.auth.updateUser({password:password.value}); if(error) return reportAuthError('Falha ao redefinir senha',error); form.reset(); showMessage('Senha atualizada. Você pode entrar com a nova senha.','success'); button.hidden=true }
  catch(error){reportAuthError('Falha ao redefinir senha',error)}finally{setLoading(button,false)}
})
// URL/session handling remains owned by the existing Supabase client.
if (/(?:^|[&#?])type=recovery(?:&|$)/.test(location.hash + location.search)) {
  const supabase = await getSupabase()
  supabase.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY') { recoverySession=true; showPanel('redefinir') } })
  const {data,error}=await supabase.auth.getSession()
  if(!error && data.session){recoverySession=true;showPanel('redefinir')}
  else {showPanel('recuperar');showMessage('Este link não pôde ser validado. Solicite um novo link de recuperação.')}
}

async function completeGithubLogin() {
  const params = new URLSearchParams(window.location.search)
  const status = params.get('github_login')
  if (!status) return false
  history.replaceState(null, '', `${window.location.pathname}${window.location.hash || '#login'}`)
  if (status !== 'complete') {
    sessionStorage.removeItem('devifolio_auth_intent')
    const messages = {
      access_denied: 'O login com GitHub foi cancelado.',
      invalid_state: 'A autorização do GitHub expirou. Tente novamente.',
      failed: 'O GitHub não concluiu o login. Tente novamente.',
    }
    showMessage(messages[status] || messages.failed)
    return false
  }

  try {
    showMessage('Concluindo login com GitHub...', 'success')
    const response = await fetch('/api/auth/github/session', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error || 'Não foi possível concluir o login. Tente novamente.')
    const supabase = await getSupabase()
    const { error } = await supabase.auth.setSession({ access_token: payload.access_token, refresh_token: payload.refresh_token })
    if (error) throw error
    const fromSignup = sessionStorage.getItem('devifolio_auth_intent') === 'cadastro'
    sessionStorage.removeItem('devifolio_auth_intent')
    goToDashboard(fromSignup)
  } catch (error) {
    sessionStorage.removeItem('devifolio_auth_intent')
    reportAuthError('Falha ao concluir o login com GitHub', error)
  }
  return true
}

try {
  await completeGithubLogin()
} catch (error) {
  reportAuthError('Falha ao inicializar a autenticação', error)
}

document.querySelectorAll('.auth-panel h1').forEach(title => title.tabIndex = -1)
document.querySelectorAll('input[type="password"]').forEach(input => {
  const wrap = document.createElement('div'); wrap.className = 'password-field'
  input.replaceWith(wrap); wrap.append(input)
  const button = document.createElement('button'); button.type = 'button'; button.className = 'password-toggle'
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>'
  button.setAttribute('aria-label', 'Mostrar senha'); button.setAttribute('aria-pressed', 'false')
  button.onclick = () => { const show = input.type === 'password'; input.type = show ? 'text' : 'password'; button.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); button.setAttribute('aria-pressed', String(show)) }
  wrap.append(button)
})
const signupPassword = document.getElementById('cad-senha')
const strength = document.createElement('small')
strength.className = 'password-strength'
strength.setAttribute('aria-live', 'polite')
strength.id = 'password-strength'
signupPassword.closest('.auth-field').append(strength)
signupPassword.setAttribute('aria-describedby', strength.id)
signupPassword.addEventListener('input', () => {
  signupPassword.setCustomValidity('')
  const value = signupPassword.value
  strength.textContent = !value ? ''
    : value.length < 8 || !/[a-zA-Z]/.test(value) || !/[0-9]/.test(value) ? 'Use 8 ou mais caracteres, com letras e números.'
      : value.length < 12 ? 'Senha válida. Mais caracteres aumentam a segurança.' : 'Senha com bom comprimento.'
})
const remembered = document.getElementById('login-remember')
remembered.checked = localStorage.getItem('foliodev.remember-me') !== 'false'
document.querySelectorAll('form input').forEach(input => {
  const container = input.closest('.auth-field') || input.closest('.auth-checkbox')
  input.addEventListener('invalid', () => {
    input.setAttribute('aria-invalid', 'true')
    let message = container.querySelector('.field-error')
    if (!message) {
      message = document.createElement('small')
      message.className = 'field-error'
      message.id = input.id + '-error'
      container.append(message)
    }
    message.textContent = input.validity.valueMissing ? input.type === 'checkbox' ? 'Aceite os termos para continuar.' : 'Preencha este campo.'
      : input.validity.typeMismatch ? 'Digite um e-mail válido.'
        : input.validity.tooShort ? `Use pelo menos ${input.minLength} caracteres.`
          : input.validity.customError ? input.validationMessage : 'Confira o valor deste campo.'
    input.setAttribute('aria-describedby', [input === signupPassword ? strength.id : '', message.id].filter(Boolean).join(' '))
  })
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid')
    container.querySelector('.field-error')?.remove()
    if (input === signupPassword) input.setAttribute('aria-describedby', strength.id)
    else input.removeAttribute('aria-describedby')
    if (input.id === 'reset-confirm') input.setCustomValidity('')
  })
})
