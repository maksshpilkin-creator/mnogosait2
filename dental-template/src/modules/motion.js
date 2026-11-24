/** Small, cancellable effects. Base styles always represent a usable final state. */
const preference = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: true };
const running = new Set();
const drawerStates = new WeakMap();
const accordionStates = new WeakMap();
const previewStates = new WeakMap();
const revealStates = new WeakMap();
const transientCleanups = new Set();
const motionListeners = new Set();
let paused = false;
let observer;

export function motionAllowed() {
  return !preference.matches && !paused && typeof Element.prototype.animate === 'function';
}

export function onMotionChange(listener) {
  motionListeners.add(listener);
  return () => motionListeners.delete(listener);
}

function effect(element, frames, options) {
  if (!element || !motionAllowed()) return { animation: null, done: Promise.resolve() };
  let animation;
  try {
    animation = element.animate(frames, { easing: 'cubic-bezier(.22,1,.36,1)', fill: 'none', ...options });
  } catch {
    return { animation: null, done: Promise.resolve() };
  }
  running.add(animation);
  const done = new Promise(resolve => {
    const settled = () => { running.delete(animation); resolve(); };
    animation.addEventListener('finish', settled, { once: true });
    animation.addEventListener('cancel', settled, { once: true });
  });
  return { animation, done };
}

function finishEffects() {
  for (const animation of [...running]) {
    try { animation.finish(); } catch { animation.cancel(); }
  }
}

function updatePreference() {
  const available = typeof Element.prototype.animate === 'function';
  document.documentElement.dataset.motion = preference.matches || !available ? 'reduced' : paused ? 'paused' : 'full';
  const toggle = document.querySelector('.motion-toggle');
  if (toggle) {
    toggle.hidden = preference.matches || typeof Element.prototype.animate !== 'function';
    toggle.textContent = paused ? 'Включить анимацию' : 'Остановить анимацию';
    toggle.setAttribute('aria-pressed', String(paused));
  }
  if (!motionAllowed()) {
    finishEffects();
    for (const cleanup of [...transientCleanups]) cleanup();
  }
  motionListeners.forEach(listener => listener(motionAllowed()));
}

export function syncScrollLock() {
  document.body.classList.toggle('modal-open', Boolean(document.querySelector(
    '.price-drawer.is-open, .price-drawer.is-leaving, .mobile-nav-drawer.is-open, .mobile-nav-drawer.is-leaving'
  )));
}

/** Reversing an in-flight drawer starts from its current pixels, never a stale endpoint. */
export function moveDrawer(drawer, backdrop, open, side = 'right') {
  if (!drawer || !backdrop) return Promise.resolve(false);
  const previous = drawerStates.get(drawer);
  const wasPainted = drawer.classList.contains('is-open') || drawer.classList.contains('is-leaving');
  const currentTransform = wasPainted ? getComputedStyle(drawer).transform : null;
  const currentOpacity = wasPainted ? getComputedStyle(backdrop).opacity : '0';
  previous?.animations.forEach(animation => animation?.cancel());
  const state = { animations: [] };
  drawerStates.set(drawer, state);
  const outside = `translateX(${side === 'left' ? '-' : ''}100%)`;

  drawer.classList.toggle('is-open', open);
  backdrop.classList.toggle('is-open', open);
  drawer.classList.toggle('is-leaving', !open);
  backdrop.classList.toggle('is-leaving', !open);
  syncScrollLock();

  const panel = effect(drawer, [
    { transform: currentTransform || (open ? outside : 'translateX(0)') },
    { transform: open ? 'translateX(0)' : outside }
  ], { duration: open ? 560 : 420 });
  const shade = effect(backdrop, [
    { opacity: wasPainted ? currentOpacity : open ? 0 : 1 },
    { opacity: open ? 1 : 0 }
  ], { duration: open ? 420 : 360, fill: open ? 'none' : 'forwards' });
  state.animations = [panel.animation, shade.animation];

  return Promise.all([panel.done, shade.done]).then(() => {
    if (drawerStates.get(drawer) !== state) return false;
    drawer.classList.remove('is-leaving');
    backdrop.classList.remove('is-leaving');
    syncScrollLock();
    return true;
  });
}

