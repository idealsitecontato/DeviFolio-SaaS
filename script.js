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

const finalVideo = document.querySelector('.lf-final-video')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
function syncFinalVideo() {
  if (!finalVideo) return
  if (reducedMotion.matches) finalVideo.pause()
  else finalVideo.play().catch(() => { /* autoplay may be unavailable */ })
}
reducedMotion.addEventListener?.('change', syncFinalVideo)
syncFinalVideo()

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
