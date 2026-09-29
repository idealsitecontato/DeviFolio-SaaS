// @ts-check
const preferenceKey = 'foliodev.remember-me'
const authPrefix = 'devifolio.supabase.auth'

/** @param {Storage} persistent @param {Storage} temporary */
export function createAuthStorage(persistent, temporary) {
  const selected = () => persistent.getItem(preferenceKey) === 'false' ? temporary : persistent
  return {
    storage: {
      /** @param {string} key */
      getItem(key) { return selected().getItem(key) },
      /** @param {string} key @param {string} value */
      setItem(key, value) { selected().setItem(key, value) },
      /** @param {string} key */
      removeItem(key) { persistent.removeItem(key); temporary.removeItem(key) },
    },
    /** @param {boolean} remember */
    setRememberMe(remember) {
      const previous = selected()
      const destination = remember ? persistent : temporary
      const keys = Array.from({ length: previous.length }, (_, index) => previous.key(index)).filter(key => key?.startsWith(authPrefix))
      for (const key of keys) {
        if (key === null) continue
        const value = previous.getItem(key)
        if (value !== null) destination.setItem(key, value)
        if (destination !== previous) previous.removeItem(key)
      }
      persistent.setItem(preferenceKey, String(remember))
    },
  }
}
