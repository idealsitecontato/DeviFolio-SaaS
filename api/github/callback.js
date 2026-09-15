import { cookieValue, createLoginSessionCookie, errorResponse, exchangeGithubCode, githubApi, githubConfig, oauthCookieHeader, oauthCookieValue, readLoginStateCookie, readOauthCookie, saveGithubConnection, secureCookieHeader, verifySupabaseUser } from '../../server/github-oauth.js'
import { createSupabaseLoginTicket } from '../../server/github-login.js'

const LOGIN_STATE_COOKIE = 'devifolio_github_login_state'
const LOGIN_SESSION_COOKIE = 'devifolio_github_login_session'

const dashboardUrl = status => {
  const origin = new URL(githubConfig().callbackUrl).origin
  return `${origin}/dashboard.html?github=${encodeURIComponent(status)}#github`
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return errorResponse(res, Object.assign(new Error('Método não permitido.'), { statusCode: 405 }))
  res.setHeader('Cache-Control', 'no-store')
  try {
    const code = String(req.query?.code || '')
    const state = String(req.query?.state || '')
    const connectionState = readState(() => readOauthCookie(decodeURIComponent(oauthCookieValue(req))))
    const loginState = readState(() => readLoginStateCookie(cookieValue(req, LOGIN_STATE_COOKIE)))
    const isLogin = loginState?.nonce === state
    const isConnection = connectionState?.nonce === state

    if (isLogin) {
      res.setHeader('Set-Cookie', clearLoginStateCookies())
      if (req.query?.error) return res.redirect(302, authPageUrl(req.query.error, loginState.referral))
      if (!code || loginState.expiresAt < Date.now()) throw Object.assign(new Error('Estado OAuth inválido ou expirado.'), { statusCode: 400 })
      const token = await exchangeGithubCode(code)
      const githubUser = await githubApi('/user', token)
      const loginTicket = await createSupabaseLoginTicket(githubUser, token)
      const sessionCookie = createLoginSessionCookie({ ...loginTicket, expiresAt: Date.now() + 2 * 60 * 1000 })
      res.setHeader('Set-Cookie', [
        ...clearLoginStateCookies(),
        secureCookieHeader(LOGIN_SESSION_COOKIE, encodeURIComponent(sessionCookie), '/api/auth/github/session', 120, 'Strict'),
      ])
      return res.redirect(302, authPageUrl('complete', loginState.referral))
    }

    res.setHeader('Set-Cookie', oauthCookieHeader('', 0))
    if (req.query?.error) return res.redirect(302, dashboardUrl(req.query.error))
    if (!code || !isConnection || connectionState.expiresAt < Date.now()) throw Object.assign(new Error('Estado OAuth inválido ou expirado.'), { statusCode: 400 })
    const user = await verifySupabaseUser(connectionState.accessToken)
    if (user.id !== connectionState.userId) throw Object.assign(new Error('A sessão não pertence ao usuário que iniciou a conexão.'), { statusCode: 403 })
    const token = await exchangeGithubCode(code)
    const githubUser = await githubApi('/user', token)
    await saveGithubConnection(connectionState.accessToken, githubUser, token)
    return res.redirect(302, dashboardUrl('connected'))
  } catch (error) {
    console.error('[Devifolio GitHub OAuth callback]', error)
    const isLoginRequest = Boolean(readState(() => readLoginStateCookie(cookieValue(req, LOGIN_STATE_COOKIE)))?.nonce === String(req.query?.state || ''))
    try {
      return res.redirect(302, isLoginRequest ? authPageUrl(error.statusCode === 400 ? 'invalid_state' : 'failed') : dashboardUrl(error.statusCode === 400 ? 'invalid_state' : 'failed'))
    } catch { return errorResponse(res, error) }
  }
}

function readState(read) {
  try { return read() } catch { return null }
}

function clearLoginStateCookies() {
  return [
    oauthCookieHeader('', 0),
    secureCookieHeader(LOGIN_STATE_COOKIE, '', '/api/github', 0),
  ]
}

function authPageUrl(status, referral = '') {
  const origin = new URL(githubConfig().callbackUrl).origin
  const query = new URLSearchParams({ github_login: status })
  if (referral) query.set('ref', referral)
  return `${origin}/cadastro.html?${query}#login`
}
