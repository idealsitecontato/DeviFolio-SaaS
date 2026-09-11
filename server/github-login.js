import { createClient } from '@supabase/supabase-js'
import { githubApi } from './github-oauth.js'

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Configuração obrigatória ausente: ${name}`)
  return value
}

function clients() {
  const url = required('VITE_SUPABASE_URL').replace(/\/$/, '')
  const publishableKey = required('VITE_SUPABASE_PUBLISHABLE_KEY')
  const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY')
  return {
    admin: createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } }),
    publicAuth: createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } }),
  }
}

export async function verifiedGithubEmail(githubUser, token) {
  if (githubUser.email) return String(githubUser.email).trim().toLowerCase()
  const emails = await githubApi('/user/emails', token)
  const selected = emails.find(item => item.primary && item.verified) || emails.find(item => item.verified)
  if (!selected?.email) {
    throw Object.assign(new Error('Sua conta GitHub precisa ter um e-mail verificado para entrar no Devifolio.'), { statusCode: 422 })
  }
  return String(selected.email).trim().toLowerCase()
}

async function findAuthUserId(admin, email) {
  const { data, error } = await admin.rpc('find_auth_user_by_email', { p_email: email })
  if (error) throw error
  return data || null
}

async function resolveAuthUser(admin, githubUser, email) {
  const githubId = String(githubUser.id)
  const { data: identity, error: identityError } = await admin
    .from('github_login_identities')
    .select('user_id')
    .eq('github_user_id', githubId)
    .maybeSingle()
  if (identityError) throw identityError

  let userId = identity?.user_id || await findAuthUserId(admin, email)
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: githubUser.name || githubUser.login,
        avatar_url: githubUser.avatar_url || '',
        github_login: githubUser.login,
      },
    })
    if (error) {
      userId = await findAuthUserId(admin, email)
      if (!userId) throw error
    } else {
      userId = data.user.id
    }
  }

  const { error: mappingError } = await admin.from('github_login_identities').upsert({
    github_user_id: githubId,
    user_id: userId,
    github_username: githubUser.login,
    email,
    avatar_url: githubUser.avatar_url || '',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'github_user_id' })
  if (mappingError) throw mappingError
  return userId
}

export async function createSupabaseLoginTicket(githubUser, token) {
  const { admin } = clients()
  const email = await verifiedGithubEmail(githubUser, token)
  const userId = await resolveAuthUser(admin, githubUser, email)
  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(userId)
  if (userError || !userResult.user) throw userError || new Error('Usuário Supabase não encontrado.')

  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: userResult.user.email })
  if (error || !data.properties?.hashed_token) throw error || new Error('O Supabase não gerou o ticket de sessão.')
  return { tokenHash: data.properties.hashed_token, userId }
}

export async function exchangeSupabaseLoginTicket(tokenHash) {
  const { publicAuth } = clients()
  const { data, error } = await publicAuth.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash })
  if (error || !data.session) throw error || new Error('O ticket de login não gerou uma sessão.')
  return data.session
}

