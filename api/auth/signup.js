import { createClient } from '@supabase/supabase-js'
import { validateSignup } from '../../server/signup-validation.js'
import { json, methodNotAllowed } from '../../server/github-oauth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST')
  const body = req.body || {}
  const validation = validateSignup(body)
  if (validation) return json(res, 422, { error: validation })
  const origin = `${process.env.VERCEL ? 'https' : 'http'}://${req.headers.host}`
  if (req.headers.origin && req.headers.origin !== origin) return json(res, 403, { error: 'Origem de requisição inválida.' })
  try {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await supabase.auth.signUp({
      email: body.email.trim(), password: body.password,
      options: { data: { full_name: body.name.trim(), terms_accepted_at: new Date().toISOString(), terms_version: '2026-09-29' }, emailRedirectTo: `${origin}/dashboard.html?onboarding=1#inicio` },
    })
    if (error) return json(res, error.status === 429 ? 429 : 400, { error: error.status === 429 ? 'Muitas tentativas. Aguarde um pouco e tente novamente.' : 'Não foi possível concluir o cadastro. Confira seus dados ou recupere o acesso.' })
    return json(res, 200, { session: data.session ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token } : null })
  } catch {
    return json(res, 503, { error: 'Não foi possível conectar ao serviço de cadastro. Tente novamente.' })
  }
}
