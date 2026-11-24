import clinicData from '../data/clinic.json';
import { openModal } from './modal.js';
import { transitionPreview } from './motion.js';
let currentServiceId = 'therapy';
export function initServices() {
  const rows = [...document.querySelectorAll('.service-item-row')];
  const panel = document.querySelector('.service-preview-card');
  if (!rows.length) return;
  let initialized = false;
  let keyboardMode = false;
  function activate(id, moveFocus = false) {
    const service = clinicData.services.find(item => item.id === id);
    if (!service) return;
    const changed = currentServiceId !== id;
    const previousIndex = clinicData.services.findIndex(item => item.id === currentServiceId);
    const nextIndex = clinicData.services.findIndex(item => item.id === id);
    currentServiceId = id;
    rows.forEach(row => {
      const active = row.dataset.serviceId === id;
      row.classList.toggle('is-active', active);
      row.setAttribute('aria-selected', String(active));
      row.tabIndex = active ? 0 : -1;
      if (active && moveFocus) row.focus();
    });
    panel?.setAttribute('aria-labelledby', `service-tab-${id}`);
    const applyContent = () => {
      const image = document.querySelector('.preview-image');
      if (image) {
        const requested = new URL(service.image, document.baseURI).href;
        if (image.src !== requested) image.src = requested;
        image.alt = `Иллюстрация направления «${service.title}»`;
      }
      const fields = {
        '.preview-badge-overlay': service.code,
        '.preview-code': service.code,
        '.preview-duration': service.duration,
        '.preview-summary': service.summary,
        '.preview-price-val': service.priceFrom
      };
      for (const [selector, text] of Object.entries(fields)) {
        const element = document.querySelector(selector);
        if (element) element.textContent = text;
      }
    };
    if (initialized && changed) transitionPreview(panel, applyContent, nextIndex - previousIndex);
    else applyContent();
    initialized = true;
  }
  rows.forEach((row, index) => {
    const id = row.dataset.serviceId;
    row.addEventListener('mouseenter', () => { if (!keyboardMode) activate(id); });
    row.addEventListener('click', () => { keyboardMode = false; activate(id); });
    row.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % rows.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + rows.length - 1) % rows.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = rows.length - 1;
      if (next !== null) {
        event.preventDefault(); keyboardMode = true;
        activate(rows[next].dataset.serviceId, true);
      }
    });
  });
  // Layout/focus can place a different row beneath an idle cursor. Only genuine
  // pointer movement gives hover ownership back after keyboard navigation.
  document.addEventListener('pointermove', event => {
    if (!keyboardMode || !(event.movementX || event.movementY)) return;
    keyboardMode = false;
    const row = event.target.closest?.('.service-item-row');
    if (rows.includes(row)) activate(row.dataset.serviceId);
  }, { passive: true });
  document.querySelector('.btn-service-detail')?.addEventListener('click', () => openModal(currentServiceId));
  activate('therapy');
}
export function getCurrentServiceId() { return currentServiceId; }
