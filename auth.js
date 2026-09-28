import { documentPreview } from './src/ui/components.js'
import { createScreenLoading } from './screen-loading.js'

const panels = {
  login: document.getElementById('panel-login'),
  cadastro: document.getElementById('panel-cadastro'),
  recuperar: document.getElementById('panel-recuperar'),
  redefinir: document.getElementById('panel-redefinir'),
}

let redirecting = false
const screenLoading = createScreenLoading({ shell: document.querySelector('.auth-shell'), loading: document.getElementById('auth-loading') })
let supabasePromise
const referralUsername = new URLSearchParams(window.location.search).get('ref')?.trim().toLowerCase() || ''

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
  if (message.includes('already registered') || message.includes('already been registered')) return 'Este e-mail já possui uma conta.'
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar. Confira também a caixa de spam.'
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
  if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent
  button.disabled = active
  button.classList.toggle('is-loading', active)
  button.textContent = active ? label : button.dataset.originalLabel
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

  setLoading(button, true, 'Criando conta...')
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
  }
})

document.querySelectorAll('#github-login, #github-cadastro').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault()
    clearMessage()
    button.setAttribute('aria-disabled', 'true')
    sessionStorage.setItem('devifolio_auth_intent', currentAuthView())
    const query = referralUsername ? `?ref=${encodeURIComponent(referralUsername)}` : ''
    window.location.assign(`/api/auth/github/start${query}`)
  })
})

document.querySelectorAll('[data-google-soon]').forEach(button => {
  button.addEventListener('click', () => showMessage('Login com Google estará disponível em breve.', 'success'))
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
    showMessage('Enviamos um link para ' + recoveryEmail + '. Confira também a caixa de spam.', 'success'); sent=true
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
    if (referralUsername) {
      const { registerReferral } = await import('./src/lib/user-data.js')
      await registerReferral(referralUsername)
    }
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

const preview = document.getElementById('auth-product-preview')
if(preview) preview.innerHTML=documentPreview({profile:{name:'Seu portfólio',username:'seu-nome',role:'Projetos, contexto e links profissionais'},projects:[{name:'Projeto principal',description:'O que você construiu e por que importa.',tech:'repo / main'},{name:'Mais do seu trabalho',description:'Organize os projetos que quer apresentar.',tech:'publicado'}],compact:true})
document.querySelectorAll('input[type="password"]').forEach(input=>{const wrap=document.createElement('div');wrap.className='password-field';input.replaceWith(wrap);wrap.append(input);const button=document.createElement('button');button.type='button';button.className='password-toggle';button.textContent='Mostrar';button.setAttribute('aria-label','Mostrar senha');button.onclick=()=>{const show=input.type==='password';input.type=show?'text':'password';button.textContent=show?'Ocultar':'Mostrar';button.setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha')};wrap.append(button)})
const signupPassword=document.getElementById('cad-senha');const strength=document.createElement('small');strength.className='password-strength';strength.setAttribute('aria-live','polite');signupPassword.closest('.auth-field').append(strength);signupPassword.addEventListener('input',()=>{const v=signupPassword.value;strength.textContent=!v?'':v.length<8?'Use pelo menos 8 caracteres.':v.length<12?'Comprimento suficiente. Uma senha mais longa é mais segura.':'Bom comprimento de senha.'})
document.querySelectorAll('form input').forEach(input=>{input.addEventListener('invalid',()=>{input.setAttribute('aria-invalid','true');let msg=input.closest('.auth-field')?.querySelector('.field-error');if(!msg){msg=document.createElement('small');msg.className='field-error';msg.id=input.id+'-error';input.closest('.auth-field')?.append(msg)}msg.textContent=input.validity.valueMissing?'Preencha este campo.':input.validity.typeMismatch?'Digite um e-mail válido.':input.validity.tooShort?'Use pelo menos '+input.minLength+' caracteres.':input.validity.customError?input.validationMessage:'Confira o valor deste campo.';input.setAttribute('aria-describedby',msg.id)});input.addEventListener('input',()=>{input.removeAttribute('aria-invalid');input.closest('.auth-field')?.querySelector('.field-error')?.remove();input.removeAttribute('aria-describedby');if(input.id==='reset-confirm')input.setCustomValidity('')})})
