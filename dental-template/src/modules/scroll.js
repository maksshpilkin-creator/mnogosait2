import { selectServiceChip } from './booking.js';
import { containFocus } from './focus.js';
export function initScroll() {
  const trigger = document.querySelector('.btn-menu');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const backdrop = document.querySelector('.mobile-nav-backdrop');
  let releaseFocus;
  function close(restore = true) {
    releaseFocus?.(restore); releaseFocus = null;
    drawer?.classList.remove('is-open'); backdrop?.classList.remove('is-open');
    drawer?.setAttribute('aria-hidden', 'true'); if (drawer) drawer.inert = true;
    trigger?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('modal-open');
  }
  trigger?.addEventListener('click', () => {
    if (!drawer) return;
    drawer.inert = false; drawer.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    drawer.classList.add('is-open'); backdrop?.classList.add('is-open');
    document.body.classList.add('modal-open');
    releaseFocus = containFocus(drawer);
  });
  document.querySelector('.mobile-nav-close')?.addEventListener('click', () => close());
  backdrop?.addEventListener('click', () => close());
  drawer?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => close()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drawer?.classList.contains('is-open')) close();
  });
  document.querySelector('.btn-back-to-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'auto' }));
  document.querySelectorAll('.btn-price-book').forEach(link => link.addEventListener('click', event => {
    event.preventDefault(); selectServiceChip(link.dataset.serviceName);
    document.querySelector('#booking')?.scrollIntoView({ behavior: 'auto' });
    document.querySelector('#client-name')?.focus({ preventScroll: true });
  }));
}
