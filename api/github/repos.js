import { errorResponse, getGithubToken, githubApi, json, methodNotAllowed, parseBearer, refreshGithubToken, saveGithubConnection, verifySupabaseUser } from '../../server/github-oauth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET')
  try {
    const accessToken = parseBearer(req)
    await verifySupabaseUser(accessToken)
    const storedToken = await getGithubToken(accessToken)
    const { token, refreshed } = await refreshGithubToken(storedToken)
    if (refreshed) {
      const githubUser = await githubApi('/user', token)
      await saveGithubConnection(accessToken, githubUser, token)
    }
    const repositories = await githubApi('/user/repos?sort=updated&per_page=100', token)
    return json(res, 200, { repositories: repositories.map(repo => ({ id: repo.id, name: repo.name, full_name: repo.full_name, description: repo.description, language: repo.language, html_url: repo.html_url, homepage: repo.homepage, private: repo.private })) })
  } catch (error) {
    return errorResponse(res, error)
  }
}
