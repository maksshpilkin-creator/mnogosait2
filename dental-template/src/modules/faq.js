import { moveAccordion } from './motion.js';
export function initFAQ() {
  const items = [...document.querySelectorAll('.faq-item')];
  const setOpen = (item, open) => {
    const button = item.querySelector('.faq-header-btn');
    const body = item.querySelector('.faq-body-collapse');
    if (!button || !body) return;
    moveAccordion(body, open);
    item.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
  };
  items.forEach((item, index) => {
    const button = item.querySelector('.faq-header-btn');
    const body = item.querySelector('.faq-body-collapse');
    const icon = item.querySelector('.faq-toggle-icon');
    if (!button || !body) return;
    body.id = `faq-answer-${index + 1}`;
    button.id = `faq-question-${index + 1}`;
    button.setAttribute('aria-controls', body.id);
    body.setAttribute('aria-labelledby', button.id);
    body.setAttribute('role', 'region');
    body.hidden = !item.classList.contains('is-open');
    if (icon) { icon.textContent = ''; icon.setAttribute('aria-hidden', 'true'); }
    button.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      items.forEach(other => {
        if (other !== item && other.classList.contains('is-open')) setOpen(other, false);
      });
      setOpen(item, open);
    });
  });
}
