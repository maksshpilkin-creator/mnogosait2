/**
 * Booking / Selection module for Триамото (Дзержинск)
 */
export function initBookingMoto() {
  const form = document.querySelector('.booking-form');
  if (!form) return;
  const phone = form.querySelector('[name="phone"]');
  const name = form.querySelector('[name="name"]');
  const consent = form.querySelector('[name="consent"]');
  const status = form.querySelector('.booking-toast');
  const dayContainer = form.querySelector('.calendar-days-container');

  const current = new Date();
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(current);
  const part = type => dateParts.find(item => item.type === type).value;
  const start = Date.UTC(+part('year'), +part('month') - 1, +part('day'), 12);

  if (dayContainer) {
    dayContainer.replaceChildren(...Array.from({ length: 12 }, (_, index) => {
      const date = new Date(start + index * 86400000);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'day-card-btn';
      const weekday = document.createElement('span');
      weekday.className = 'day-badge';
      weekday.textContent = index === 0 ? 'СЕГОДНЯ' : index === 1 ? 'ЗАВТРА' : date.toLocaleDateString('ru-RU', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
      const day = document.createElement('span');
      day.className = 'day-date';
      day.textContent = date.getUTCDate();
      const month = document.createElement('span');
      month.className = 'day-month';
      month.textContent = date.toLocaleDateString('ru-RU', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase();
      button.dataset.date = date.toISOString().slice(0, 10);
      button.setAttribute('aria-label', date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }));
      button.append(weekday, day, month);
      return button;
    }));
  }

  const bindSingleChoice = (selector, allowEmpty = false) => {
    const choices = [...form.querySelectorAll(selector)];
    choices.forEach(choice => {
      choice.setAttribute('aria-pressed', String(choice.classList.contains('is-selected')));
      choice.addEventListener('click', () => {
        const selected = allowEmpty && choice.classList.contains('is-selected') ? null : choice;
        choices.forEach(item => {
          const active = item === selected;
          item.classList.toggle('is-selected', active);
          item.setAttribute('aria-pressed', String(active));
        });
      });
    });
  };

  bindSingleChoice('.chip-btn', true);
  bindSingleChoice('.day-card-btn');
  bindSingleChoice('.time-slot-btn');

  phone?.addEventListener('input', () => {
    let digits = phone.value.replace(/\D/g, '');
    if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    let formatted = digits ? '+7 (' + digits.slice(0, 3) : '';
    if (digits.length >= 3) formatted += ') ' + digits.slice(3, 6);
    if (digits.length >= 6) formatted += '-' + digits.slice(6, 8);
    if (digits.length >= 8) formatted += '-' + digits.slice(8, 10);
    phone.value = formatted;
    phone.removeAttribute('aria-invalid');
  });

  name?.addEventListener('input', () => name.removeAttribute('aria-invalid'));

  form.addEventListener('submit', event => {
    event.preventDefault();

    const show = (text, isSuccess = false, waPayload = '') => {
      status.replaceChildren();
      const textElem = document.createElement('div');
      textElem.style.whiteSpace = 'pre-line';
      textElem.textContent = text;
      status.appendChild(textElem);

      if (isSuccess && waPayload) {
        const actions = document.createElement('div');
        actions.className = 'booking-toast-actions';
        actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;';

        const waBtn = document.createElement('a');
        waBtn.href = `https://wa.me/79159401555?text=${encodeURIComponent(waPayload)}`;
        waBtn.target = '_blank';
        waBtn.rel = 'noopener';
        waBtn.className = 'btn-toast-wa';
        waBtn.style.cssText = 'background:#1B8742;color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:6px;';
        waBtn.textContent = 'Отправить в WhatsApp (+7 915 940-15-55)';

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.style.cssText = 'background:#ffffff20;color:#fff;border:1px solid #ffffff40;padding:8px 16px;border-radius:4px;font-size:12px;cursor:pointer;';
        copyBtn.textContent = 'Скопировать черновик';
        copyBtn.addEventListener('click', () => {
          navigator.clipboard?.writeText(waPayload).then(() => {
            copyBtn.textContent = 'Скопировано в буфер!';
            setTimeout(() => { copyBtn.textContent = 'Скопировать черновик'; }, 2000);
          });
        });

        actions.append(waBtn, copyBtn);
        status.appendChild(actions);
      }

      status.classList.add('is-visible');
      status.focus({ preventScroll: true });
    };

    if (!name.value.trim()) {
      name.setAttribute('aria-invalid', 'true');
      show('Укажите ваше имя для черновика заявки.');
      name.focus();
      return;
    }
    if (phone.value.replace(/\D/g, '').length !== 11) {
      phone.setAttribute('aria-invalid', 'true');
      show('Укажите корректный телефон для связи.');
      phone.focus();
      return;
    }
    if (!consent.checked) {
      show('Подтвердите согласие на обработку данных для проверки формы.');
      consent.focus();
      return;
    }

    const category = form.querySelector('.chip-btn.is-selected')?.textContent.trim() || 'Уточнить подбор';
    const day = form.querySelector('.day-card-btn.is-selected')?.getAttribute('aria-label') || 'Ближайший день';
    const time = form.querySelector('.time-slot-btn.is-selected')?.textContent.trim() || 'В рабочее время';
    const comment = form.querySelector('[name="comment"]')?.value.trim();

    const draftLines = [
      `Здравствуйте! Пишу с сайта «Триамото» (Дзержинск, ул. Маяковского, 35).`,
      `Интересует: ${category}`,
      `Удобное время для звонка или визита: ${day}, ${time}`,
      `Имя: ${name.value.trim()}`,
      `Телефон: ${phone.value}`,
      comment ? `Вопрос / рост / пожелания: ${comment}` : ''
    ].filter(Boolean);

    const fullPayload = draftLines.join('\n');
    const toastNotice = [
      'Готов черновик запроса в мотосалон «Триамото» (Дзержинск).',
      'Вы можете сразу отправить его в WhatsApp или скопировать.',
      '--------------------------------',
      fullPayload
    ].join('\n');

    show(toastNotice, true, fullPayload);
  });
}

export function selectServiceChip(title = '') {
  document.querySelectorAll('.chip-btn').forEach(chip => {
    const chipText = chip.textContent.trim().toLocaleLowerCase('ru-RU');
    const targetText = title.trim().toLocaleLowerCase('ru-RU');
    const active = chipText === targetText || chipText.includes(targetText) || targetText.includes(chipText);
    chip.classList.toggle('is-selected', active);
    chip.setAttribute('aria-pressed', String(active));
  });
}
