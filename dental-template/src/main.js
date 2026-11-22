/**
 * Clinic «ЭМАЛЬ» Main Application Entrypoint
 */

// Import Styles
import './styles/site.css';

// Import Modules
import { initServices } from './modules/services.js';
import { initModal } from './modules/modal.js';
import { initBooking } from './modules/booking.js';
import { initFAQ } from './modules/faq.js';
import { initScroll } from './modules/scroll.js';

document.addEventListener('DOMContentLoaded', () => {
  initModal();
  initServices();
  initBooking();
  initFAQ();
  initScroll();

  document.querySelectorAll('img').forEach(image => {
    let fallback;
    const missing = () => {
      image.hidden = true;
      if (!fallback) {
        fallback = document.createElement('span');
        fallback.className = 'image-fallback';
        fallback.textContent = image.alt || 'Иллюстрация демо-клиники';
        image.parentElement.append(fallback);
      }
      fallback.hidden = false;
    };
    image.addEventListener('error', missing);
    image.addEventListener('load', () => {
      image.hidden = false;
      if (fallback) fallback.hidden = true;
    });
    if (image.complete && !image.naturalWidth) missing();
  });
});
