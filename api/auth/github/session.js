import { cookieValue, errorResponse, json, readLoginSessionCookie, secureCookieHeader } from '../../../server/github-oauth.js'
import { exchangeSupabaseLoginTicket } from '../../../server/github-login.js'

const SESSION_COOKIE = 'devifolio_github_login_session'

export default async function handler(req, res) {
  if (req.method !== 'POST') return errorResponse(res, Object.assign(new Error('Método não permitido.'), { statusCode: 405 }))
  res.setHeader('Set-Cookie', secureCookieHeader(SESSION_COOKIE, '', '/api/auth/github/session', 0, 'Strict'))
  try {
    const ticket = readLoginSessionCookie(cookieValue(req, SESSION_COOKIE))
    if (!ticket.tokenHash || ticket.expiresAt < Date.now()) throw Object.assign(new Error('O login com GitHub expirou. Tente novamente.'), { statusCode: 401 })
    const session = await exchangeSupabaseLoginTicket(ticket.tokenHash)
    return json(res, 200, { access_token: session.access_token, refresh_token: session.refresh_token })
  } catch (error) {
    return errorResponse(res, error)
  }
}
