import { folioDevMark } from './brand.js'

export const Logo = () => `<span class="auth-logo"><img src="${folioDevMark}" alt="" width="1260" height="1134"><span>Devifolio</span></span>`
export function AuthInput(id, label, { type = 'text', autocomplete = '', minlength = '', maxlength = '', placeholder = '' } = {}) {
  return `<div class="auth-field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" autocomplete="${autocomplete}" ${minlength ? `minlength="${minlength}"` : ''} ${maxlength ? `maxlength="${maxlength}"` : ''} ${placeholder ? `placeholder="${placeholder}"` : ''} required></div>`
}
export const AuthButton = label => `<button class="button button-submit" type="submit">${label}</button>`
export function SocialButton(provider, signup = false) {
  const label = `${signup ? 'Cadastrar' : 'Entrar'} com ${provider === 'google' ? 'Google' : 'GitHub'}`
  return `<button class="button button-${provider}" type="button" ${provider === 'github' ? `id="github-${signup ? 'cadastro' : 'login'}"` : 'data-google-login'}><img src="${provider === 'github' ? '/icons/github-white.svg' : '/icons/google-color.png'}" width="22" height="22" alt="" aria-hidden="true">${label}</button>`
}
const social = signup => `<div class="auth-divider">${signup ? 'ou' : 'ou continue com'}</div><div class="auth-providers">${SocialButton('google', signup)}${SocialButton('github', signup)}</div>`
export function AuthLayout() {
  return `<aside class="auth-right" aria-label="Seu portfólio de forma descomplicada"><div class="auth-story"><h2>Seu portfólio<br>de forma<br>descomplicada.</h2><div class="auth-integrations" aria-label="GitHub e Kaptei"><span class="auth-integration-github"><img src="/folio/auth-github-mark.png" alt="GitHub" width="72" height="72"></span><span class="auth-integration-k"><img src="/kaptei/kaptei-logo.png" alt="Kaptei" width="96" height="96"></span></div></div></aside>
  <section class="auth-left"><div class="auth-form-wrap"><a class="auth-brand" href="/" aria-label="Devifolio, início">${Logo()}</a>
  <div class="auth-panel" id="panel-login" aria-labelledby="login-title"><h1 id="login-title">Entrar</h1><p class="auth-sub">Entre com seus dados para acessar sua conta.</p><form id="form-login">
  ${AuthInput('login-email', 'E-mail', { type: 'email', autocomplete: 'email', maxlength: '254', placeholder: 'voce@email.com' })}
  ${AuthInput('login-senha', 'Senha', { type: 'password', autocomplete: 'current-password', placeholder: '••••••••' })}
  <div class="auth-row-between"><label class="auth-checkbox"><input type="checkbox" id="login-remember" checked><span>Lembrar de mim</span></label><a class="auth-forgot" href="#recuperar">Esqueci a senha</a></div>${AuthButton('Entrar')}</form>${social(false)}<p class="auth-switch">Novo por aqui? <a href="#cadastro" data-switch="cadastro">Criar conta</a></p></div>
  <div class="auth-panel" id="panel-cadastro" hidden aria-labelledby="cadastro-title"><h1 id="cadastro-title">Criar sua conta</h1><p class="auth-sub">Comece agora e tenha seu portfólio online em poucos minutos.</p><form id="form-cadastro">
  ${AuthInput('cad-nome', 'Nome completo', { autocomplete: 'name', minlength: '2', maxlength: '100', placeholder: 'Digite seu nome completo' })}
  ${AuthInput('cad-email', 'E-mail', { type: 'email', autocomplete: 'email', maxlength: '254', placeholder: 'Digite seu e-mail' })}
  ${AuthInput('cad-senha', 'Senha', { type: 'password', autocomplete: 'new-password', minlength: '8', maxlength: '128', placeholder: 'Crie uma senha' })}
  ${AuthInput('cad-confirmar-senha', 'Confirmar senha', { type: 'password', autocomplete: 'new-password', minlength: '8', maxlength: '128', placeholder: 'Confirme sua senha' })}
  <label class="auth-checkbox auth-terms"><input type="checkbox" id="cad-termos" required><span>Eu concordo com os <a href="/termos.html" target="_blank" rel="noopener">Termos de Uso</a> e a <a href="/privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a></span></label>${AuthButton('Criar conta')}</form>${social(true)}<p class="auth-switch">Já tem uma conta? <a href="#login" data-switch="login">Entrar</a></p></div>
  <div class="auth-panel" id="panel-recuperar" hidden aria-labelledby="recovery-title"><h1 id="recovery-title">Recuperar acesso</h1><p class="auth-sub">Receba as instruções no e-mail da sua conta.</p><form id="form-recuperar">${AuthInput('recovery-email', 'E-mail', { type: 'email', autocomplete: 'email' })}${AuthButton('Enviar instruções')}</form><button class="secondary-button auth-resend" type="button" data-resend hidden>Reenviar instruções</button><p class="auth-switch"><a href="#login" data-switch="login">Voltar para o login</a></p></div>
  <div class="auth-panel" id="panel-redefinir" hidden aria-labelledby="reset-title"><h1 id="reset-title">Defina uma nova senha</h1><p class="auth-sub">Use pelo menos 8 caracteres.</p><form id="form-redefinir">${AuthInput('reset-password', 'Nova senha', { type: 'password', autocomplete: 'new-password', minlength: '8' })}${AuthInput('reset-confirm', 'Confirmar nova senha', { type: 'password', autocomplete: 'new-password', minlength: '8' })}${AuthButton('Salvar nova senha')}</form><p class="auth-switch"><a href="#recuperar" data-switch="recuperar">Solicitar outro link</a></p></div>
  </div></section>`
}
