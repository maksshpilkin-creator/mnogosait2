import { motionAllowed, onMotionChange } from './motion.js';

const clamp = value => Math.max(0, Math.min(1, value));
export function readingProgress(top, height, viewport) {
  return clamp((viewport * .88 - top) / (viewport * .65 + height * .25));
}
export function visitProgress(top, viewport) {
  return clamp((viewport * .96 - top) / (viewport * .55));
}
export function visitColors(progress) {
  const gray = Math.round(241 - 231 * clamp(progress));
  const channel = gray / 255;
  const luminance = channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  const blackContrast = (luminance + .05) / .05;
  const whiteContrast = 1.05 / (luminance + .05);
  const lightText = whiteContrast > blackContrast;
  return {
    background: `rgb(${gray}, ${gray}, ${gray})`,
    foreground: lightText ? '#ffffff' : '#000000',
    secondary: progress > .92 ? '#bcbcbc' : lightText ? '#ffffff' : '#000000',
    accent: progress > .85 ? '#249aff' : progress < .1 ? '#007bd6' : lightText ? '#ffffff' : '#000000',
    line: lightText ? '#ffffff33' : '#00000033'
  };
}

function prepareManifesto(heading) {
  if (!heading) return [];
  if (heading.dataset.scrollFill === 'true') return [...heading.querySelectorAll('.manifesto-word')];
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const words = [];
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    for (const token of node.textContent.split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) fragment.append(document.createTextNode(token));
      else {
        const span = document.createElement('span');
        span.className = 'manifesto-word'; span.textContent = token;
        fragment.append(span); words.push(span);
      }
    }
    node.replaceWith(fragment);
  }
  heading.dataset.scrollFill = 'true';
  return words;
}

/** One passive scheduler serves all three reversible scroll scenes. No perpetual RAF. */
export function initScrollScenes() {
  const hero = document.querySelector('#hero');
  const manifesto = document.querySelector('.manifesto-heading');
  const visit = document.querySelector('#first-visit');
  let words = [];
  try { words = prepareManifesto(manifesto); } catch { /* original readable copy remains */ }
  let frame = null;
  let destroyed = false;
  let lastFill = '';
  let lastTheme = '';

  const render = () => {
    if (destroyed || document.hidden) return;
    const allowed = motionAllowed();
    const viewport = Math.max(1, window.innerHeight);
    if (hero) {
      const rect = hero.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < viewport;
      if (!allowed || visible) {
        const progress = allowed ? clamp(-rect.top / Math.max(1, rect.height)) : 0;
        const small = window.innerWidth <= 760;
        hero.style.setProperty('--hero-title-shift', `${-progress * (small ? 4 : 10)}px`);
        hero.style.setProperty('--hero-watermark-shift', `${-progress * (small ? 14 : 30)}px`);
        hero.style.setProperty('--hero-implant-shift', `${-progress * (small ? 9 : 20)}px`);
        hero.dataset.parallaxProgress = progress.toFixed(3);
      }
    }
    if (manifesto) {
      const rect = manifesto.getBoundingClientRect();
      const progress = allowed ? readingProgress(rect.top, rect.height, viewport) : 1;
      const key = progress.toFixed(3);
      if (key !== lastFill) {
        lastFill = key;
        manifesto.dataset.fillProgress = key;
        words.forEach((word, index) => {
          const local = clamp((progress * (words.length + 1) - index) / 2);
          const gray = Math.round(188 - 180 * local);
          word.style.setProperty('--word-color', `rgb(${gray}, ${gray}, ${gray})`);
        });
      }
    }
    if (visit) {
      const progress = allowed ? visitProgress(visit.getBoundingClientRect().top, viewport) : 1;
      const key = progress.toFixed(3);
      if (key !== lastTheme) {
        lastTheme = key;
        const colors = visitColors(progress);
        visit.dataset.themeProgress = key;
        visit.style.setProperty('--step-bg', colors.background);
        visit.style.setProperty('--step-foreground', colors.foreground);
        visit.style.setProperty('--step-secondary', colors.secondary);
        visit.style.setProperty('--step-accent', colors.accent);
        visit.style.setProperty('--step-line', colors.line);
      }
    }
  };
  const schedule = () => {
    if (destroyed || document.hidden || !motionAllowed() || frame !== null) return;
    frame = requestAnimationFrame(() => { frame = null; render(); });
  };
  const preferenceChanged = () => {
    if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
    render();
  };
  const visibilityChanged = () => {
    if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
    if (!document.hidden) render();
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('visibilitychange', visibilityChanged);
  const unsubscribe = onMotionChange(preferenceChanged);
  render();
  document.fonts?.ready.then(render).catch(() => {});
  return {
    refresh: render,
    destroy() {
      destroyed = true;
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', visibilityChanged);
      unsubscribe();
      if (frame !== null) cancelAnimationFrame(frame);
    }
  };
}
