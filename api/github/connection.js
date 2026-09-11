import { deleteGithubConnection, errorResponse, getGithubConnection, json, methodNotAllowed, parseBearer, verifySupabaseUser } from '../../server/github-oauth.js'

export default async function handler(req, res) {
  if (!['GET', 'DELETE'].includes(req.method)) return methodNotAllowed(res, 'GET, DELETE')
  try {
    const accessToken = parseBearer(req)
    const user = await verifySupabaseUser(accessToken)
    if (req.method === 'GET') {
      const connection = await getGithubConnection(accessToken, user.id)
      return json(res, 200, { connected: Boolean(connection), connection })
    }
    await deleteGithubConnection(accessToken)
    return json(res, 200, { disconnected: true })
  } catch (error) {
    return errorResponse(res, error)
  }
}
