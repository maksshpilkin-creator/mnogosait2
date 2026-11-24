import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Exercise the real scheduler and progress/reset logic, not a copied formula.
let y = 0;
let allowed = true;
let nextFrame = 0;
const frames = new Map();
const listeners = new Map();
let preferenceChanged;
let resolveFonts;
const fontReady = new Promise(resolve => { resolveFonts = resolve; });
const element = (top, height) => ({
  dataset: {}, values: new Map(),
  style: { setProperty(name, value) { this.owner.values.set(name, value); } },
  getBoundingClientRect() { return { top: top - y, bottom: top - y + height, height }; }
});
const hero = element(48, 737);
const manifesto = element(950, 224);
const visit = element(2200, 370);
for (const item of [hero, manifesto, visit]) item.style.owner = item;
manifesto.dataset.scrollFill = 'true';
const words = Array.from({ length: 24 }, () => {
  const word = element(0, 0); word.style.owner = word; return word;
});
manifesto.querySelectorAll = () => words;
const document = {
  hidden: false,
  fonts: { ready: fontReady },
  querySelector: selector => ({ '#hero': hero, '.manifesto-heading': manifesto, '#first-visit': visit })[selector],
  addEventListener: (type, fn) => listeners.set(type, fn),
  removeEventListener: type => listeners.delete(type)
};
const window = {
  innerHeight: 900, innerWidth: 1440,
  addEventListener: (type, fn) => listeners.set(type, fn),
  removeEventListener: type => listeners.delete(type)
};
const context = vm.createContext({
  window, document, motionAllowed: () => allowed,
  onMotionChange(fn) { preferenceChanged = fn; return () => { preferenceChanged = null; }; },
  requestAnimationFrame(fn) { const id = ++nextFrame; frames.set(id, fn); return id; },
  cancelAnimationFrame(id) { frames.delete(id); }
});
const source = fs.readFileSync(new URL('../src/modules/scroll-scenes.js', import.meta.url), 'utf8')
  .replace(/^import .*\r?\n/gm, '').replace(/^export /gm, '');
vm.runInContext(source + '\nthis.subject = { initScrollScenes, visitColors };', context);
const scene = context.subject.initScrollScenes();
const tick = () => { const queued = [...frames.values()]; frames.clear(); queued.forEach(fn => fn()); };
assert.equal(manifesto.dataset.fillProgress, '0.000');
y = 700;
listeners.get('scroll')(); listeners.get('scroll')(); listeners.get('scroll')();
assert.equal(frames.size, 1, 'multiple scroll events coalesce into one frame');
tick();
const forwardFill = Number(manifesto.dataset.fillProgress);
assert(forwardFill > .5 && forwardFill < 1);
assert.notEqual(hero.values.get('--hero-title-shift'), hero.values.get('--hero-implant-shift'));
assert.notEqual(hero.values.get('--hero-watermark-shift'), hero.values.get('--hero-implant-shift'));
y = 450; listeners.get('scroll')(); tick();
assert(Number(manifesto.dataset.fillProgress) < forwardFill, 'scrolling backward reverses the text fill');
const lastHeroShift = hero.values.get('--hero-title-shift');
y = 500; listeners.get('scroll')();
document.hidden = true; listeners.get('visibilitychange')();
assert.equal(frames.size, 0, 'hiding the tab cancels its queued scroll frame');
const beforeHiddenFill = manifesto.dataset.fillProgress;
listeners.get('scroll')(); scene.refresh();
assert.equal(frames.size, 0);
assert.equal(manifesto.dataset.fillProgress, beforeHiddenFill, 'hidden pages perform no scroll work');
document.hidden = false; listeners.get('visibilitychange')();
assert.notEqual(manifesto.dataset.fillProgress, beforeHiddenFill, 'visibility restores the current scene without a perpetual loop');
const visibleHeroShift = hero.values.get('--hero-title-shift');
y = 1500; listeners.get('scroll')(); tick();
assert.equal(hero.values.get('--hero-title-shift'), visibleHeroShift, 'offscreen hero is not animated');
assert(Number(visit.dataset.themeProgress) > 0 && Number(visit.dataset.themeProgress) < 1);

// Every intermediate gray chooses the more readable text color, never gray-on-gray.
const luminance = value => {
  const n = value / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
};
for (let i = 0; i <= 100; i++) {
  const colors = context.subject.visitColors(i / 100);
  const gray = Number(colors.background.match(/\d+/)[0]);
  const text = luminance(parseInt(colors.foreground.slice(1, 3), 16));
  const background = luminance(gray);
  const contrast = (Math.max(text, background) + .05) / (Math.min(text, background) + .05);
  assert(contrast >= 4.5, `insufficient body contrast at progress ${i / 100}`);
}

allowed = false; preferenceChanged();
assert.equal(manifesto.dataset.fillProgress, '1.000');
assert.equal(visit.dataset.themeProgress, '1.000');
assert.equal(hero.values.get('--hero-title-shift'), '0px');
listeners.get('scroll')();
assert.equal(frames.size, 0, 'paused/reduced motion schedules no scroll animation');
allowed = true; preferenceChanged();
assert.notEqual(visit.dataset.themeProgress, '1.000', 'resume recomputes the current scroll position');
scene.destroy();
assert.equal(listeners.size, 0);
const finalFill = manifesto.dataset.fillProgress;
y = 0; resolveFonts();
await new Promise(resolve => setImmediate(resolve));
assert.equal(manifesto.dataset.fillProgress, finalFill, 'a late fonts.ready resolution cannot update destroyed scenes');

// Exclusive FAQ: actual event code, with a measured-height controller stub.
const items = Array.from({ length: 3 }, (_, index) => {
  const classes = new Set(index === 0 ? ['is-open'] : []);
  const button = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(type, fn) { this[type] = fn; } };
  const body = { setAttribute() {} };
  const icon = { setAttribute() {}, textContent: '+' };
  return { button, body, icon, classList: {
    contains: name => classes.has(name), toggle: (name, state) => state ? classes.add(name) : classes.delete(name)
  }, querySelector: selector => ({ '.faq-header-btn': button, '.faq-body-collapse': body, '.faq-toggle-icon': icon })[selector] };
});
const faqContext = vm.createContext({ document: { querySelectorAll: () => items }, moveAccordion(body, open) { body.hidden = !open; } });
const faqSource = fs.readFileSync(new URL('../src/modules/faq.js', import.meta.url), 'utf8')
  .replace(/^import .*\r?\n/gm, '').replace(/^export /gm, '');
vm.runInContext(faqSource + '\ninitFAQ();', faqContext);
items[1].button.click();
assert.equal(items[0].button.attrs['aria-expanded'], 'false');
assert.equal(items[1].button.attrs['aria-expanded'], 'true');
items[1].button.click();
assert(items.every(item => !item.classList.contains('is-open')));
items[0].button.click(); items[1].button.click(); items[2].button.click();
assert.deepEqual(items.map(item => item.classList.contains('is-open')), [false, false, true]);
console.log('PASS: single scroll scheduler, reversible fill/theme, contrast, pause/reset/resume, exclusive FAQ.');
