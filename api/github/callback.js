import { errorResponse, exchangeGithubCode, githubApi, githubConfig, oauthCookieHeader, oauthCookieValue, readOauthCookie, saveGithubConnection, verifySupabaseUser } from '../../server/github-oauth.js'

const dashboardUrl = status => {
  const origin = new URL(githubConfig().callbackUrl).origin
  return `${origin}/dashboard.html?github=${encodeURIComponent(status)}#github`
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return errorResponse(res, Object.assign(new Error('Método não permitido.'), { statusCode: 405 }))
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Set-Cookie', oauthCookieHeader('', 0))
  try {
    if (req.query?.error) return res.redirect(302, dashboardUrl(req.query.error))
    const code = String(req.query?.code || '')
    const state = String(req.query?.state || '')
    if (!code || !state) throw Object.assign(new Error('Retorno do GitHub incompleto.'), { statusCode: 400 })
    const savedState = readOauthCookie(decodeURIComponent(oauthCookieValue(req)))
    if (savedState.nonce !== state || savedState.expiresAt < Date.now()) throw Object.assign(new Error('Estado OAuth inválido ou expirado.'), { statusCode: 400 })
    const user = await verifySupabaseUser(savedState.accessToken)
    if (user.id !== savedState.userId) throw Object.assign(new Error('A sessão não pertence ao usuário que iniciou a conexão.'), { statusCode: 403 })
    const token = await exchangeGithubCode(code)
    const githubUser = await githubApi('/user', token)
    await saveGithubConnection(savedState.accessToken, githubUser, token)
    return res.redirect(302, dashboardUrl('connected'))
  } catch (error) {
    console.error('[Devifolio GitHub OAuth callback]', error)
    try { return res.redirect(302, dashboardUrl(error.statusCode === 400 ? 'invalid_state' : 'failed')) } catch { return errorResponse(res, error) }
  }
}

