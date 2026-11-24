/**
 * Interactive Rider Sizing & Bike Matcher Wizard for Триамото
 */
import { selectServiceChip } from './booking-moto.js';

export function initMatcherMoto() {
  const container = document.querySelector('#rider-matcher');
  if (!container) return;

  const heightSlider = container.querySelector('#matcher-height-slider');
  const heightValDisplay = container.querySelector('#matcher-height-val');
  const styleChips = [...container.querySelectorAll('.matcher-style-chip')];

  const resultTitle = container.querySelector('#matcher-bike-title');
  const resultSaddle = container.querySelector('#matcher-bike-saddle');
  const resultReason = container.querySelector('#matcher-bike-reason');
  const resultPrice = container.querySelector('#matcher-bike-price');
  const bookBtn = container.querySelector('#matcher-book-btn');

  let currentHeight = Number(heightSlider?.value || 176);
  let currentStyle = 'enduro'; // default

  const recommendations = {
    pitbike: {
      title: 'Питбайк BSE MX 125 (колеса 17/14)',
      saddle: 'Высота по седлу: 840 мм',
      price: 'от 85 000 ₽',
      chipCategory: 'Питбайки',
      reason: 'При таком росте и задачах питбайк даёт 100% уверенность: обе ноги уверенно достают до земли, байк весит всего 75 кг, легко управляется в узком лесу и на дачных тропах.'
    },
    enduro_light: {
      title: 'Эндуро BSE Z3 250 (ZS172FMM, 21 л.с.)',
      saddle: 'Высота по седлу: 890 мм',
      price: 'от 147 000 ₽',
      chipCategory: 'Эндуро',
      reason: 'Золотая середина для эндуро: полноценная база 1420 мм, надежный тяговитый мотор 172FMM, регулируемая вилка. Идеальный баланс веса и тяги на низах для горок и бревен.'
    },
    enduro_pro: {
      title: 'Regulmoto Sport 003 Pro (NB300, 28 л.с.)',
      saddle: 'Высота по седлу: 930 мм',
      price: 'от 189 000 ₽',
      chipCategory: 'Эндуро',
      reason: 'Для высокого райдера и агрессивных скоростных заездов: мощный 300-кубовый мотор с водяным охлаждением, длинноходная энергоемкая подвеска 48 мм и высокий клиренс 320 мм.'
    },
    atv: {
      title: 'Квадроцикл Regulmoto Athlete 200 (вариатор)',
      saddle: 'Универсальная посадка со спинкой',
      price: 'от 230 000 ₽',
      chipCategory: 'Квадроциклы',
      reason: 'Максимум комфорта и утилитарности: независимая подвеска, лебедка, багажники спереди и сзади. Никакой усталости в коленях и спине при многочасовых поездках.'
    }
  };

  function updateMatch() {
    if (heightValDisplay) heightValDisplay.textContent = `${currentHeight} см`;

    let matchKey = 'enduro_light';

    if (currentStyle === 'atv') {
      matchKey = 'atv';
    } else if (currentHeight < 165 || currentStyle === 'pitbike') {
      matchKey = 'pitbike';
    } else if (currentHeight >= 180 && currentStyle === 'hard') {
      matchKey = 'enduro_pro';
    } else if (currentStyle === 'hard') {
      matchKey = 'enduro_pro';
    } else {
      matchKey = 'enduro_light';
    }

    const item = recommendations[matchKey];
    if (resultTitle) resultTitle.textContent = item.title;
    if (resultSaddle) resultSaddle.textContent = item.saddle;
    if (resultReason) resultReason.textContent = item.reason;
    if (resultPrice) resultPrice.textContent = item.price;

    if (bookBtn) {
      bookBtn.dataset.targetCategory = item.chipCategory;
      bookBtn.dataset.targetModel = item.title;
    }
  }

  heightSlider?.addEventListener('input', () => {
    currentHeight = Number(heightSlider.value);
    updateMatch();
  });

  styleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      styleChips.forEach(c => {
        c.classList.remove('is-active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-active');
      chip.setAttribute('aria-pressed', 'true');
      currentStyle = chip.dataset.style || 'enduro';
      updateMatch();
    });
  });

  bookBtn?.addEventListener('click', () => {
    const category = bookBtn.dataset.targetCategory;
    const model = bookBtn.dataset.targetModel;
    if (category) selectServiceChip(category);
    const commentInput = document.querySelector('#client-comment');
    if (commentInput) {
      commentInput.value = `Подобранная модель: ${model} (рост ${currentHeight} см)`;
    }
    const bookingSection = document.querySelector('#booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        document.querySelector('#client-name')?.focus({ preventScroll: true });
      }, 500);
    }
  });

  updateMatch();
}
