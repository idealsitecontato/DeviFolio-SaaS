import { deleteGithubConnection, errorResponse, json, methodNotAllowed, parseBearer, verifySupabaseUser } from '../../server/github-oauth.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return methodNotAllowed(res, 'DELETE')
  try {
    const accessToken = parseBearer(req)
    await verifySupabaseUser(accessToken)
    await deleteGithubConnection(accessToken)
    return json(res, 200, { disconnected: true })
  } catch (error) {
    return errorResponse(res, error)
  }
}
