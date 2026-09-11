import { supabase } from './supabase.js'

const isMissingSchema = error => error?.code === '42P01' || error?.code === 'PGRST205'

export async function loadWorkspace(userId) {
  const [profileResult, projectsResult, settingsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('projects').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const errors = [profileResult.error, projectsResult.error, settingsResult.error].filter(Boolean)
  if (errors.some(isMissingSchema)) return { available: false }
  if (errors.length) throw errors[0]

  return {
    available: true,
    profile: profileResult.data,
    projects: projectsResult.data || [],
    settings: settingsResult.data,
  }
}

export async function saveProfile(userId, profile, published) {
  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    name: profile.name,
    username: profile.username,
    email: profile.email,
    role: profile.role,
    bio: profile.bio,
    skills: profile.skills,
    linkedin: profile.linkedin,
    github: profile.github,
    website: profile.website,
    published,
  }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function saveProject(userId, project, sortOrder = 0) {
  const { data, error } = await supabase.from('projects').upsert({
    id: project.id,
    user_id: userId,
    name: project.name,
    description: project.description,
    tech: project.tech,
    link: project.link || null,
    github: project.github || null,
    status: project.status,
    sort_order: sortOrder,
  }).select().single()
  if (error) throw error
  return data
}

export async function removeProject(userId, projectId) {
  const { error } = await supabase.from('projects').delete().eq('id', projectId).eq('user_id', userId)
  if (error) throw error
}

export async function saveSettings(userId, settings) {
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    email_notifications: settings.email,
    product_notifications: settings.product,
    public_profile: settings.publicProfile,
    compact_mode: settings.compact,
    theme: settings.theme,
  }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function syncWorkspace(userId, state) {
  await Promise.all([
    saveProfile(userId, state.profile, state.published),
    saveSettings(userId, state.settings),
  ])

  if (state.projects.length) {
    const rows = state.projects.map((project, index) => ({
      id: project.id,
      user_id: userId,
      name: project.name,
      description: project.description,
      tech: project.tech,
      link: project.link || null,
      github: project.github || null,
      status: project.status,
      sort_order: index,
    }))
    const { error: upsertError } = await supabase.from('projects').upsert(rows)
    if (upsertError) throw upsertError

    const ids = rows.map(row => row.id).join(',')
    const { error: pruneError } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', userId)
      .not('id', 'in', `(${ids})`)
    if (pruneError) throw pruneError
  } else {
    const { error } = await supabase.from('projects').delete().eq('user_id', userId)
    if (error) throw error
  }
}
