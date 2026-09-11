import { cookieValue, createLoginSessionCookie, exchangeGithubCode, githubApi, githubLoginConfig, readLoginStateCookie, secureCookieHeader } from '../../../server/github-oauth.js'
import { createSupabaseLoginTicket } from '../../../server/github-login.js'

const STATE_COOKIE = 'devifolio_github_login_state'
const SESSION_COOKIE = 'devifolio_github_login_session'

const authPageUrl = (status, referral = '') => {
  const origin = new URL(githubLoginConfig().callbackUrl).origin
  const query = new URLSearchParams({ github_login: status })
  if (referral) query.set('ref', referral)
  return `${origin}/cadastro.html?${query}#login`
}

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.statusCode = 405; return res.end('Método não permitido.') }
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Set-Cookie', secureCookieHeader(STATE_COOKIE, '', '/api/auth/github', 0))
  try {
    if (req.query?.error) return res.redirect(302, authPageUrl(req.query.error))
    const code = String(req.query?.code || '')
    const state = String(req.query?.state || '')
    if (!code || !state) throw Object.assign(new Error('Retorno do GitHub incompleto.'), { statusCode: 400 })
    const savedState = readLoginStateCookie(cookieValue(req, STATE_COOKIE))
    if (savedState.nonce !== state || savedState.expiresAt < Date.now()) throw Object.assign(new Error('Estado OAuth inválido ou expirado.'), { statusCode: 400 })

    const config = githubLoginConfig()
    const githubToken = await exchangeGithubCode(code, config.callbackUrl)
    const githubUser = await githubApi('/user', githubToken)
    const loginTicket = await createSupabaseLoginTicket(githubUser, githubToken)
    const sessionCookie = createLoginSessionCookie({ ...loginTicket, expiresAt: Date.now() + 2 * 60 * 1000 })
    res.setHeader('Set-Cookie', [
      secureCookieHeader(STATE_COOKIE, '', '/api/auth/github', 0),
      secureCookieHeader(SESSION_COOKIE, encodeURIComponent(sessionCookie), '/api/auth/github/session', 120, 'Strict'),
    ])
    return res.redirect(302, authPageUrl('complete', savedState.referral))
  } catch (error) {
    console.error('[Devifolio GitHub Login callback]', error)
    try { return res.redirect(302, authPageUrl(error.statusCode === 400 ? 'invalid_state' : 'failed')) } catch { res.statusCode = 500; return res.end('Falha no login com GitHub.') }
  }
}

