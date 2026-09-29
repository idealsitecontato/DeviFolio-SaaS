import test from 'node:test'
import assert from 'node:assert/strict'
import { validateSignup } from '../server/signup-validation.js'

const valid = { name: 'Pessoa Teste', email: 'pessoa@example.com', password: 'Projeto2026', confirmation: 'Projeto2026', terms: true }
test('server rejects absent terms, invalid identity and mismatched or weak passwords', () => {
  assert.equal(validateSignup(valid), '')
  for (const patch of [{ terms: false }, { terms: 'true' }, { email: 'invalid' }, { name: '' }, { password: 'abcdefgh', confirmation: 'abcdefgh' }, { password: '12345678', confirmation: '12345678' }, { confirmation: 'different' }, { password: 'a1' }, { password: 'a1'.repeat(100) }]) {
    assert.notEqual(validateSignup({ ...valid, ...patch }), '')
  }
})
