import { selectServiceChip } from './booking.js';
import { containFocus } from './focus.js';
import { moveDrawer, motionAllowed, scrollToElement } from './motion.js';
export function initScroll() {
  const trigger = document.querySelector('.btn-menu');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const backdrop = document.querySelector('.mobile-nav-backdrop');
  let releaseFocus;
  function close(restore = true) {
    releaseFocus?.(restore); releaseFocus = null;
    drawer?.setAttribute('aria-hidden', 'true'); if (drawer) drawer.inert = true;
    trigger?.setAttribute('aria-expanded', 'false');
    return moveDrawer(drawer, backdrop, false, 'left');
  }
  trigger?.addEventListener('click', () => {
    if (!drawer) return;
    if (drawer.classList.contains('is-open')) { close(); return; }
    drawer.inert = false; drawer.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    moveDrawer(drawer, backdrop, true, 'left');
    releaseFocus = containFocus(drawer);
  });
  document.querySelector('.mobile-nav-close')?.addEventListener('click', () => close());
  backdrop?.addEventListener('click', () => close());
  drawer?.querySelectorAll('a').forEach(link => link.addEventListener('click', async event => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    const closed = await close(false);
    if (!closed) return;
    scrollToElement(target);
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drawer?.classList.contains('is-open')) close();
  });
  document.querySelector('.btn-back-to-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: motionAllowed() ? 'smooth' : 'auto' }));
  document.querySelectorAll('.btn-price-book').forEach(link => link.addEventListener('click', event => {
    event.preventDefault(); selectServiceChip(link.dataset.serviceName);
    scrollToElement(document.querySelector('#booking'));
    document.querySelector('#client-name')?.focus({ preventScroll: true });
  }));
  document.querySelector('.hero-circular-btn')?.addEventListener('click', event => {
    event.preventDefault();
    scrollToElement(document.querySelector('#booking'));
    document.querySelector('#client-name')?.focus({ preventScroll: true });
  });
}