export function moveAccordion(body, open) {
  const previous = accordionStates.get(body);
  const fromHeight = body.hidden ? 0 : body.getBoundingClientRect().height;
  const fromOpacity = body.hidden ? 0 : Number(getComputedStyle(body).opacity);
  previous?.animation?.cancel();
  const state = {};
  accordionStates.set(body, state);
  body.hidden = false;
  body.inert = !open;
  body.classList.add('is-animating');
  const toHeight = open ? body.scrollHeight : 0;
  const result = effect(body, [
    { height: `${fromHeight}px`, opacity: fromOpacity },
    { height: `${toHeight}px`, opacity: open ? 1 : 0 }
  ], { duration: 480 });
  state.animation = result.animation;
  return result.done.then(() => {
    if (accordionStates.get(body) !== state) return;
    body.classList.remove('is-animating');
    body.hidden = !open;
  });
}

/** Native words keep their whitespace and BR nodes; wrappers live only during the reveal. */
function revealText(heading, lead = 0, staggerLimit = 320) {
  if (!heading || !motionAllowed() || heading.contains(document.activeElement)) return;
  const original = heading.innerHTML;
  const before = heading.getBoundingClientRect();
  const animations = [];
  const state = { cleanup: null };
  const cleanup = () => {
    if (revealStates.get(heading) !== state) return;
    animations.forEach(animation => animation?.cancel());
    heading.innerHTML = original;
    heading.dataset.motionTextState = 'complete';
    transientCleanups.delete(cleanup);
  };
  state.cleanup = cleanup;
  revealStates.set(heading, state);
  transientCleanups.add(cleanup);
  heading.dataset.motionKind = 'text-mask';
  heading.dataset.motionTextState = 'running';
  const words = [];
  try {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const token of node.textContent.split(/(\s+)/)) {
        if (!token) continue;
        if (/^\s+$/.test(token)) { fragment.append(document.createTextNode(token)); continue; }
        const mask = document.createElement('span');
        mask.className = 'motion-word-mask';
        const word = document.createElement('span');
        word.className = 'motion-word';
        word.textContent = token;
        mask.append(word); fragment.append(mask); words.push(word);
      }
      node.replaceWith(fragment);
    }
    const after = heading.getBoundingClientRect();
    // A font/line-box edge case must not alter the accepted layout.
    if (Math.abs(after.height - before.height) > .75 || Math.abs(after.width - before.width) > .75) {
      heading.innerHTML = original;
      heading.dataset.motionTextMode = 'block-mask';
      const result = effect(heading, [
        { clipPath: 'inset(0 0 100% 0)', transform: 'translateY(8px)' },
        { clipPath: 'inset(0 0 0% 0)', transform: 'translateY(0)' }
      ], { duration: 1100, delay: lead, fill: 'backwards' });
      animations.push(result.animation);
      if (!result.animation) cleanup();
      else result.done.then(cleanup);
      return;
    }
    heading.dataset.motionTextMode = 'words';
    const step = Math.min(60, staggerLimit / Math.max(words.length - 1, 1));
    const pending = words.map((word, index) => {
      const result = effect(word, [
        { transform: 'translateY(115%)', opacity: .2 },
        { transform: 'translateY(0)', opacity: 1 }
      ], { duration: 1100, delay: lead + index * step, fill: 'backwards' });
      animations.push(result.animation);
      return result.done;
    });
    if (animations.some(animation => !animation)) cleanup();
    else Promise.all(pending).then(cleanup);
  } catch {
    cleanup();
  }
}

