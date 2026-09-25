import { renderPlanCards } from './plans.js'

const plansGrid = document.getElementById('landing-plans-grid')
if (plansGrid) plansGrid.innerHTML = renderPlanCards()

const reviewTrack = document.getElementById('review-track')
if (reviewTrack) {
  ;[...reviewTrack.children].forEach(card => {
    const copy = card.cloneNode(true)
    copy.setAttribute('aria-hidden', 'true')
    reviewTrack.append(copy)
  })
}


const landingPath = window.location.pathname
if (landingPath.startsWith('/portfolio/')) {
  let username = landingPath.slice('/portfolio/'.length)
  try { username = decodeURIComponent(username) } catch {}
  window.location.replace('/portfolio.html?username=' + encodeURIComponent(username))
} else if (landingPath !== '/' && landingPath !== '/index.html') {
  window.location.replace('/404.html')
}

const header = document.getElementById('site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
let ticking = false;
let lastScrollY = window.scrollY;

function syncHeader(){
  const currentY = window.scrollY;
  const scrolled = currentY > 8;
  const direction = currentY > lastScrollY ? 'down' : currentY < lastScrollY ? 'up' : 'still';
  document.body.dataset.scrollDirection = direction;
  header?.classList.toggle('is-scrolled', scrolled);
  lastScrollY = currentY;
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(syncHeader);
    ticking = true;
  }
}, { passive:true });
syncHeader();

menuToggle?.addEventListener('click', () => {
  const open = mobileMenu?.classList.toggle('open') ?? false;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});
mobileLinks.forEach(link => link.addEventListener('click', () => {
  mobileMenu?.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded','false');
  menuToggle?.setAttribute('aria-label','Abrir menu');
}));

const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const button = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  const icon = button?.querySelector('i');
  button?.addEventListener('click', () => {
    const willOpen = !item.classList.contains('is-open');
    faqItems.forEach(other => {
      other.classList.remove('is-open');
      other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
      other.querySelector('.faq-answer')?.setAttribute('aria-hidden', 'true');
      const otherIcon = other.querySelector('.faq-question i');
      if (otherIcon) otherIcon.textContent = '+';
    });
    item.classList.toggle('is-open', willOpen);
    button.setAttribute('aria-expanded', String(willOpen));
    answer?.setAttribute('aria-hidden', String(!willOpen));
    if (icon) icon.textContent = willOpen ? '−' : '+';
  });
});


const githubInput = document.getElementById('github-link-input');
const pasteGithub = document.getElementById('paste-github');
const githubNext = document.getElementById('github-next');
const githubStatus = document.getElementById('github-link-status');

function syncGithubNext(){
  const hasLink = Boolean(githubInput?.value.trim());
  githubNext?.setAttribute('aria-disabled', String(!hasLink));
}

pasteGithub?.addEventListener('click', async () => {
  if (!githubInput) return;
  try {
    const text = await navigator.clipboard.readText();
    githubInput.value = text.trim();
    githubStatus.textContent = githubInput.value ? 'Link colado. Agora continue.' : 'Não encontramos um link na área de transferência.';
    syncGithubNext();
  } catch {
    githubStatus.textContent = 'Cole o link manualmente no campo ao lado.';
    githubInput.focus();
  }
});

githubInput?.addEventListener('input', () => {
  githubStatus.textContent = githubInput.value.trim() ? 'Link pronto. Agora continue.' : 'Cole o link e continue.';
  syncGithubNext();
});

githubNext?.addEventListener('click', event => {
  if (!githubInput?.value.trim()) {
    event.preventDefault();
    githubStatus.textContent = 'Primeiro, cole o link do seu GitHub.';
    githubInput?.focus();
  }
});

syncGithubNext();

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({behavior:'auto', block:'start'});
  });
});

const plansAnchor = document.getElementById('planos')
if (location.hash === '#planos' && plansAnchor) {
  const showPlans = () => window.scrollTo({ top: plansAnchor.getBoundingClientRect().top + window.scrollY - 100, behavior: 'instant' })
  requestAnimationFrame(() => requestAnimationFrame(showPlans))
  window.addEventListener('load', showPlans, { once: true })
}


const hero = document.querySelector('.hero-devifolio')
if (hero) {
  const reducedHeroMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let heroFrame = 0
  let mouseDrag = null

  function updateHeroProgress() {
    heroFrame = 0
    const rect = hero.getBoundingClientRect()
    const range = Math.max(280, rect.height * .68)
    const progress = reducedHeroMotion.matches ? 0 : Math.min(1, Math.max(0, -rect.top / range))
    hero.style.setProperty('--hero-drag-progress', progress.toFixed(4))
    hero.style.setProperty('--hero-copy-shift', (-16 * progress).toFixed(2) + 'px')
    hero.style.setProperty('--hero-visual-shift-x', (-11 * progress).toFixed(2) + 'px')
    hero.style.setProperty('--hero-visual-shift-y', (-34 * progress).toFixed(2) + 'px')
    hero.style.setProperty('--hero-visual-scale', (1 - .025 * progress).toFixed(4))
  }

  function scheduleHeroProgress() {
    if (!heroFrame) heroFrame = window.requestAnimationFrame(updateHeroProgress)
  }

  window.addEventListener('scroll', scheduleHeroProgress, { passive: true })
  window.addEventListener('resize', scheduleHeroProgress, { passive: true })
  reducedHeroMotion.addEventListener?.('change', scheduleHeroProgress)

  hero.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('a, button, input, textarea, select')) return
    mouseDrag = { id: event.pointerId, lastY: event.clientY }
    hero.setPointerCapture(event.pointerId)
    event.preventDefault()
  })

  hero.addEventListener('pointermove', event => {
    if (!mouseDrag || event.pointerId !== mouseDrag.id) return
    const delta = mouseDrag.lastY - event.clientY
    mouseDrag.lastY = event.clientY
    if (Math.abs(delta) < 1) return
    event.preventDefault()
    window.scrollBy(0, delta)
    scheduleHeroProgress()
  })

  function endHeroDrag(event) {
    if (!mouseDrag || event.pointerId !== mouseDrag.id) return
    if (hero.hasPointerCapture(event.pointerId)) hero.releasePointerCapture(event.pointerId)
    mouseDrag = null
  }
  hero.addEventListener('pointerup', endHeroDrag)
  hero.addEventListener('pointercancel', endHeroDrag)
  updateHeroProgress()
}
