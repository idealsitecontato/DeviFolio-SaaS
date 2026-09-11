import crypto from 'node:crypto'
import { createOauthCookie, errorResponse, githubConfig, json, methodNotAllowed, oauthCookieHeader, parseBearer, verifySupabaseUser } from '../../server/github-oauth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST')
  try {
    const accessToken = parseBearer(req)
    const user = await verifySupabaseUser(accessToken)
    const config = githubConfig()
    const nonce = crypto.randomBytes(24).toString('base64url')
    const cookie = createOauthCookie({ nonce, userId: user.id, accessToken, expiresAt: Date.now() + 10 * 60 * 1000 })
    const authorizationUrl = new URL('https://github.com/login/oauth/authorize')
    authorizationUrl.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.callbackUrl, state: nonce }).toString()
    res.setHeader('Set-Cookie', oauthCookieHeader(encodeURIComponent(cookie)))
    return json(res, 200, { authorizationUrl: authorizationUrl.toString() })
  } catch (error) {
    return errorResponse(res, error)
  }
}
