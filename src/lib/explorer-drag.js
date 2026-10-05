// One controller for native desktop drag and touch long-press. Persistence stays
// with the dashboard's authenticated adapter, not with DOM order or a mock store.
export function bindExplorerDrag({ canMove, moveProject, reorderFolders, onError, root = document }) {
  const selector = '.projects-page [data-drag-project]'
  let drag = null
  let pending = false
  let touch = null
  let suppressClickUntil = 0
  const body = root.body
  const query = value => root.querySelector(value)
  const motion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : parseFloat(getComputedStyle(body).getPropertyValue('--motion-fast')) || 180
  const easing = () => getComputedStyle(body).getPropertyValue('--ease').trim() || 'ease-out'
  const status = document.createElement('div')
  status.className = 'explorer-drag-status'
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  body.append(status)
  const clearTargets = () => root.querySelectorAll('.explorer-drop-target,.explorer-drop-blocked').forEach(el => el.classList.remove('explorer-drop-target', 'explorer-drop-blocked'))

  function destination(element) {
    return element?.closest('.projects-page[data-drop-zone="projects"]') ? 'projects' : null
  }

  function start(source, dataTransfer) {
    if (pending || drag) return false
    const folder = source.hasAttribute('data-drag-folder')
    const original = [...source.parentElement.children]
    const ghost = document.createElement('canvas')
    ghost.width = 1
    ghost.height = 1
    ghost.style.position = 'fixed'
    ghost.style.left = '-100px'
    ghost.style.top = '-100px'
    body.append(ghost)
    drag = { source, ghost, folder, id: folder ? source.dataset.dragFolder : Number(source.dataset.dragProject), parent: source.parentElement, original, target: null, beforeId: null }
    if (dataTransfer) {
      dataTransfer.effectAllowed = 'move'
      dataTransfer.setData('text/plain', `${folder ? 'folder' : 'project'}:${drag.id}`)
      dataTransfer.setDragImage(ghost, 0, 0)
    }
    if (source.closest('.portfolio-folder-modal')) {
      drag.previousOverflow = body.style.overflow
      const shell = query('.app-shell')
      if (shell) { drag.shell = shell; shell.inert = false }
    }
    body.classList.add('explorer-dragging')
    requestAnimationFrame(() => { if (drag?.source === source) source.classList.add('explorer-drag-source') })
    return true
  }

  function arrange(target, x) {
    if (!drag || target === drag.source || target.parentElement !== drag.parent) return
    const rect = target.getBoundingClientRect()
    const after = x > rect.x + rect.width / 2
    if ((!after && drag.source.nextElementSibling === target) || (after && target.nextElementSibling === drag.source)) return
    const duration = motion()
    const previous = duration ? new Map([...drag.parent.children].filter(item => item !== drag.source).map(item => [item, item.getBoundingClientRect()])) : null
    drag.parent.insertBefore(drag.source, after ? target.nextElementSibling : target)
    if (previous) {
      for (const [item, before] of previous) {
        const current = item.getBoundingClientRect()
        const dx = before.left - current.left, dy = before.top - current.top
        if (dx || dy) item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration, easing: easing() })
      }
    }
  }

  function hover(element, x, y) {
    if (!drag) return false
    const dialog = query('.portfolio-folder-modal')
    if (dialog && !body.classList.contains('explorer-drag-away')) {
      const rect = dialog.getBoundingClientRect()
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        body.classList.add('explorer-drag-away')
        body.style.overflow = ''
      }
    }
    if (body.classList.contains('explorer-drag-away')) element = root.elementFromPoint(x, y)
    clearTargets()
    if (drag.folder) {
      const target = element?.closest('[data-drag-folder]')
      const list = element?.closest('.portfolio-list')
      drag.target = target || list
      if (target) arrange(target, x)
      else if (list && drag.source !== list.lastElementChild) list.append(drag.source)
      return Boolean(target || list)
    }
    const dest = destination(element)
    const valid = Boolean(dest && canMove(drag.id, dest))
    drag.target = valid ? dest : null
    const card = element?.closest('[data-drag-project]')
    drag.beforeId = null
    if (valid && card) {
      if (card.parentElement === drag.parent) {
        arrange(card, x)
        const next = drag.source.nextElementSibling
        drag.beforeId = next?.hasAttribute('data-drag-project') ? Number(next.dataset.dragProject) : null
      } else {
        const rect = card.getBoundingClientRect()
        const before = x <= rect.x + rect.width / 2 ? card : card.nextElementSibling
        drag.beforeId = before?.hasAttribute('data-drag-project') ? Number(before.dataset.dragProject) : null
      }
    }
    const zone = element?.closest('[data-folder-id],#side-nav [data-route],[data-drop-zone]')
    zone?.classList.add(valid ? 'explorer-drop-target' : 'explorer-drop-blocked')
    // Allow long grids to be traversed without leaving the drag.
    const scrollArea = element?.closest('.portfolio-folder-window')
    const bounds = scrollArea?.getBoundingClientRect() || { top: 0, bottom: innerHeight }
    const delta = y < bounds.top + 42 ? -12 : y > bounds.bottom - 42 ? 12 : 0
    if (delta) (scrollArea || window).scrollBy(0, delta)
    return valid
  }

  function cleanup(restore = true) {
    if (!drag) return
    clearTargets()
    if (restore) drag.original.forEach(el => { if (el.parentElement === drag.parent) drag.parent.append(el) })
    drag.source.classList.remove('explorer-drag-source')
    drag.source.removeAttribute('aria-grabbed')
    drag.ghost.remove()
    if (drag.shell && query('.portfolio-folder-modal')) drag.shell.inert = true
    if (drag.previousOverflow !== undefined) body.style.overflow = drag.previousOverflow
    body.classList.remove('explorer-dragging', 'explorer-drag-away')
    suppressClickUntil = Date.now() + 300
    drag = null
  }

  async function drop() {
    if (!drag) return
    const item = drag
    const order = item.folder ? [...item.parent.querySelectorAll('[data-drag-folder]')].map(el => el.dataset.dragFolder) : null
    cleanup(!item.target)
    if (!item.target) return
    item.source.classList.add('explorer-drop-settle')
    window.setTimeout(() => item.source.classList.remove('explorer-drop-settle'), motion())
    pending = true
    try {
      if (item.folder) await reorderFolders(order)
      else await moveProject(item.id, item.target, item.beforeId)
    } catch (error) { onError(error) }
    finally { pending = false }
  }

  root.addEventListener('dragstart', event => {
    const source = event.target.closest?.(selector)
    if (!source) return
    if (event.target.closest('button:not([data-view-project]),a,input,select') || !start(source, event.dataTransfer)) event.preventDefault()
  })
  root.addEventListener('dragover', event => {
    if (!drag) return
    event.preventDefault()
    event.dataTransfer.dropEffect = hover(event.target, event.clientX, event.clientY) ? 'move' : 'none'
  })
  root.addEventListener('dragenter', event => {
    if (!drag) return
    event.preventDefault()
    event.dataTransfer.dropEffect = hover(event.target, event.clientX, event.clientY) ? 'move' : 'none'
  })
  root.addEventListener('drop', event => { if (drag) { event.preventDefault(); void drop() } })
  root.addEventListener('dragend', cleanup)
  root.addEventListener('click', event => {
    if (Date.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation() }
  }, true)
  root.addEventListener('keydown', event => {
    const source = event.target.closest?.(selector)
    if (drag?.keyboard && event.key === 'Escape') {
      event.preventDefault()
      status.textContent = 'Reordenação cancelada.'
      cleanup()
      return
    }
    if (!source || event.target !== source) {
      if (event.key === 'Escape' && drag) { event.preventDefault(); cleanup() }
      return
    }
    if (!drag && event.key === ' ' && canMove(Number(source.dataset.dragProject), 'projects')) {
      event.preventDefault()
      if (start(source)) {
        drag.keyboard = true
        drag.target = 'projects'
        source.setAttribute('aria-grabbed', 'true')
        status.textContent = `${source.getAttribute('aria-label')}. Use as setas para mover, Espaço para soltar ou Escape para cancelar.`
      }
      return
    }
    if (!drag?.keyboard || drag.source !== source) return
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      const id = drag.id
      status.textContent = `${source.getAttribute('aria-label')} solto.`
      void drop().then(() => query(`.projects-page [data-drag-project="${id}"]`)?.focus())
      return
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    const neighbor = backward ? source.previousElementSibling : source.nextElementSibling
    if (!neighbor?.hasAttribute('data-drag-project')) return
    const rect = neighbor.getBoundingClientRect()
    arrange(neighbor, backward ? rect.left : rect.right)
    const next = source.nextElementSibling
    drag.beforeId = next?.hasAttribute('data-drag-project') ? Number(next.dataset.dragProject) : null
    const position = [...drag.parent.querySelectorAll('[data-drag-project]')].indexOf(source) + 1
    status.textContent = `${source.getAttribute('aria-label')}, posição ${position}.`
  }, true)

  root.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || event.target.closest('button:not([data-view-project]),a,input,select')) return
    const source = event.target.closest?.(selector)
    if (!source || pending) return
    touch = { source, id: event.pointerId, x: event.clientX, y: event.clientY, active: false }
    touch.timer = setTimeout(() => {
      if (!touch || !start(source)) return
      touch.active = true
      source.setPointerCapture(touch.id)
      drag.ghost.style.left = `${touch.x - 70}px`
      drag.ghost.style.top = `${touch.y - 40}px`
    }, 350)
  })
  root.addEventListener('pointermove', event => {
    if (!touch || event.pointerId !== touch.id) return
    if (!touch.active) {
      if (Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 8) { clearTimeout(touch.timer); touch = null }
      return
    }
    event.preventDefault()
    if (!drag) return
    drag.ghost.style.left = `${event.clientX - 70}px`
    drag.ghost.style.top = `${event.clientY - 40}px`
    hover(root.elementFromPoint(event.clientX, event.clientY), event.clientX, event.clientY)
  }, { passive: false })
  function endTouch(event) {
    if (!touch || event.pointerId !== touch.id) return
    clearTimeout(touch.timer)
    if (touch.active) { event.preventDefault(); event.type === 'pointercancel' ? cleanup() : void drop() }
    touch = null
  }
  root.addEventListener('pointerup', endTouch)
  root.addEventListener('pointercancel', endTouch)
  root.addEventListener('touchmove', event => { if (touch?.active) event.preventDefault() }, { passive: false })
  root.addEventListener('contextmenu', event => { if (event.target.closest?.(selector)) event.preventDefault() })
}
