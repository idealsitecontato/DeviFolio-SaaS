const OUT_MS = 180
const IN_MS = 320
const ROUTE_TOTAL_MS = OUT_MS + IN_MS
const ENTRY_MIN_MS = 2000
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function createBlurTransition({ page = null, shell = null, pageLoading = null, entryLoading = null } = {}) {
  let pageSequence = 0
  let pageTimers = []
  let entrySequence = 0
  let entryTimers = []
  let modalRecord = null

  function phase(element, name) {
    if (!element) return
    if (name === 'idle') delete element.dataset.blurState
    else element.dataset.blurState = name
  }

  function clearTimers(timers) {
    timers.forEach(timer => window.clearTimeout(timer))
    timers.length = 0
  }

  function showLoading(element, label) {
    if (!element) return
    const text = element.querySelector('[data-loading-label]')
    if (text) text.textContent = label
    element.classList.toggle('is-entry', label === 'Carregando seu perfil...')
    element.hidden = false
    element.setAttribute('aria-hidden', 'false')
    void element.offsetWidth
    element.classList.add('is-visible')
  }

  function hideLoading(element) {
    if (!element) return
    element.classList.remove('is-visible')
    element.setAttribute('aria-hidden', 'true')
    window.setTimeout(() => { if (!element.classList.contains('is-visible')) element.hidden = true }, IN_MS)
  }

  function resetPage() {
    pageSequence += 1
    clearTimers(pageTimers)
    phase(page, 'idle')
    if (page) page.inert = false
    page?.removeAttribute('aria-busy')
    hideLoading(pageLoading)
  }

  function navigate(render) {
    resetPage()
    if (!page) { render(); return }
    const sequence = pageSequence
    page.setAttribute('aria-busy', 'true')
    page.inert = true
    showLoading(pageLoading, 'Carregando')
    phase(page, 'blurring-out')
    pageTimers.push(window.setTimeout(() => {
      if (sequence !== pageSequence) return
      phase(page, 'swapping')
      render()
      void page.offsetWidth
      window.requestAnimationFrame(() => {
        if (sequence === pageSequence) phase(page, 'blurring-in')
      })
    }, OUT_MS))
    pageTimers.push(window.setTimeout(() => {
      if (sequence === pageSequence) resetPage()
    }, ROUTE_TOTAL_MS))
  }

  function leaveDashboard(navigateAway) {
    resetPage()
    if (!page) { navigateAway(); return }
    page.inert = true
    page.setAttribute('aria-busy', 'true')
    showLoading(pageLoading, 'Carregando')
    phase(page, 'blurring-out')
    pageTimers.push(window.setTimeout(navigateAway, ROUTE_TOTAL_MS))
  }

  function resetEntry() {
    entrySequence += 1
    clearTimers(entryTimers)
    phase(shell, 'idle')
    if (shell) shell.inert = false
    hideLoading(entryLoading)
  }

  function enterDashboard(render, { enabled = true } = {}) {
    resetEntry()
    if (!shell || !enabled) {
      render()
      return { ready() {}, abort: resetEntry }
    }
    const sequence = entrySequence
    const started = performance.now()
    let released = false
    shell.inert = true
    phase(shell, 'swapping')
    render()
    showLoading(entryLoading, 'Carregando seu perfil...')
    function release() {
      if (released || sequence !== entrySequence) return
      released = true
      phase(shell, 'blurring-in')
      hideLoading(entryLoading)
      entryTimers.push(window.setTimeout(() => {
        if (sequence === entrySequence) resetEntry()
      }, IN_MS))
    }
    return {
      ready() {
        const remaining = Math.max(0, ENTRY_MIN_MS - (performance.now() - started))
        entryTimers.push(window.setTimeout(release, remaining))
      },
      abort: resetEntry,
    }
  }

  function exitAuth(navigateAway) {
    if (!shell || reducedMotion()) { navigateAway(); return }
    resetEntry()
    const sequence = entrySequence
    phase(shell, 'blurring-out')
    entryTimers.push(window.setTimeout(() => {
      if (sequence === entrySequence) navigateAway()
    }, OUT_MS))
    entryTimers.push(window.setTimeout(() => {
      if (sequence === entrySequence) resetEntry()
    }, OUT_MS + SAFETY_EXTRA_MS))
  }

  function modalOpener() {
    return modalRecord?.opener || null
  }

  function openModal(backdrop, { opener = document.activeElement, onDismiss = () => {}, dismissible = true } = {}) {
    if (modalRecord) closeModal({ immediate: true, restoreFocus: false })
    const dialog = backdrop.querySelector('[role="dialog"]')
    const root = backdrop.parentElement
    const previousOverflow = document.body.style.overflow
    const fallback = !CSS.supports('backdrop-filter', 'blur(1px)') && !CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
    const record = { backdrop, dialog, root, opener, previousOverflow, fallback, onDismiss, dismissible, timer: null, keydown: null }
    modalRecord = record
    document.body.style.overflow = 'hidden'
    if (shell) {
      shell.inert = true
      if (fallback) shell.dataset.modalBlurFallback = 'true'
    }
    record.keydown = event => {
      if (event.key === 'Escape' && record.dismissible) {
        event.preventDefault()
        record.onDismiss()
      } else if (event.key === 'Tab') {
        const controls = [...record.dialog.querySelectorAll(FOCUSABLE)].filter(control => control.getClientRects().length)
        if (!controls.length) { event.preventDefault(); record.dialog.focus(); return }
        const first = controls[0], last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', record.keydown, true)
    void backdrop.offsetWidth
    backdrop.classList.add('is-open')
    window.requestAnimationFrame(() => {
      if (modalRecord !== record) return
      dialog.setAttribute('tabindex', '-1')
      ;(dialog.querySelector(FOCUSABLE) || dialog).focus()
    })
  }

  function closeModal({ immediate = false, restoreFocus = true } = {}) {
    const record = modalRecord
    if (!record) return
    if (record.timer) {
      if (!immediate) return
      window.clearTimeout(record.timer)
      record.timer = null
    }
    record.backdrop.classList.remove('is-open')
    record.backdrop.classList.add('is-closing')
    function finish() {
      if (modalRecord !== record) return
      document.removeEventListener('keydown', record.keydown, true)
      document.body.style.overflow = record.previousOverflow
      if (shell) {
        shell.inert = false
        delete shell.dataset.modalBlurFallback
      }
      record.root.innerHTML = ''
      modalRecord = null
      if (restoreFocus && record.opener?.isConnected) record.opener.focus()
    }
    if (immediate || reducedMotion()) finish()
    else record.timer = window.setTimeout(finish, IN_MS)
  }

  return { navigate, leaveDashboard, resetPage, enterDashboard, exitAuth, modalOpener, openModal, closeModal, resetEntry }
}