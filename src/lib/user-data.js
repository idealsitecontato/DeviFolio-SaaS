import { supabase } from './supabase.js'

const isMissingSchema = error => error?.code === '42P01' || error?.code === '42703' || error?.code === 'PGRST204' || error?.code === 'PGRST205'

const mapProfile = row => row ? {
  name: row.name || '',
  username: row.username || '',
  email: row.email || '',
  role: row.role || '',
  bio: row.bio || '',
  skills: row.skills || '',
  linkedin: row.linkedin || '',
  github: row.github || '',
  website: row.website || '',
  avatar: row.avatar_url || '',
  published: Boolean(row.published),
  userId: row.user_id,
} : null

const mapProject = row => ({
  id: Number(row.id),
  name: row.name || '',
  description: row.description || '',
  tech: row.tech || '',
  link: row.link || '',
  github: row.github || '',
  image: row.image_url || '',
  status: row.status || 'draft',
})

function throwFirstUnexpected(results) {
  const errors = results.map(result => result.error).filter(Boolean)
  if (errors.some(isMissingSchema)) return false
  if (errors.length) throw errors[0]
  return true
}

export async function loadWorkspace(userId) {
  const results = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('projects').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('analytics_events').select('event_type,project_id,visitor_id,occurred_at').eq('user_id', userId).order('occurred_at', { ascending: true }),
    supabase.from('referrals').select('id,referred_email,status,created_at').eq('user_id', userId).order('created_at', { ascending: false }),
  ])

  if (!throwFirstUnexpected(results)) return { available: false }
  const [profileResult, projectsResult, settingsResult, analyticsResult, referralsResult] = results
  return {
    available: true,
    profile: mapProfile(profileResult.data),
    projects: (projectsResult.data || []).map(mapProject),
    settings: settingsResult.data,
    analytics: analyticsResult.data || [],
    referrals: referralsResult.data || [],
  }
}

export async function saveProfile(userId, profile, published) {
  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    name: profile.name || '',
    username: profile.username,
    email: profile.email || '',
    role: profile.role || '',
    bio: profile.bio || '',
    skills: profile.skills || '',
    linkedin: profile.linkedin || '',
    github: profile.github || '',
    website: profile.website || '',
    avatar_url: profile.avatar || '',
    published: Boolean(published),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function saveProject(userId, project, sortOrder = 0) {
  const { data, error } = await supabase.from('projects').upsert({
    id: project.id,
    user_id: userId,
    name: project.name,
    description: project.description || '',
    tech: project.tech || '',
    link: project.link || null,
    github: project.github || null,
    image_url: project.image || null,
    status: project.status || 'draft',
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  }).select().single()
  if (error) throw error
  return mapProject(data)
}

export async function removeProject(userId, projectId) {
  const { error } = await supabase.from('projects').delete().eq('id', projectId).eq('user_id', userId)
  if (error) throw error
}

export async function saveSettings(userId, settings) {
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    email_notifications: Boolean(settings.email),
    product_notifications: Boolean(settings.product),
    public_profile: Boolean(settings.publicProfile),
    compact_mode: Boolean(settings.compact),
    theme: settings.theme === 'dark' ? 'dark' : 'light',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function uploadAvatar(userId, file) {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${userId}/avatar.${extension}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

export async function loadPublicPortfolio(username) {
  const normalized = String(username || '').trim().toLowerCase()
  if (!normalized) return null
  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('user_id,name,username,role,bio,skills,linkedin,github,website,avatar_url,published')
    .eq('username', normalized)
    .eq('published', true)
    .maybeSingle()
  if (profileError) throw profileError
  if (!profileRow) return null
  const { data: projectRows, error: projectsError } = await supabase
    .from('projects')
    .select('id,name,description,tech,link,github,image_url,status,sort_order')
    .eq('user_id', profileRow.user_id)
    .eq('status', 'published')
    .order('sort_order')
  if (projectsError) throw projectsError
  return { profile: mapProfile(profileRow), projects: (projectRows || []).map(mapProject) }
}

export async function trackPublicEvent(userId, eventType, projectId = null, visitorId = '') {
  const { error } = await supabase.from('analytics_events').insert({
    user_id: userId,
    project_id: projectId,
    event_type: eventType,
    visitor_id: visitorId || null,
  })
  if (error) console.warn('[Devifolio] Métrica não registrada', error)
}

export async function deleteCurrentAccount() {
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
}

export async function registerReferral(username) {
  if (!username) return
  const { error } = await supabase.rpc('register_referral', { inviter_username: username })
  if (error) console.warn('[Devifolio] Indicação não registrada', error)
}
