import crypto from 'node:crypto'

const COOKIE_NAME = 'devifolio_github_oauth'
const API_VERSION = '2022-11-28'

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Configuração obrigatória ausente: ${name}`)
  return value
}

export function githubConfig() {
  return {
    clientId: required('GITHUB_CLIENT_ID'),
    clientSecret: required('GITHUB_CLIENT_SECRET'),
    stateSecret: required('GITHUB_OAUTH_STATE_SECRET'),
    callbackUrl: required('GITHUB_CALLBACK_URL'),
  }
}

function supabaseConfig() {
  return {
    url: required('VITE_SUPABASE_URL').replace(/\/$/, ''),
    key: required('VITE_SUPABASE_PUBLISHABLE_KEY'),
  }
}

function encryptionKey(purpose) {
  return crypto.createHash('sha256').update(`${purpose}:${githubConfig().stateSecret}`).digest()
}

function encrypt(value, purpose) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(purpose), iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString('base64url')).join('.')
}

function decrypt(value, purpose) {
  const parts = String(value || '').split('.')
  if (parts.length !== 3) throw new Error('Payload criptografado inválido.')
  const [iv, tag, encrypted] = parts.map(part => Buffer.from(part, 'base64url'))
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(purpose), iv)
  decipher.setAuthTag(tag)
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'))
}

export const encryptGithubToken = token => encrypt(token, 'github-token')
export const decryptGithubToken = token => decrypt(token, 'github-token')
export const createOauthCookie = payload => encrypt(payload, 'github-oauth-state')
export const readOauthCookie = payload => decrypt(payload, 'github-oauth-state')

export function parseBearer(req) {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)
  if (!match) throw Object.assign(new Error('Sessão do Devifolio não encontrada.'), { statusCode: 401 })
  return match[1]
}

export async function verifySupabaseUser(accessToken) {
  const config = supabaseConfig()
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.key, Authorization: `Bearer ${accessToken}` },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.id) throw Object.assign(new Error('A sessão do Devifolio expirou. Entre novamente.'), { statusCode: 401 })
  return data
}

async function supabaseRpc(name, accessToken, body = {}) {
  const config = supabaseConfig()
  const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) throw Object.assign(new Error(data?.message || 'O Supabase recusou a operação.'), { statusCode: response.status })
  return data
}

export async function getGithubConnection(accessToken, userId) {
  const config = supabaseConfig()
  const query = new URLSearchParams({
    select: 'github_user_id,github_username,avatar_url,connected_at,updated_at',
    user_id: `eq.${userId}`,
    limit: '1',
  })
  const response = await fetch(`${config.url}/rest/v1/github_connections?${query}`, {
    headers: { apikey: config.key, Authorization: `Bearer ${accessToken}` },
  })
  const data = await response.json().catch(() => [])
  if (!response.ok) throw Object.assign(new Error(data?.message || 'Não foi possível consultar a conexão com o GitHub.'), { statusCode: response.status })
  return data[0] || null
}

export const saveGithubConnection = (accessToken, githubUser, token) => supabaseRpc('save_github_connection', accessToken, {
  p_github_user_id: String(githubUser.id),
  p_github_username: githubUser.login,
  p_avatar_url: githubUser.avatar_url || '',
  p_token_ciphertext: encryptGithubToken(token),
})

export const getGithubToken = async accessToken => {
  const data = await supabaseRpc('get_my_github_token', accessToken)
  const ciphertext = Array.isArray(data) ? data[0]?.token_ciphertext : data
  if (!ciphertext) throw Object.assign(new Error('Conta do GitHub não conectada.'), { statusCode: 404 })
  return decryptGithubToken(ciphertext)
}

export const deleteGithubConnection = accessToken => supabaseRpc('delete_my_github_connection', accessToken)

export async function exchangeGithubCode(code) {
  const config = githubConfig()
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: config.callbackUrl }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.error || !data.access_token) throw new Error(data.error_description || 'O GitHub não forneceu um token de acesso.')
  return normalizeGithubToken(data)
}

function normalizeGithubToken(data) {
  const obtainedAt = Date.now()
  return {
    ...data,
    obtained_at: obtainedAt,
    expires_at: data.expires_in ? obtainedAt + (Number(data.expires_in) * 1000) : null,
    refresh_token_expires_at: data.refresh_token_expires_in ? obtainedAt + (Number(data.refresh_token_expires_in) * 1000) : null,
  }
}

export async function refreshGithubToken(token) {
  if (!token.expires_at || token.expires_at > Date.now() + 60_000) return { token, refreshed: false }
  if (!token.refresh_token || (token.refresh_token_expires_at && token.refresh_token_expires_at <= Date.now())) {
    throw Object.assign(new Error('A autorização do GitHub expirou. Conecte a conta novamente.'), { statusCode: 401 })
  }
  const config = githubConfig()
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, grant_type: 'refresh_token', refresh_token: token.refresh_token }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.error || !data.access_token) throw Object.assign(new Error(data.error_description || 'Não foi possível renovar a autorização do GitHub.'), { statusCode: 401 })
  return { token: normalizeGithubToken(data), refreshed: true }
}

export async function githubApi(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION,
      'User-Agent': 'Devifolio-SaaS',
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw Object.assign(new Error(data.message || `GitHub respondeu com ${response.status}.`), { statusCode: response.status })
  return data
}

export function oauthCookieHeader(value, maxAge = 600) {
  return `${COOKIE_NAME}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/api/github; Max-Age=${maxAge}`
}

export function oauthCookieValue(req) {
  const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map(item => item.trim().split('=').map(decodeURIComponent)).filter(parts => parts.length === 2))
  return cookies[COOKIE_NAME] || ''
}

export function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed)
  return json(res, 405, { error: 'Método não permitido.' })
}

export function errorResponse(res, error) {
  console.error('[Devifolio GitHub OAuth]', error)
  return json(res, error.statusCode || 500, { error: error.statusCode ? error.message : 'Não foi possível concluir a integração com o GitHub.' })
}
