const panels = {
  login: document.getElementById('panel-login'),
  cadastro: document.getElementById('panel-cadastro'),
}

let redirecting = false
let supabasePromise
const referralUsername = new URLSearchParams(window.location.search).get('ref')?.trim().toLowerCase() || ''

function getSupabase() {
  if (!supabasePromise) {
    supabasePromise = import('./src/lib/supabase.js').then(module => module.supabase)
  }
  return supabasePromise
}

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
  const code = error?.code || ''
  if (code === 'supabase_configuration_missing') return 'A autenticação não foi configurada neste ambiente. Configure as variáveis públicas do Supabase e reinicie o site.'
  if (code === 'supabase_configuration_invalid') return 'A configuração do Supabase neste ambiente é inválida. Verifique a URL e a publishable key.'
  if (message.includes('failed to fetch') || message.includes('networkerror') || message.includes('network request failed')) return 'Não foi possível conectar ao servidor de autenticação. Verifique sua conexão e tente novamente.'
  if (message.includes('invalid api key') || message.includes('invalid jwt') || message.includes('apikey')) return 'A credencial pública do Supabase é inválida neste ambiente.'
  if (message.includes('signups not allowed') || message.includes('signup is disabled')) return 'Novos cadastros estão temporariamente desativados.'
  if (message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (message.includes('already registered') || message.includes('already been registered')) return 'Este e-mail já possui uma conta.'
  if (message.includes('email not confirmed')) return 'A confirmação de e-mail ainda está ativa no Supabase. Desative essa exigência para entrar imediatamente.'
  if (message.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
  if (message.includes('weak password')) return 'A senha informada não atende aos requisitos de segurança.'
  if (message.includes('password')) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (message.includes('email')) return 'Digite um endereço de e-mail válido.'
  if (Number(error?.status) >= 500) return 'O servidor de autenticação está indisponível no momento. Tente novamente em alguns instantes.'
  return error?.message ? `Falha na autenticação: ${error.message}` : 'Falha inesperada na autenticação. Recarregue a página e tente novamente.'
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
  if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent
  button.disabled = active
  button.textContent = active ? label : button.dataset.originalLabel
}

function setAuthOverlay(active, label = '') {
  let overlay = document.getElementById('auth-loading-overlay')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'auth-loading-overlay'
    overlay.className = 'auth-loading-overlay'
    overlay.innerHTML = '<span class="auth-spinner" aria-hidden="true"></span><p></p>'
    document.body.append(overlay)
  }
  overlay.querySelector('p').textContent = label
  overlay.toggleAttribute('hidden', !active)
}

function goToDashboard(onboarding = false) {
  if (redirecting) return
  redirecting = true
  window.location.replace(`dashboard.html${onboarding ? '?onboarding=1' : ''}#inicio`)
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
  setAuthOverlay(true, 'Entrando...')
  try {
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
    setAuthOverlay(false)
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
  setAuthOverlay(true, 'Criando sua conta...')
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
      options: {
        data: { full_name: name.value.trim() },
        emailRedirectTo: `${window.location.origin}/dashboard.html?onboarding=1#inicio`,
      },
    })

    if (error) return reportAuthError('Falha no cadastro', error)
    if (data.session) {
      if (referralUsername) {
        const { registerReferral } = await import('./src/lib/user-data.js')
        await registerReferral(referralUsername)
      }
      return goToDashboard(true)
    }
    showMessage('Conta criada. Confirme seu e-mail para entrar.', 'success')
  } catch (error) {
    reportAuthError('Erro inesperado no cadastro', error)
  } finally {
    setLoading(button, false)
    setAuthOverlay(false)
  }
})

document.querySelectorAll('#github-login, #github-cadastro').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault()
    clearMessage()
    button.setAttribute('aria-disabled', 'true')
    const query = referralUsername ? `?ref=${encodeURIComponent(referralUsername)}` : ''
    window.location.assign(`/api/auth/github/start${query}`)
  })
})

document.querySelector('.auth-forgot')?.addEventListener('click', async event => {
  event.preventDefault()
  const email = document.getElementById('login-email')
  if (!email.value.trim() || !email.reportValidity()) return
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
      redirectTo: `${window.location.origin}/cadastro.html#login`,
    })
    if (error) return reportAuthError('Falha na recuperação de senha', error)
    showMessage('Enviamos as instruções para o seu e-mail.', 'success')
  } catch (error) {
    reportAuthError('Erro inesperado na recuperação de senha', error)
  }
})

async function completeGithubLogin() {
  const params = new URLSearchParams(window.location.search)
  const status = params.get('github_login')
  if (!status) return false
  history.replaceState(null, '', `${window.location.pathname}${window.location.hash || '#login'}`)
  if (status !== 'complete') {
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
    if (!response.ok) throw new Error(payload.error || 'Não foi possível criar a sessão do Devifolio.')
    const supabase = await getSupabase()
    const { error } = await supabase.auth.setSession({ access_token: payload.access_token, refresh_token: payload.refresh_token })
    if (error) throw error
    if (referralUsername) {
      const { registerReferral } = await import('./src/lib/user-data.js')
      await registerReferral(referralUsername)
    }
    goToDashboard()
  } catch (error) {
    reportAuthError('Falha ao concluir o login com GitHub', error)
  }
  return true
}

try {
  const completingGithub = await completeGithubLogin()
  if (!completingGithub) {
    const supabase = await getSupabase()
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) reportAuthError('Falha ao recuperar a sessão', sessionError)
    if (sessionData.session) goToDashboard()

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) goToDashboard()
    })
  }
} catch (error) {
  reportAuthError('Falha ao inicializar a autenticação', error)
}
