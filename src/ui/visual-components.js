const paperclip = '<svg class="nuda-browse__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21.5 11.5l-8.5 8.5a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" stroke-linecap="round" stroke-linejoin="round"/></svg>'

export const UploadButton = label => `<span class="nuda-browse__content">${paperclip}<span>${label}</span></span>`

export const GooeySpinner = () => '<span class="nuda-gooey" aria-hidden="true"><span class="nuda-gooey__rot"><span></span><span></span></span></span>'

export function mountGooeySpinners() {
  if (!document.getElementById('nuda-gooey-filter')) {
    document.body.insertAdjacentHTML('afterbegin', '<svg class="nuda-gooey-filter-defs" width="0" height="0" aria-hidden="true"><filter id="nuda-gooey-filter"><feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"/></filter></svg>')
  }
  const update = () => {
    document.querySelectorAll('.screen-loading .spinner').forEach(node => {
      if (!node.querySelector('.nuda-gooey')) node.innerHTML = GooeySpinner()
    })
    document.querySelectorAll('button.is-loading').forEach(button => {
      if (!button.querySelector('.nuda-gooey')) button.insertAdjacentHTML('afterbegin', GooeySpinner())
    })
    document.querySelectorAll('button:not(.is-loading) > .nuda-gooey').forEach(node => node.remove())
    document.querySelectorAll('.public-state[role="status"]').forEach(state => {
      if (!state.querySelector('.nuda-gooey')) state.insertAdjacentHTML('afterbegin', GooeySpinner())
    })
  }
  update()
  const observer = new MutationObserver(update)
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}
