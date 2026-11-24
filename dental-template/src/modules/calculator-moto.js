/**
 * Interactive Moto Loan & Installment Calculator for Триамото
 */
export function initCalculatorMoto() {
  const calcContainer = document.querySelector('#moto-calculator');
  if (!calcContainer) return;

  const priceInput = calcContainer.querySelector('#calc-price-range');
  const priceDisplay = calcContainer.querySelector('#calc-price-val');
  const downPaymentChips = [...calcContainer.querySelectorAll('.calc-down-chip')];
  const termChips = [...calcContainer.querySelectorAll('.calc-term-chip')];
  const monthlyPaymentDisplay = calcContainer.querySelector('#calc-monthly-val');
  const sendWhatsAppBtn = calcContainer.querySelector('#calc-send-wa');

  let currentPrice = Number(priceInput?.value || 147000);
  let currentDownRate = 0.2; // 20%
  let currentTerm = 12; // 12 months

  function calculate() {
    const downAmount = Math.round(currentPrice * currentDownRate);
    const loanBody = currentPrice - downAmount;
    // Approximated bank rate: ~14% per year / 1.166% per month
    const monthlyRate = 0.012;
    let monthly;
    if (loanBody <= 0) {
      monthly = 0;
    } else {
      monthly = Math.round((loanBody * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -currentTerm)));
    }

    if (priceDisplay) priceDisplay.textContent = `${currentPrice.toLocaleString('ru-RU')} ₽`;
    if (monthlyPaymentDisplay) monthlyPaymentDisplay.textContent = `от ${monthly.toLocaleString('ru-RU')} ₽ / мес`;

    const summaryText = [
      `Здравствуйте! Рассчитал рассрочку на сайте «Триамото» (Дзержинск):`,
      `Стоимость техники: ${currentPrice.toLocaleString('ru-RU')} ₽`,
      `Первый взнос: ${downAmount.toLocaleString('ru-RU')} ₽ (${Math.round(currentDownRate * 100)}%)`,
      `Срок: ${currentTerm} мес.`,
      `Платеж: от ${monthly.toLocaleString('ru-RU')} ₽/мес.`,
      `Хочу уточнить одобрение и наличие техники.`
    ].join('\n');

    if (sendWhatsAppBtn) {
      sendWhatsAppBtn.href = `https://wa.me/79159401555?text=${encodeURIComponent(summaryText)}`;
    }
  }

  priceInput?.addEventListener('input', () => {
    currentPrice = Number(priceInput.value);
    calculate();
  });

  downPaymentChips.forEach(chip => {
    chip.addEventListener('click', () => {
      downPaymentChips.forEach(c => {
        c.classList.remove('is-active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-active');
      chip.setAttribute('aria-pressed', 'true');
      currentDownRate = Number(chip.dataset.rate || 0.2);
      calculate();
    });
  });

  termChips.forEach(chip => {
    chip.addEventListener('click', () => {
      termChips.forEach(c => {
        c.classList.remove('is-active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-active');
      chip.setAttribute('aria-pressed', 'true');
      currentTerm = Number(chip.dataset.months || 12);
      calculate();
    });
  });

  calculate();
}
