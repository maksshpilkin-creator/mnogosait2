export function initFAQ() {
  document.querySelectorAll('.faq-item').forEach((item, index) => {
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
    button.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      body.hidden = !open;
      if (icon) icon.textContent = open ? '—' : '+';
    });
  });
}
