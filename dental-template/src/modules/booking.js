/** All choices are local demo state. No request is sent or appointment made. */
export function initBooking() {
  const form = document.querySelector('.booking-form');
  if (!form) return;
  const phone = form.querySelector('[name="phone"]');
  const name = form.querySelector('[name="name"]');
  const consent = form.querySelector('[name="consent"]');
  const status = form.querySelector('.booking-toast');
  const dayContainer = form.querySelector('.calendar-days-container');
  const current = new Date();
  const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(current);
  const part = type => dateParts.find(item => item.type === type).value;
  const start = Date.UTC(+part('year'), +part('month') - 1, +part('day'), 12);
  if (dayContainer) {
    dayContainer.replaceChildren(...Array.from({ length: 12 }, (_, index) => {
      const date = new Date(start + index * 86400000);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'day-card-btn';
      const weekday = document.createElement('span'); weekday.className = 'day-badge';
      weekday.textContent = index === 0 ? 'СЕГОДНЯ' : index === 1 ? 'ЗАВТРА' : date.toLocaleDateString('ru-RU', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
      const day = document.createElement('span'); day.className = 'day-date'; day.textContent = date.getUTCDate();
      const month = document.createElement('span'); month.className = 'day-month'; month.textContent = date.toLocaleDateString('ru-RU', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase();
      button.dataset.date = date.toISOString().slice(0,10);
      button.setAttribute('aria-label', date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }));
      button.append(weekday, day, month); return button;
    }));
  }
  const bindSingleChoice = (selector, allowEmpty = false) => {
    const choices = [...form.querySelectorAll(selector)];
    choices.forEach(choice => {
      choice.setAttribute('aria-pressed', String(choice.classList.contains('is-selected')));
      choice.addEventListener('click', () => {
        const selected = allowEmpty && choice.classList.contains('is-selected') ? null : choice;
        choices.forEach(item => { const active = item === selected; item.classList.toggle('is-selected', active); item.setAttribute('aria-pressed', String(active)); });
      });
    });
  };
  bindSingleChoice('.chip-btn', true); bindSingleChoice('.day-card-btn'); bindSingleChoice('.time-slot-btn');
  phone?.addEventListener('input', () => {
    let digits = phone.value.replace(/\D/g, '');
    if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
    digits = digits.slice(0,10);
    let formatted = digits ? '+7 (' + digits.slice(0,3) : '';
    if (digits.length >= 3) formatted += ') ' + digits.slice(3,6);
    if (digits.length >= 6) formatted += '-' + digits.slice(6,8);
    if (digits.length >= 8) formatted += '-' + digits.slice(8,10);
    phone.value = formatted; phone.removeAttribute('aria-invalid');
  });
  name?.addEventListener('input', () => name.removeAttribute('aria-invalid'));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const show = text => { status.textContent = text; status.classList.add('is-visible'); };
    if (!name.value.trim()) { name.setAttribute('aria-invalid', 'true'); show('Укажите имя для черновика. Ничего не отправлено.'); name.focus(); return; }
    if (phone.value.replace(/\D/g, '').length !== 11) { phone.setAttribute('aria-invalid', 'true'); show('Укажите полный номер телефона. Ничего не отправлено.'); phone.focus(); return; }
    if (!consent.checked) { show('Подтвердите согласие для проверки демо-формы. Данные остаются в браузере и не отправляются.'); consent.focus(); return; }
    const service = form.querySelector('.chip-btn.is-selected')?.textContent.trim() || 'Не выбрана';
    const day = form.querySelector('.day-card-btn.is-selected')?.getAttribute('aria-label') || 'Не выбран';
    const time = form.querySelector('.time-slot-btn.is-selected')?.textContent.trim() || 'Не выбрано';
    const comment = form.querySelector('[name="comment"]')?.value.trim();
    show(['Черновик готов. Ничего не отправлено, запись не создана.', `Имя: ${name.value.trim()}`, `Телефон: ${phone.value}`, `Услуга: ${service}`, `День: ${day}`, `Время: ${time}`, comment ? `Комментарий: ${comment}` : ''].filter(Boolean).join('\n'));
    status.focus({ preventScroll: true });
  });
}
export function selectServiceChip(title = '') {
  document.querySelectorAll('.chip-btn').forEach(chip => {
    const active = chip.textContent.trim().toLocaleLowerCase('ru-RU') === title.trim().toLocaleLowerCase('ru-RU');
    chip.classList.toggle('is-selected', active); chip.setAttribute('aria-pressed', String(active));
  });
}
