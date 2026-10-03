import './src/lib/build-version.js'
import { renderPlanCards } from './plans.js'

const landingPlans = document.getElementById('landing-plans-grid')
if (landingPlans) landingPlans.innerHTML = renderPlanCards()

document.getElementById('copyright-year').textContent = String(new Date().getFullYear())
const referral = new URLSearchParams(location.search).get('ref')?.trim().toLowerCase() || ''
if (/^[a-z0-9._-]{1,80}$/.test(referral)) {
  document.querySelectorAll('a[href^="cadastro.html"]').forEach(link => {
    const url = new URL(link.getAttribute('href'), location.href)
    url.searchParams.set('ref', referral)
    link.href = url.toString()
  })
}
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
if (window.IntersectionObserver && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const reveals = [...document.querySelectorAll('.ecosystem-landing .reveal')]
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-visible')
      revealObserver.unobserve(entry.target)
    })
  }, { threshold: 0.12 })
  reveals.forEach(element => {
    element.classList.add('reveal-ready')
    revealObserver.observe(element)
  })
}
window.addEventListener('offline', () => {
  if (document.querySelector('.offline-notice')) return
  const notice = document.createElement('div')
  notice.className = 'offline-notice'; notice.setAttribute('role', 'status')
  notice.textContent = 'Você está sem conexão. Verifique sua internet para continuar.'
  document.getElementById('site-header').append(notice)
})
window.addEventListener('online', () => document.querySelector('.offline-notice')?.remove())
