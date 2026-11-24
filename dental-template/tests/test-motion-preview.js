// A narrow state-machine check on the actual vanilla motion module, without a browser.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const animations = [];
let failNextEffect = false;
class FakeAnimation {
  constructor(element, frames, options) {
    this.element = element; this.frames = frames; this.options = options;
    this.listeners = {}; this.playState = 'running';
  }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  finish() { if (this.playState !== 'running') return; this.playState = 'finished'; this.listeners.finish?.forEach(fn => fn()); }
  cancel() { if (this.playState !== 'running') return; this.playState = 'idle'; this.listeners.cancel?.forEach(fn => fn()); }
}
class FakeElement {
  constructor(tagName = 'DIV') {
    this.tagName = tagName;
    this.attrs = new Map(); this.style = {}; this.dataset = {}; this.children = [];
    this.offsetTop = 30; this.offsetLeft = 0;
    const names = new Set();
    this.classList = {
      add: name => names.add(name), remove: name => names.delete(name), contains: name => names.has(name),
      toggle: (name, force = !names.has(name)) => force ? names.add(name) : names.delete(name)
    };
  }
  setAttribute(name, value) { this.attrs.set(name, value); }
  removeAttribute(name) { this.attrs.delete(name); }
  cloneNode() {
    assert.notEqual(this.tagName, 'BUTTON', 'interactive controls must never be cloned');
    const copy = new FakeElement(this.tagName); copy.attrs = new Map(this.attrs); return copy;
  }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { width: 400, height: 60 }; }
  append(child) {
    if (child.className === 'motion-preview-layer') {
      assert.equal(child.attrs.get('aria-hidden'), 'true');
      assert.equal(child.inert, true);
      assert.equal(child.style.pointerEvents, 'none');
    }
    child.parentElement = this; this.children.push(child);
  }
  remove() {
    const items = this.parentElement?.children;
    const index = items?.indexOf(this) ?? -1;
    if (index >= 0) items.splice(index, 1);
    this.parentElement = null;
  }
  animate(frames, options) {
    if (failNextEffect) { failNextEffect = false; throw new Error('Simulated WAAPI failure'); }
    const animation = new FakeAnimation(this, frames, options); animations.push(animation); return animation;
  }
}

const image = new FakeElement('IMG');
const summary = new FakeElement('P');
const metadata = new FakeElement();
const price = new FakeElement('SPAN');
const button = new FakeElement('BUTTON');
const badge = new FakeElement();
const imageWrap = new FakeElement(); image.parentElement = imageWrap;
const body = new FakeElement(); summary.parentElement = body;
image.setAttribute('id', 'original-image'); summary.setAttribute('id', 'original-copy');
const panel = new FakeElement();
panel.contains = node => [image, summary, metadata, price, button, badge].includes(node);
button.closest = () => panel;
panel.querySelector = selector => ({
  '.preview-image': image, '.preview-summary': summary, '.preview-body': body,
  '.preview-meta-row': metadata, '.preview-price-val': price,
  '.btn-service-detail': button, '.preview-badge-overlay': badge
})[selector];
const preference = { matches: false };
let activeDrawer;
const document = {
  documentElement: { dataset: {} }, body: new FakeElement(),
  querySelector: selector => selector.includes('.price-drawer') && activeDrawer
    && (activeDrawer.classList.contains('is-open') || activeDrawer.classList.contains('is-leaving')) ? activeDrawer : null,
  createElement: tag => new FakeElement(tag.toUpperCase())
};
const computedStyle = element => {
  const held = animations.filter(animation => animation.element === element
    && animation.playState === 'finished' && animation.options.fill === 'forwards').at(-1);
  return { opacity: String(held?.frames.at(-1).opacity ?? 1), transform: 'none' };
};
const context = vm.createContext({ window: { matchMedia: () => preference }, Element: FakeElement, document, getComputedStyle: computedStyle, console });
const source = fs.readFileSync(new URL('../src/modules/motion.js', import.meta.url), 'utf8').replace(/^export /gm, '');
vm.runInContext(source + '\nthis.subject = { transitionPreview, updatePreference, moveDrawer, settleFocusedPreview };', context);
const { transitionPreview, updatePreference, moveDrawer, settleFocusedPreview } = context.subject;
const overlays = () => imageWrap.children.length + body.children.length;
const flush = () => new Promise(resolve => setImmediate(resolve));
let current;

transitionPreview(panel, () => { current = 'HG'; }, 1);
assert.equal(overlays(), 4);
transitionPreview(panel, () => { current = 'SG'; }, 1);
transitionPreview(panel, () => { current = 'PR'; }, 1);
assert.equal(current, 'PR');
assert.equal(overlays(), 4, 'rapid changes retain only the latest outgoing image/copy/metadata/price');
const latestEffects = animations.filter(animation => animation.playState === 'running');
// The outgoing effects end at 480 ms, before the 720 ms incoming effects.
latestEffects.slice(0, 4).forEach(animation => animation.finish());
await flush();
assert.equal(overlays(), 0, 'the old frame cannot flash back during the 480–720 ms interval');
assert.equal(latestEffects.slice(4).every(animation => animation.playState === 'running'), true);
assert.equal(current, 'PR');
latestEffects.slice(4).forEach(animation => animation.finish());
await flush();
assert.equal(overlays(), 0);
assert.equal(current, 'PR', 'stale completions cannot overwrite the latest content');
assert.equal(panel.dataset.previewTransition, 'idle');

transitionPreview(panel, () => { current = 'TH'; }, -1);
preference.matches = true;
updatePreference();
assert.equal(overlays(), 0, 'reduced-motion removes decorative layers synchronously');
assert.equal(current, 'TH');
await flush();
assert.equal(overlays(), 0);

preference.matches = false;
updatePreference();
failNextEffect = true;
transitionPreview(panel, () => { current = 'HG'; }, 1);
assert.equal(overlays(), 0, 'a WAAPI failure leaves no stale layers');
assert.equal(current, 'HG');
assert.equal(animations.filter(animation => animation.playState === 'running').length, 0);

transitionPreview(panel, () => { current = 'PR'; }, 1);
document.activeElement = button;
settleFocusedPreview(button);
assert.equal(overlays(), 0, 'focusing the real CTA immediately clears its fade and all exit layers');
assert.equal(animations.filter(animation => animation.playState === 'running').length, 0);
transitionPreview(panel, () => { current = 'SG'; }, -1);
assert.equal(current, 'SG');
assert.equal(overlays(), 0, 'an already focused panel updates immediately without fading its control');
assert.equal(animations.filter(animation => animation.playState === 'running').length, 0);
document.activeElement = null;

// Shade exit ends at 360 ms, but the drawer exit remains visible until 420 ms.
const drawer = new FakeElement(); const shade = new FakeElement();
activeDrawer = drawer; drawer.classList.add('is-open'); shade.classList.add('is-open');
const closing = moveDrawer(drawer, shade, false);
const closingEffects = animations.filter(animation => animation.playState === 'running');
closingEffects[1].finish();
await flush();
assert.equal(drawer.classList.contains('is-leaving'), true);
assert.equal(computedStyle(shade).opacity, '0', 'the ended shade must not flash opaque before the panel exit finishes');
closingEffects[0].finish();
await closing;
assert.equal(drawer.classList.contains('is-leaving'), false);
assert.equal(document.body.classList.contains('modal-open'), false);
console.log('PASS: latest-wins, preview/shade intermediate exit windows, reduced-motion and WAAPI failure cleanup.');
