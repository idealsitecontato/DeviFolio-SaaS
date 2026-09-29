import assert from 'node:assert/strict'
import test from 'node:test'
import { createAuthStorage } from '../src/lib/auth-storage.js'

function memoryStorage() {
  const data = new Map()
  return { get length() { return data.size }, key: index => [...data.keys()][index] ?? null, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key), clear: () => data.clear() }
}
test('unremembered sessions and PKCE verifier survive reload but not browser-session closure', () => {
  const persistent = memoryStorage(), temporary = memoryStorage()
  const auth = createAuthStorage(persistent, temporary)
  auth.setRememberMe(false)
  auth.storage.setItem('devifolio.supabase.auth', 'session')
  auth.storage.setItem('devifolio.supabase.auth-code-verifier', 'pkce')
  assert.equal(persistent.getItem('devifolio.supabase.auth'), null)
  assert.equal(createAuthStorage(persistent, temporary).storage.getItem('devifolio.supabase.auth'), 'session')
  assert.equal(createAuthStorage(persistent, temporary).storage.getItem('devifolio.supabase.auth-code-verifier'), 'pkce')
  temporary.clear()
  assert.equal(createAuthStorage(persistent, temporary).storage.getItem('devifolio.supabase.auth'), null)
})
test('changing persistence migrates auth keys and logout clears both stores', () => {
  const persistent = memoryStorage(), temporary = memoryStorage()
  const auth = createAuthStorage(persistent, temporary)
  auth.storage.setItem('devifolio.supabase.auth', 'session')
  persistent.setItem('other-product-key', 'preserve')
  auth.setRememberMe(false)
  assert.equal(persistent.getItem('devifolio.supabase.auth'), null)
  assert.equal(temporary.getItem('devifolio.supabase.auth'), 'session')
  auth.setRememberMe(true)
  assert.equal(persistent.getItem('devifolio.supabase.auth'), 'session')
  assert.equal(temporary.getItem('devifolio.supabase.auth'), null)
  auth.storage.removeItem('devifolio.supabase.auth')
  assert.equal(auth.storage.getItem('devifolio.supabase.auth'), null)
  assert.equal(persistent.getItem('other-product-key'), 'preserve')
})
