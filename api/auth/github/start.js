import crypto from 'node:crypto'
import { createLoginStateCookie, errorResponse, githubConfig, secureCookieHeader } from '../../../server/github-oauth.js'

const STATE_COOKIE = 'devifolio_github_login_state'

export default async function handler(req, res) {
  if (req.method !== 'GET') return errorResponse(res, Object.assign(new Error('Método não permitido.'), { statusCode: 405 }))
  try {
    const config = githubConfig()
    const nonce = crypto.randomBytes(24).toString('base64url')
    const referral = String(req.query?.ref || '').trim().toLowerCase().slice(0, 80)
    const stateCookie = createLoginStateCookie({ nonce, referral, expiresAt: Date.now() + 10 * 60 * 1000 })
    const authorizationUrl = new URL('https://github.com/login/oauth/authorize')
    authorizationUrl.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.callbackUrl, state: nonce, prompt: 'select_account' }).toString()
    res.setHeader('Cache-Control', 'no-store')
    // The public callback forwards to /api/github/callback to validate state.
    res.setHeader('Set-Cookie', secureCookieHeader(STATE_COOKIE, encodeURIComponent(stateCookie), '/api/github', 600))
    return res.redirect(302, authorizationUrl.toString())
  } catch (error) {
    return errorResponse(res, error)
  }
}
