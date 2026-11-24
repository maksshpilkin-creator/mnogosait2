import clinicData from '../data/clinic.json';
import { selectServiceChip } from './booking.js';
import { containFocus } from './focus.js';
import { moveDrawer, scrollToElement } from './motion.js';
let drawer, backdrop, releaseFocus;
export function initModal() {
  drawer = document.querySelector('.price-drawer');
  backdrop = document.querySelector('.modal-backdrop');
  if (!drawer || !backdrop) return;
  document.querySelector('.btn-drawer-close')?.addEventListener('click', () => closeModal());
  backdrop.addEventListener('click', () => closeModal());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeModal();
  });
  document.querySelector('.btn-drawer-cta')?.addEventListener('click', async event => {
    const title = event.currentTarget.dataset.targetService;
    const closed = await closeModal(false);
    if (!closed) return;
    selectServiceChip(title);
    scrollToElement(document.querySelector('#booking'));
    document.querySelector('#client-name')?.focus({ preventScroll: true });
  });
}
export function openModal(id) {
  if (!drawer || !backdrop) return;
  const service = clinicData.services.find(item => item.id === id) || clinicData.services[0];
  const values = { '.drawer-meta': `${service.code} / ${service.duration}`, '.drawer-title': service.title, '.drawer-lead': service.summary, '.drawer-deep': service.deepDescription };
  for (const [selector, text] of Object.entries(values)) drawer.querySelector(selector).textContent = text;
  const image = drawer.querySelector('.drawer-image');
  image.src = service.image; image.alt = `Иллюстрация направления «${service.title}»`;
  const table = drawer.querySelector('.drawer-price-table');
  table.replaceChildren(...service.prices.map(item => {
    const row = document.createElement('div'); row.className = 'drawer-price-row';
    const name = document.createElement('span'); name.className = 'drawer-price-name'; name.textContent = item.name;
    const price = document.createElement('span'); price.className = 'drawer-price-val'; price.textContent = item.price;
    row.append(name, price); return row;
  }));
  const cta = drawer.querySelector('.btn-drawer-cta');
  cta.textContent = `ВЫБРАТЬ «${service.title}» В ДЕМО-ФОРМЕ`;
  cta.dataset.targetService = service.title;
  drawer.inert = false;
  drawer.setAttribute('aria-hidden', 'false');
  moveDrawer(drawer, backdrop, true);
  drawer.scrollTop = 0;
  releaseFocus?.(false); releaseFocus = containFocus(drawer);
}
export function closeModal(restore = true) {
  if (!drawer || !backdrop) return Promise.resolve(false);
  releaseFocus?.(restore); releaseFocus = null;
  drawer.setAttribute('aria-hidden', 'true'); drawer.inert = true;
  return moveDrawer(drawer, backdrop, false);
}