/** Hero lines have their own masks; art and scroll transforms live on other layers. */
function revealHeroLines(heading, lead = 0) {
  if (!heading || !motionAllowed()) return;
  const original = heading.innerHTML;
  const before = heading.getBoundingClientRect();
  const animations = [];
  const state = {};
  const cleanup = () => {
    if (revealStates.get(heading) !== state) return;
    animations.forEach(animation => animation?.cancel());
    heading.innerHTML = original;
    heading.dataset.motionTextState = 'complete';
    transientCleanups.delete(cleanup);
  };
  state.cleanup = cleanup;
  revealStates.set(heading, state);
  transientCleanups.add(cleanup);
  heading.dataset.motionKind = 'text-mask';
  heading.dataset.motionTextMode = 'lines';
  heading.dataset.motionTextState = 'running';
  try {
    const lines = original.split(/<br\s*\/?>/i).map(text => {
      const holder = document.createElement('span'); holder.innerHTML = text;
      return holder.textContent.trim();
    });
    heading.replaceChildren();
    const masks = lines.map((text, index) => {
      const mask = document.createElement('span'); mask.className = 'hero-line-mask';
      const line = document.createElement('span'); line.className = 'hero-line'; line.textContent = text;
      mask.append(line); heading.append(mask);
      if (index < lines.length - 1) heading.append(document.createElement('br'));
      return line;
    });
    const after = heading.getBoundingClientRect();
    if (Math.abs(after.height - before.height) > .75 || Math.abs(after.width - before.width) > .75) {
      cleanup(); revealText(heading, lead, 240); return;
    }
    const pending = masks.map((line, index) => {
      const result = effect(line, [
        { transform: 'translateY(115%)', opacity: .2 },
        { transform: 'translateY(0)', opacity: 1 }
      ], { duration: 1150, delay: lead + index * 100, fill: 'backwards' });
      animations.push(result.animation); return result.done;
    });
    if (animations.some(animation => !animation)) cleanup();
    else Promise.all(pending).then(cleanup);
  } catch { cleanup(); }
}

