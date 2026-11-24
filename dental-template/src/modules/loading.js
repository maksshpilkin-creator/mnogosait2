import clinicData from '../data/clinic.json';

/** Bounded readiness has no artificial minimum; rejected assets fail open. */
export function boundedReadiness(tasks, limit = 1700, clock = globalThis) {
  return new Promise(resolve => {
    let settled = false;
    const finish = reason => {
      if (settled) return;
      settled = true; clock.clearTimeout(timer); resolve(reason);
    };
    const timer = clock.setTimeout(() => finish('timeout'), limit);
    Promise.all(tasks).then(() => finish('ready'), () => finish('error'));
  });
}

export function imageReady(image) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => { image.removeEventListener('load', loaded); image.removeEventListener('error', failed); };
    const finish = (ok = true) => {
      if (settled) return;
      settled = true; cleanup();
      if (ok) resolve(); else reject(new Error('Image unavailable'));
    };
    const failed = () => finish(false);
    const loaded = () => {
      if (!image.naturalWidth) { failed(); return; }
      // A failed decode is also an error; the page still remains usable.
      if (typeof image.decode === 'function') image.decode().then(() => finish(), failed);
      else finish();
    };
    image.addEventListener('load', loaded, {once:true});
    image.addEventListener('error', failed, {once:true});
    if (image.complete) loaded();
  });
}

export function initLoading() {
  const intro = window.__emalIntro;
  const active = document.documentElement.dataset.introState === 'active';
  const background = new Image();
  background.fetchPriority = 'high';
  background.src = '/assets/images/optimized/hero-gradient-layer-v1.webp';
  const implant = document.querySelector('.hero-implant-layer');
  const font = document.fonts?.load('900 32px "Roboto Condensed"') || Promise.resolve();
  const tasks = [imageReady(background), implant ? imageReady(implant) : Promise.resolve(), font];
  // Timeout/error completion owns hero choreography; a late decode/font cannot restart it.
  const assets = boundedReadiness(tasks);
  if (active) assets.then(reason => intro?.finish(reason));
  const ready = intro?.done || Promise.resolve({reason:'skip', animateHero:false});

  // Three small service illustrations warm serially, after first-view work has settled.
  const warm = async () => {
    for (const src of new Set(clinicData.services.map(service => service.image))) {
      const image = new Image(); image.fetchPriority = 'low'; image.decoding = 'async'; image.src = src;
      await boundedReadiness([imageReady(image)], 2000);
    }
    document.documentElement.dataset.serviceImages = 'warmed';
  };
  Promise.all([ready, assets]).then(() => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(warm, {timeout:1200});
    else window.setTimeout(warm, 0);
  });
  return {ready};
}
