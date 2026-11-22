import clinicData from '../data/clinic.json';
import { openModal } from './modal.js';
let currentServiceId = 'therapy';
export function initServices() {
  const rows = [...document.querySelectorAll('.service-item-row')];
  const panel = document.querySelector('.service-preview-card');
  if (!rows.length) return;
  function activate(id, moveFocus = false) {
    const service = clinicData.services.find(item => item.id === id);
    if (!service) return;
    currentServiceId = id;
    rows.forEach(row => {
      const active = row.dataset.serviceId === id;
      row.classList.toggle('is-active', active);
      row.setAttribute('aria-selected', String(active));
      row.tabIndex = active ? 0 : -1;
      if (active && moveFocus) row.focus();
    });
    panel?.setAttribute('aria-labelledby', `service-tab-${id}`);
    const image = document.querySelector('.preview-image');
    if (image) { image.src = service.image; image.alt = `Иллюстрация направления «${service.title}»`; }
    const fields = { '.preview-badge-overlay': service.code, '.preview-code': service.code, '.preview-duration': service.duration, '.preview-summary': service.summary, '.preview-price-val': service.priceFrom };
    for (const [selector, text] of Object.entries(fields)) {
      const element = document.querySelector(selector); if (element) element.textContent = text;
    }
  }
  rows.forEach((row, index) => {
    const id = row.dataset.serviceId;
    row.addEventListener('mouseenter', () => activate(id));
    row.addEventListener('click', () => activate(id));
    row.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % rows.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + rows.length - 1) % rows.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = rows.length - 1;
      if (next !== null) { event.preventDefault(); activate(rows[next].dataset.serviceId, true); }
    });
  });
  document.querySelector('.btn-service-detail')?.addEventListener('click', () => openModal(currentServiceId));
  activate('therapy');
}
export function getCurrentServiceId() { return currentServiceId; }
