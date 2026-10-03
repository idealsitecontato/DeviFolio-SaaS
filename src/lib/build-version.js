const versionEndpoint = '/version.json'
const buildQueryParameter = '_folio_build'
const reloadMarker = 'foliodev_build_reload'

function currentBuildSha() {
  return document.querySelector('meta[name="build-sha"]')?.content?.trim() || ''
}

function cleanVersionParameter() {
  const url = new URL(location.href)
  if (!url.searchParams.has(buildQueryParameter)) return
  url.searchParams.delete(buildQueryParameter)
  history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

export async function checkForNewBuild() {
  const currentSha = currentBuildSha()
  if (!currentSha) return false

  try {
    const response = await fetch(`${versionEndpoint}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
    if (!response.ok) return false

    const latestSha = String((await response.json()).sha || '').trim()
    if (!latestSha || latestSha === currentSha) {
      sessionStorage.removeItem(reloadMarker)
      cleanVersionParameter()
      return false
    }

    if (sessionStorage.getItem(reloadMarker) === latestSha) return false
    sessionStorage.setItem(reloadMarker, latestSha)
    const url = new URL(location.href)
    url.searchParams.set(buildQueryParameter, latestSha.slice(0, 12))
    location.replace(url.toString())
    return true
  } catch {
    return false
  }
}

export function startBuildVersionGuard() {
  void checkForNewBuild()
  window.addEventListener('focus', checkForNewBuild)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkForNewBuild()
  })
  window.setInterval(checkForNewBuild, 60_000)
}

startBuildVersionGuard()
