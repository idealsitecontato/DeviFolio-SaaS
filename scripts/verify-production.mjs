import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { loadEnv } from 'vite'

const base = 'https://devi-folio-saa-s.vercel.app'
const expectedSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const versionResponse = await fetch(`${base}/version.json?verify=${Date.now()}`, { cache: 'no-store' })
assert.equal(versionResponse.status, 200)
const version = await versionResponse.json()
assert.equal(version.sha, expectedSha, 'Production must publish the current commit')
const html = await (await fetch(base, { cache: 'no-store' })).text()
assert.ok(html.includes(`content="${expectedSha}"`), 'HTML build-sha must match')
assert.ok(html.includes('Seu projeto,') && html.includes('/hero/mulher-portfolio-'), 'Production must render the new Hero')

const github = await fetch(`${base}/api/auth/github/start`, { redirect: 'manual' })
assert.equal(github.status, 302)
const authorization = new URL(github.headers.get('location'))
assert.equal(authorization.origin, 'https://github.com')
assert.equal(authorization.searchParams.get('redirect_uri'), `${base}/api/auth/github/callback`)
assert.equal(authorization.searchParams.get('scope'), 'read:user user:email')
const cookie = github.headers.get('set-cookie')
assert.ok(cookie.includes('HttpOnly') && cookie.includes('Secure') && cookie.includes('SameSite=Lax'))

const invalidSignup = await fetch(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ name: '', email: 'invalid', password: '', terms: false }) })
assert.equal(invalidSignup.status, 422)
const wrongMethod = await fetch(`${base}/api/auth/signup`)
assert.equal(wrongMethod.status, 405)
const blockedOrigin = await fetch(`${base}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://example.org' }, body: JSON.stringify({ name: 'Validation only', email: 'validation@example.com', password: 'Validation2026', confirmation: 'Validation2026', terms: true }) })
assert.equal(blockedOrigin.status, 403)

const env = loadEnv('production', process.cwd(), 'VITE_')
const settingsResponse = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY } })
assert.equal(settingsResponse.status, 200)
const settings = await settingsResponse.json()
const evidence = {
  checkedAt: new Date().toISOString(), base, expectedSha, publishedSha: version.sha,
  versionStatus: versionResponse.status, cacheControl: versionResponse.headers.get('cache-control'), htmlShaMatches: true,
  github: { status: github.status, authorizationHost: authorization.hostname, callback: authorization.searchParams.get('redirect_uri'), verifiedEmailScope: true, secureCookieFlags: true },
  signup: { invalidInputStatus: invalidSignup.status, unsupportedMethodStatus: wrongMethod.status, blockedOriginStatus: blockedOrigin.status, createdAccounts: 0 },
  authSettings: { supabaseUrl: env.VITE_SUPABASE_URL, emailEnabled: settings.external?.email, googleEnabled: settings.external?.google, signupDisabled: settings.disable_signup, emailAutoConfirm: settings.mailer_autoconfirm },
}
if (!process.argv.includes('--no-save')) await writeFile('docs/publicacao-final.json', JSON.stringify(evidence, null, 2))
console.log(JSON.stringify(evidence, null, 2))
