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

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealElements = document.querySelectorAll([
  '.hero-copy',
  '.hero-visual',
  '.showcase-card',
  '.showcase-stat',
  '.section-head > *',
  '.feature-row',
  '.step',
  '.audience-card',
  '.price-note',
  '.faq-item',
  '.final-video-copy',
  '.video-frame',
  '.footer-grid > *',
].join(','));

revealElements.forEach(element => {
  element.classList.add('direction-reveal');
  const siblings = [...element.parentElement.children];
  element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element), 3) * 35}ms`);
});

if (motionPreference.matches) {
  revealElements.forEach(element => element.classList.add('is-inview'));
} else {
  // Observe unclipped layout parents so a masked child can still enter view.
  const revealGroups = new Map();
  revealElements.forEach(element => {
    const group = element.parentElement;
    if (!revealGroups.has(group)) revealGroups.set(group, []);
    revealGroups.get(group).push(element);
  });
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealGroups.get(entry.target).forEach(element => element.classList.add('is-inview'));
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
  window.requestAnimationFrame(() => {
    revealGroups.forEach((elements, group) => revealObserver.observe(group));
  });
}

document.addEventListener('focusin', event => {
  event.target.closest('.direction-reveal')?.classList.add('is-inview');
});
motionPreference.addEventListener('change', event => {
  if (event.matches) revealElements.forEach(element => element.classList.add('is-inview'));
});

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

/* Progressive enhancement: vertical scrolling remains native on every page. */
const horizontalScenes = [
  { section: document.getElementById('funcionalidades'), selector: '.feature-list' },
  { section: document.getElementById('como-funciona'), selector: '.workflow-grid' },
].flatMap(({ section, selector }) => {
  const track = section?.querySelector(selector);
  if (!track) return [];
  const viewport = document.createElement('div');
  viewport.className = 'horizontal-viewport';
  track.before(viewport);
  viewport.append(track);
  return [{ section, track, viewport, container: section.querySelector('.container'), distance: 0, start: 0 }];
});
const desktopScroll = window.matchMedia('(min-width: 1000px) and (min-height: 640px)');
let sceneFrame = 0;
let measureFrame = 0;

function updateHorizontalScenes() {
  sceneFrame = 0;
  const scrollY = window.scrollY;
  horizontalScenes.forEach(scene => {
    if (!scene.distance) return;
    const progress = Math.max(0, Math.min(1, (scrollY - scene.start) / scene.distance));
    scene.track.style.setProperty('--track-x', `${-progress * scene.distance}px`);
  });
}

function measureHorizontalScenes() {
  measureFrame = 0;
  const enabled = desktopScroll.matches && !motionPreference.matches;
  // Complete all layout setup before measuring; scrolling only updates transforms.
  horizontalScenes.forEach(scene => {
    scene.section.classList.toggle('horizontal-scene', enabled);
    if (!enabled) {
      scene.distance = 0;
      scene.section.style.removeProperty('--scene-height');
      scene.track.style.removeProperty('--track-x');
    }
  });
  if (!enabled) return;
  horizontalScenes.forEach(scene => {
    scene.distance = Math.max(0, scene.track.scrollWidth - scene.viewport.clientWidth);
    scene.section.style.setProperty('--scene-height', `${scene.container.offsetHeight + scene.distance}px`);
  });
  horizontalScenes.forEach(scene => {
    scene.start = scene.section.getBoundingClientRect().top + window.scrollY - 72;
  });
  updateHorizontalScenes();
}

function scheduleSceneMeasure() {
  if (!measureFrame) measureFrame = requestAnimationFrame(measureHorizontalScenes);
}
window.addEventListener('scroll', () => {
  if (!sceneFrame) sceneFrame = requestAnimationFrame(updateHorizontalScenes);
}, { passive: true });
window.addEventListener('resize', scheduleSceneMeasure, { passive: true });
window.addEventListener('load', scheduleSceneMeasure, { once: true });
desktopScroll.addEventListener('change', scheduleSceneMeasure);
motionPreference.addEventListener('change', scheduleSceneMeasure);
document.fonts?.ready.then(scheduleSceneMeasure);
scheduleSceneMeasure();
