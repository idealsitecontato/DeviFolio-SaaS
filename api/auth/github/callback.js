import { githubConfig } from '../../../server/github-oauth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.statusCode = 405; return res.end('Método não permitido.') }
  // GitHub's public callback endpoint forwards to the internal handler, where
  // the encrypted state cookies are scoped and validated.
  const target = new URL(githubConfig().callbackUrl)
  target.pathname = '/api/github/callback'
  target.search = ''
  for (const [key, value] of Object.entries(req.query || {})) target.searchParams.set(key, String(value))
  return res.redirect(302, target.toString())
}
