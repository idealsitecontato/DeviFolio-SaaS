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

document.querySelectorAll('.faq-list details').forEach(detail => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('.faq-list details').forEach(other => {
      if (other !== detail) other.open = false;
    });
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

const featureList = document.querySelector('.feature-list');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (featureList) {
  if (prefersReducedMotion) {
    featureList.classList.add('is-inview');
  } else {
    const featureObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          featureList.classList.add('is-inview');
          featureObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.22 });
    featureObserver.observe(featureList);
  }
}

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
