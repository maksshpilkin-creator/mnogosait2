/**
 * Live Working Hours & Salon Status for Триамото (Дзержинск)
 */
export function initSalonStatus() {
  const badge = document.querySelector('.live-salon-status');
  if (!badge) return;

  function checkStatus() {
    const now = new Date();
    // Format to Moscow time
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Moscow',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short'
    });
    const parts = formatter.formatToParts(now);
    const hour = Number(parts.find(p => p.type === 'hour')?.value || 12);
    const minute = Number(parts.find(p => p.type === 'minute')?.value || 0);
    const weekday = parts.find(p => p.type === 'weekday')?.value || 'Mon';

    const currentMinutes = hour * 60 + minute;
    let isOpen = false;
    let closingTime = '18:00';

    if (weekday === 'Sun') {
      isOpen = false;
    } else if (weekday === 'Sat') {
      isOpen = currentMinutes >= 10 * 60 && currentMinutes < 15 * 60;
      closingTime = '15:00';
    } else {
      // Mon-Fri
      isOpen = currentMinutes >= 9 * 60 && currentMinutes < 18 * 60;
      closingTime = '18:00';
    }

    if (isOpen) {
      badge.innerHTML = `<span class="status-pulse-dot"></span> <span>ШОУРУМ ОТКРЫТ ДО ${closingTime} (УЛ. МАЯКОВСКОГО, 35)</span>`;
      badge.classList.add('is-open');
      badge.classList.remove('is-closed');
    } else {
      badge.innerHTML = `<span class="status-offline-dot"></span> <span>ШОУРУМ ОТКРОЕТСЯ В 09:00 · ПРИНИМАЕМ ЗАЯВКИ ОНЛАЙН 24/7</span>`;
      badge.classList.add('is-closed');
      badge.classList.remove('is-open');
    }
  }

  checkStatus();
  setInterval(checkStatus, 60000);
}
