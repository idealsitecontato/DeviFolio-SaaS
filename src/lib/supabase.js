import { createClient } from '@supabase/supabase-js'

const runtimeEnv = import.meta.env || {}
const supabaseUrl = runtimeEnv.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = runtimeEnv.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

if (!supabaseUrl || !supabasePublishableKey) {
  const error = new Error('As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não foram configuradas neste ambiente.')
  error.code = 'supabase_configuration_missing'
  throw error
}

try {
  const parsedUrl = new URL(supabaseUrl)
  if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname.endsWith('.supabase.co')) throw new Error()
} catch {
  const error = new Error('A variável VITE_SUPABASE_URL não contém uma URL válida do Supabase.')
  error.code = 'supabase_configuration_invalid'
  throw error
}

if (!supabasePublishableKey.startsWith('sb_publishable_')) {
  const error = new Error('A variável VITE_SUPABASE_PUBLISHABLE_KEY não contém uma publishable key válida.')
  error.code = 'supabase_configuration_invalid'
  throw error
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'devifolio.supabase.auth',
  },
})