/** Only artwork and non-interactive copy are cloned, never controls or live regions. */
export function transitionPreview(panel, applyContent, direction = 1) {
  if (!panel) { applyContent(); return; }
  previewStates.get(panel)?.cleanup();
  if (panel.contains(document.activeElement)) { applyContent(); return; }
  if (!motionAllowed()) { applyContent(); return; }
  const overlays = [];
  const animations = [];
  const state = { cleanup: null };
  const cleanup = () => {
    if (previewStates.get(panel) !== state) return;
    animations.forEach(animation => animation?.cancel());
    overlays.forEach(overlay => overlay.remove());
    panel.classList.remove('is-preview-transitioning');
    panel.dataset.previewTransition = 'idle';
    transientCleanups.delete(cleanup);
    previewStates.delete(panel);
  };
  state.cleanup = cleanup;
  previewStates.set(panel, state);
  transientCleanups.add(cleanup);
  panel.dataset.previewTransition = direction < 0 ? 'previous' : 'next';
  panel.classList.add('is-preview-transitioning');
  try {
    const image = panel.querySelector('.preview-image');
    const summary = panel.querySelector('.preview-summary');
    const metadata = panel.querySelector('.preview-meta-row');
    const price = panel.querySelector('.preview-price-val');
    const button = panel.querySelector('.btn-service-detail');
    const badge = panel.querySelector('.preview-badge-overlay');
    const createOutgoing = (element, imageLayer = false) => {
      if (!element) return;
      const parent = imageLayer ? element.parentElement : panel.querySelector('.preview-body');
      const layer = document.createElement('div');
      layer.className = 'motion-preview-layer';
      layer.setAttribute('aria-hidden', 'true');
      layer.inert = true;
      layer.style.pointerEvents = 'none';
      const copy = element.cloneNode(true);
      copy.removeAttribute('id'); copy.removeAttribute('aria-live'); copy.removeAttribute('role');
      if (copy.tagName === 'IMG') { copy.alt = ''; copy.setAttribute('role', 'presentation'); }
      copy.querySelectorAll('[id], [aria-live], [tabindex]').forEach(node => {
        node.removeAttribute('id'); node.removeAttribute('aria-live'); node.removeAttribute('tabindex');
      });
      copy.querySelectorAll('button, a, input, textarea, select, label').forEach(node => node.remove());
      copy.classList.add('motion-preview-copy');
      if (!imageLayer) {
        layer.style.top = element.offsetTop + 'px';
        layer.style.left = element.offsetLeft + 'px';
        layer.style.width = element.getBoundingClientRect().width + 'px';
        layer.style.height = element.getBoundingClientRect().height + 'px';
      } else layer.classList.add('motion-preview-image-layer');
      layer.append(copy);
      overlays.push(layer);
      parent.append(layer);
    };
    createOutgoing(image, true);
    createOutgoing(summary);
    createOutgoing(metadata);
    createOutgoing(price);
    applyContent();
    const sign = direction < 0 ? -1 : 1;
    const pending = [];
    overlays.forEach(layer => {
      const result = effect(layer, [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(' + (-sign * 9) + 'px)' }
      ], { duration: 360, fill: 'forwards' });
      animations.push(result.animation); pending.push(result.done);
      // Keep its final transparent pixels until removal, never repaint the old frame
      // during the 360–620 ms window while the incoming content is still entering.
      result.done.then(() => layer.remove());
    });
    [image, summary, metadata, price, button, badge].filter(Boolean).forEach(element => {
      const result = effect(element, [
        { opacity: 0, transform: 'translateY(' + (sign * 9) + 'px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 620 });
      animations.push(result.animation); pending.push(result.done);
    });
    if (animations.some(animation => !animation)) cleanup();
    else Promise.all(pending).then(cleanup);
  } catch {
    cleanup();
    applyContent();
  }
}

function settleFocusedPreview(target) {
  const panel = target.closest?.('.service-preview-card');
  if (panel) previewStates.get(panel)?.cleanup();
}

export function scrollToElement(element) {
  element?.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'auto' });
}

/** Readable content already inside the viewport must never be hidden again. */
export function shouldRevealAhead(rect, viewport, focused = false) {
  return !focused && rect.bottom > 0 && rect.top >= viewport + 24 && rect.top <= viewport + 420;
}

export function initMotion(loading = {}) {
  const wrap = document.querySelector('.footer-bottom-bar');
  if (wrap && !wrap.querySelector('.motion-toggle')) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'motion-toggle';
    toggle.addEventListener('click', () => { paused = !paused; updatePreference(); });
    wrap.append(toggle);
  }
  updatePreference();
  if (preference.addEventListener) preference.addEventListener('change', updatePreference);
  else preference.addListener?.(updatePreference);

  const observed = new Set();
  const activeReveals = new Set();
  const reveal = (element, delay = 0) => {
    if (!element || element.contains(document.activeElement)) return;
    element.dataset.motionKind ||= 'fade-slide';
    const result = effect(element, [
      { opacity: .65, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 460, delay, fill: 'backwards' });
    revealStates.set(element, { cleanup: () => result.animation?.cancel() });
  };
  const revealPhoto = image => {
    if (!image || image.hidden || !motionAllowed()) return;
    image.dataset.motionKind = 'photo-mask';
    const result = effect(image, [
      { clipPath: 'inset(0 0 5% 0)', transform: 'scale(1.015)' },
      { clipPath: 'inset(0 0 0% 0)', transform: 'scale(1)' }
    ], { duration: 520 });
    revealStates.set(image, { cleanup: () => result.animation?.cancel() });
  };
  const group = (element, selector) => {
    element.dataset.motionKind = 'stagger-group';
    element.querySelectorAll(selector).forEach((child, index) => {
      child.dataset.motionStagger = String(index * 40);
      reveal(child, index * 40);
    });
  };
  const start = element => {
    if (element.matches('.steps-heading, .booking-title')) reveal(element);
    else if (element.matches('.about-photo-card img, .about-braces img')) revealPhoto(element);
    else if (element.matches('.metrics-row')) group(element, '.metric-card');
    else if (element.matches('.steps-grid')) group(element, '.step-card');
    else if (element.matches('.services-list')) group(element, '.service-item-row');
    else reveal(element, Number(element.dataset.revealDelay || 0));
  };

  const settle = element => {
    observer?.unobserve(element); observed.delete(element); activeReveals.delete(element);
    [element, ...element.querySelectorAll('[data-motion-kind], [data-motion-stagger]')]
      .forEach(target => revealStates.get(target)?.cleanup());
    element.dataset.revealState = 'complete';
  };
  const settleVisible = () => {
    activeReveals.forEach(element => {
      if (element.getBoundingClientRect().top <= window.innerHeight + 24) settle(element);
    });
  };
  window.addEventListener('scroll', settleVisible, {passive:true});
  window.addEventListener('resize', settleVisible, {passive:true});

  // Only a just-finished, genuinely ready intro may choreograph the hero.
  // Cached/repeat/timeout/interaction paths keep the already readable page final.
  const heroReady = loading.ready || Promise.resolve({animateHero:false});
  heroReady.then(result => {
    const hero = document.querySelector('#hero');
    if (!result.animateHero || !motionAllowed() || document.hidden || window.scrollY > 4 || location.hash) {
      if (hero) hero.dataset.entranceState = 'complete';
      return;
    }
    if (hero) hero.dataset.entranceState = 'playing';
    revealHeroLines(document.querySelector('.hero-top .title-hero'), 0);
    const implant = document.querySelector('.hero-implant-enter');
    const watermark = document.querySelector('.hero-watermark');
    if (implant) {
      implant.dataset.motionKind = 'hero-implant';
      const result = effect(implant, [
        { transform: 'translateY(32px) scale(.9)', opacity: 0 },
        { transform: 'translateY(0) scale(1)', opacity: 1 }
      ], { duration: 1500, delay: 180, fill: 'backwards' });
      revealStates.set(implant, { cleanup: () => result.animation?.cancel() });
    }
    if (watermark) {
      watermark.dataset.motionKind = 'hero-watermark';
      const result = effect(watermark, [{ opacity: 0 }, { opacity: 1 }], { duration: 1400, delay: 300, fill: 'backwards' });
      revealStates.set(watermark, { cleanup: () => result.animation?.cancel() });
    }
    revealHeroLines(document.querySelector('.hero-bottom-content > h2'), 500);
    document.querySelectorAll('.hud-cluster, .hero-cta-wrap, .hero-metadata-bar').forEach((element, index) => reveal(element, 500 + index * 70));
    Promise.all([...running].map(animation => animation.finished?.catch(() => {}) || Promise.resolve()))
      .then(() => { if (hero) hero.dataset.entranceState = 'complete'; });
  }).catch(() => {});

  // Only these roots are observed: children never receive a second parent reveal.
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        observed.delete(entry.target);
        if (!motionAllowed() || !shouldRevealAhead(entry.target.getBoundingClientRect(), window.innerHeight,
            entry.target.contains(document.activeElement))) { settle(entry.target); continue; }
        entry.target.dataset.revealState = 'ahead';
        activeReveals.add(entry.target);
        start(entry.target);
      }
    }, { threshold: 0, rootMargin: '0px 0px 420px 0px' });
    document.querySelectorAll(
      '.about-photo-card img, .about-braces img, .about-text-content, ' +
      '.metrics-row, .services-list, .service-preview-card, .steps-heading, .steps-grid, ' +
      '.price-category-card, .booking-title, .booking-call-block, .booking-form-wrap, .faq-list, .footer-columns-grid'
    ).forEach((element, index) => {
      element.dataset.revealDelay = String(element.classList.contains('price-category-card') ? index % 2 * 40 : 0);
      observed.add(element);
      observer.observe(element);
    });
  }

  // Focused controls and all their animated descendants reveal immediately.
  document.addEventListener('focusin', event => {
    settleFocusedPreview(event.target);
    [...observed, ...activeReveals].forEach(element => {
      if (element.contains(event.target) || event.target.contains(element)) settle(element);
    });
    document.querySelectorAll('[data-motion-kind], [data-motion-stagger]').forEach(element => {
      if (element.contains(event.target) || event.target.contains(element)) {
        revealStates.get(element)?.cleanup();
        observer?.unobserve(element);
        observed.delete(element);
      }
    });
  });
}
