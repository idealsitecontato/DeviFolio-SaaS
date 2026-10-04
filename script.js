import './src/lib/build-version.js'
import { renderPlanCards } from './plans.js'

document.getElementById('copyright-year').textContent = String(new Date().getFullYear())
document.getElementById('landing-plans-grid').innerHTML = renderPlanCards()
const menuToggle = document.querySelector('.menu-toggle')
const mobileMenu = document.getElementById('mobile-menu')
function closeMenu() {
  mobileMenu.hidden = true
  menuToggle.setAttribute('aria-expanded', 'false')
  menuToggle.setAttribute('aria-label', 'Abrir menu')
}
menuToggle.addEventListener('click', () => {
  const open = mobileMenu.hidden
  mobileMenu.hidden = !open
  menuToggle.setAttribute('aria-expanded', String(open))
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu')
})
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu))
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileMenu.hidden) { closeMenu(); menuToggle.focus() }
})
matchMedia('(min-width: 1001px)').addEventListener('change', event => { if (event.matches) closeMenu() })
const navLinks = [...document.querySelectorAll('.desktop-nav a')]
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue
    navLinks.forEach(link => {
      const active = link.hash === '#' + entry.target.id
      if (active) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    })
  }
}, { rootMargin: '-15% 0px -60% 0px' })
navLinks.forEach(link => { const section = document.querySelector(link.hash); if (section) observer.observe(section) })
window.addEventListener('offline', () => {
  if (document.querySelector('.offline-notice')) return
  const notice = document.createElement('div')
  notice.className = 'offline-notice'; notice.setAttribute('role', 'status')
  notice.textContent = 'Você está sem conexão. Verifique sua internet para continuar.'
  document.getElementById('site-header').append(notice)
})
window.addEventListener('online', () => document.querySelector('.offline-notice')?.remove())

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('is-visible')
    revealObserver.unobserve(entry.target)
  })
}, { threshold: 0.12 })
document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element))

const mockup = document.querySelector('.landing-mockup')
if (mockup && !reducedMotion.matches) {
  let scheduled = false
  window.addEventListener('scroll', () => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      mockup.style.setProperty('--mock-parallax', `${Math.min(28, window.scrollY * 0.04)}px`)
      scheduled = false
    })
  }, { passive: true })
}
