/**
 * Web Audio API Tactile Micro-Feedback
 * Synthesized audio clicks & ignition chords without any external audio files.
 */
let audioCtx = null;
let isAudioEnabled = false;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playMechanicalClick(freq = 1200, duration = 0.018) {
  if (!isAudioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio restrictions/permissions fail-safe
  }
}

export function playIgnitionPurr() {
  if (!isAudioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Dual oscillator low exhaust hum
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(75, now);
    osc1.frequency.exponentialRampToValueAtTime(140, now + 0.25);
    osc1.frequency.exponentialRampToValueAtTime(90, now + 0.45);

    osc2.frequency.setValueAtTime(150, now);
    osc2.frequency.exponentialRampToValueAtTime(280, now + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(180, now + 0.45);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch {
    // Audio fail-safe
  }
}

export function initAudioFeedback() {
  try {
    isAudioEnabled = localStorage.getItem('triamoto-audio-enabled') === 'true';
  } catch {
    isAudioEnabled = false;
  }

  const toggleBtn = document.querySelector('.btn-audio-toggle');
  const updateToggleUI = () => {
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', String(isAudioEnabled));
      toggleBtn.classList.toggle('is-muted', !isAudioEnabled);
      const label = toggleBtn.querySelector('.audio-label');
      if (label) label.textContent = isAudioEnabled ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ';
    }
  };

  updateToggleUI();

  toggleBtn?.addEventListener('click', () => {
    isAudioEnabled = !isAudioEnabled;
    try {
      localStorage.setItem('triamoto-audio-enabled', String(isAudioEnabled));
    } catch {
      // Storage restriction
    }
    updateToggleUI();
    if (isAudioEnabled) {
      getAudioContext();
      playMechanicalClick(1400, 0.02);
    }
  });

  // Attach tactile clicks to interactive buttons and tabs
  const interactiveSelectors = [
    '.btn-header-cta',
    '.chip-btn',
    '.day-card-btn',
    '.time-slot-btn',
    '.service-item-row',
    '.price-row-action',
    '.faq-header-btn',
    '.btn-service-detail',
    '.calc-chip',
    '.quiz-btn'
  ];

  document.addEventListener('click', event => {
    const target = event.target.closest(interactiveSelectors.join(','));
    if (target) {
      playMechanicalClick(1100, 0.015);
      if (navigator.vibrate) {
        try { navigator.vibrate(10); } catch {}
      }
    }
  });

  document.querySelector('.hero-circular-btn')?.addEventListener('mouseenter', () => {
    playIgnitionPurr();
  });
}
