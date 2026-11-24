/**
 * Триамото — Мотосалон в Дзержинске
 * Основная точка входа для страницы triamoto.html
 */

// Import Styles
import './styles/site.css';
import './styles/motion.css';
import './styles/refinement.css';
import './styles/triamoto.css';

// Import Core Moto Modules
import { initServicesMoto } from './modules/services-moto.js';
import { initModalMoto } from './modules/modal-moto.js';
import { initBookingMoto, selectServiceChip } from './modules/booking-moto.js';
import { initFAQ } from './modules/faq.js';
import { initScroll } from './modules/scroll.js';
import { initMotion } from './modules/motion.js';
import { initScrollScenes } from './modules/scroll-scenes.js';
import { initLoading } from './modules/loading.js';

// Import New Pro-Skills Modules
import { initAudioFeedback } from './modules/audio-feedback.js';
import { initHeroParticles } from './modules/hero-particles.js';
import { initCalculatorMoto } from './modules/calculator-moto.js';
import { initMatcherMoto } from './modules/matcher-moto.js';
import { initSalonStatus } from './modules/salon-status.js';

document.addEventListener('DOMContentLoaded', () => {
  const loading = initLoading();
  initModalMoto();
  initServicesMoto();
  initBookingMoto();
  initFAQ();
  initScroll();
  initMotion(loading);
  initScrollScenes();

  // Initialize New Advanced Features
  initAudioFeedback();
  initHeroParticles();
  initCalculatorMoto();
  initMatcherMoto();
  initSalonStatus();

  // Price table link click handler -> auto selects the category in booking form
  document.querySelectorAll('.price-row-action').forEach(actionLink => {
    actionLink.addEventListener('click', event => {
      event.preventDefault();
      const targetCategory = actionLink.dataset.serviceName;
      if (targetCategory) {
        selectServiceChip(targetCategory);
      }
      const bookingSection = document.querySelector('#booking');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          document.querySelector('#client-name')?.focus({ preventScroll: true });
        }, 500);
      }
    });
  });

  // Missing image fallback
  document.querySelectorAll('img').forEach(image => {
    let fallback;
    const missing = () => {
      image.hidden = true;
      if (!fallback) {
        fallback = document.createElement('span');
        fallback.className = 'image-fallback';
        fallback.textContent = image.alt || 'Мототехника Триамото (Дзержинск)';
        image.parentElement.append(fallback);
      }
      fallback.hidden = false;
    };
    image.addEventListener('error', missing);
    image.addEventListener('load', () => {
      image.hidden = false;
      if (fallback) fallback.hidden = true;
    });
    if (image.getAttribute('src') && image.complete && !image.naturalWidth) missing();
  });
});
