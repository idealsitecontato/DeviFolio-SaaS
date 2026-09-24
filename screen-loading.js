const ROUTE_MS = 500
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function createScreenLoading({ shell = null, loading = null } = {}) {
  let sequence = 0
  let timer = null
  let modalRecord = null

  function clearTimer() {
    if (timer !== null) window.clearTimeout(timer)
    timer = null
  }

  function show() {
    if (!loading) return
    loading.hidden = false
    loading.setAttribute('aria-hidden', 'false')
    document.body.classList.add('is-screen-loading')
    if (shell) shell.inert = true
  }

  function hide() {
    if (loading) {
      loading.hidden = true
      loading.setAttribute('aria-hidden', 'true')
    }
    document.body.classList.remove('is-screen-loading')
    if (shell && !modalRecord) shell.inert = false
  }

  function resetPage() {
    sequence += 1
    clearTimer()
    hide()
  }

  function navigate(render) {
    resetPage()
    const current = sequence
    show()
    timer = window.setTimeout(() => {
      if (current !== sequence) return
      render()
      hide()
      timer = null
    }, ROUTE_MS)
  }

  function leaveDashboard(navigateAway) {
    resetPage()
    const current = sequence
    show()
    timer = window.setTimeout(() => {
      if (current === sequence) navigateAway()
    }, ROUTE_MS)
  }

  function enterDashboard(render) {
    resetPage()
    show()
    render()
    return { ready: hide, abort: clearTimer }
  }

  function exitAuth(navigateAway, { duration = 1000 } = {}) {
    resetPage()
    const current = sequence
    show()
    timer = window.setTimeout(() => {
      if (current === sequence) navigateAway()
    }, duration)
  }

  function modalOpener() {
    return modalRecord?.opener || null
  }

  function openModal(backdrop, { opener = document.activeElement, onDismiss = () => {}, dismissible = true } = {}) {
    if (modalRecord) closeModal({ restoreFocus: false })
    const dialog = backdrop.querySelector('[role="dialog"]')
    const record = {
      backdrop, dialog, root: backdrop.parentElement, opener, onDismiss,
      dismissible, previousOverflow: document.body.style.overflow, keydown: null,
    }
    modalRecord = record
    document.body.style.overflow = 'hidden'
    if (shell) shell.inert = true
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
    backdrop.classList.add('is-open')
    window.requestAnimationFrame(() => {
      if (modalRecord !== record) return
      dialog.setAttribute('tabindex', '-1')
      ;(dialog.querySelector(FOCUSABLE) || dialog).focus()
    })
  }

  function closeModal({ restoreFocus = true } = {}) {
    const record = modalRecord
    if (!record) return
    document.removeEventListener('keydown', record.keydown, true)
    document.body.style.overflow = record.previousOverflow
    record.root.innerHTML = ''
    modalRecord = null
    if (shell && !document.body.classList.contains('is-screen-loading')) shell.inert = false
    if (restoreFocus && record.opener?.isConnected) record.opener.focus()
  }

  return { show, hide, navigate, leaveDashboard, resetPage, enterDashboard, exitAuth, modalOpener, openModal, closeModal, resetEntry: hide }
}
