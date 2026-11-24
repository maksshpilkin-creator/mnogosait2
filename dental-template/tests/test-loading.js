import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const flush = () => new Promise(resolve => setImmediate(resolve));
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const bootstrap = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const loadingSource = fs.readFileSync(new URL('../src/modules/loading.js', import.meta.url), 'utf8')
  .replace(/^import .*$/gm, '').replace(/^export /gm, '');
const motionSource = fs.readFileSync(new URL('../src/modules/motion.js', import.meta.url), 'utf8').replace(/^export /gm, '');

function clock() {
  let id = 0;
  const timers = new Map();
  return {timers, setTimeout(fn, delay) { const key = ++id; timers.set(key,{fn,delay}); return key; },
    clearTimeout(key) { timers.delete(key); }, fire() { const items = [...timers.values()]; timers.clear(); items.forEach(item => item.fn()); }};
}
function boot(options = {}) {
  const time = clock(), events = new Map(), root = {dataset:{}}, overlay = {hidden:true};
  const storage = {getItem() { if (options.getThrows) throw Error('denied'); return options.seen ? 'seen' : null; },
    setItem() { if (options.setThrows) throw Error('quota'); }};
  const matchMedia = () => ({matches:Boolean(options.reduced)});
  const window = {matchMedia, addEventListener(name, fn) { events.set(name,fn); }, removeEventListener(name) { events.delete(name); }};
  const context = vm.createContext({window, document:{documentElement:root, hidden:Boolean(options.hidden), querySelector:() => overlay},
    sessionStorage:storage, location:{hash:options.hash || ''}, scrollY:options.scrolled ? 100 : 0,
    performance:{now:() => 0}, Element:{prototype:{animate:options.noAnimate ? undefined : () => {}}},
    matchMedia, Promise, setTimeout:time.setTimeout, clearTimeout:time.clearTimeout});
  vm.runInContext(bootstrap, context);
  return {root, overlay, events, time, intro:window.__emalIntro};
}

// The actual inline fail-safe works even when no external module executes.
{
  const state = boot();
  assert.equal(state.overlay.hidden, false);
  assert.equal(state.root.dataset.introState, 'active');
  assert.equal([...state.time.timers.values()][0].delay,1800);
  state.time.fire();
  assert.equal(state.overlay.hidden,true);
  assert.equal((await state.intro.done).reason,'timeout');
  state.intro.finish('ready');
  assert.equal(state.root.dataset.introState,'timeout','late readiness cannot re-show the intro');
}
{
  const state = boot(); state.intro.finish('ready');
  assert.equal(state.overlay.hidden,true);
  assert.equal(state.root.dataset.introElapsed,'0','no artificial minimum delay');
  assert.equal((await state.intro.done).animateHero,true);
  assert.equal(state.time.timers.size,0);
}
for (const options of [{seen:true},{getThrows:true},{setThrows:true},{reduced:true},{noAnimate:true},{hash:'#booking'},{scrolled:true},{hidden:true}]) {
  const state = boot(options);
  assert.equal(state.overlay.hidden,true,JSON.stringify(options));
  assert.equal(state.root.dataset.introState,'skip');
  assert.equal((await state.intro.done).animateHero,false);
  assert.equal(state.time.timers.size,0);
}
for (const event of ['keydown','pointerdown','wheel','touchstart','focusin','scroll']) {
  const state = boot();
  state.events.get(event)({key:'Tab'});
  assert.equal(state.overlay.hidden,true);
  assert.equal((await state.intro.done).reason,'interaction');
}
{
  const state = boot(); state.events.get('pageshow')({persisted:true});
  assert.equal(state.overlay.hidden,true); assert.equal((await state.intro.done).reason,'restored');
}

const loadContext = vm.createContext({Promise, Error, globalThis});
vm.runInContext(loadingSource + '\nthis.subject={boundedReadiness,imageReady};',loadContext);
const {boundedReadiness,imageReady} = loadContext.subject;
{
  const time = clock();
  assert.equal(await boundedReadiness([Promise.resolve()],1700,time),'ready');
  assert.equal(time.timers.size,0);
  assert.equal(await boundedReadiness([Promise.reject(Error('asset'))],1700,time),'error');
  let resolveLate;
  const ready = boundedReadiness([new Promise(resolve => { resolveLate=resolve; })],1700,time);
  time.fire(); assert.equal(await ready,'timeout'); resolveLate(); await flush();
  assert.equal(await ready,'timeout');
}
function fakeImage(complete, naturalWidth, decode = () => Promise.resolve()) {
  const listeners = new Map();
  return {complete,naturalWidth,decode,listeners,
    addEventListener(name,fn) { listeners.set(name,fn); }, removeEventListener(name) { listeners.delete(name); }};
}
{
  const cached = fakeImage(true,100); await imageReady(cached); assert.equal(cached.listeners.size,0);
  await assert.rejects(imageReady(fakeImage(true,0)));
  await assert.rejects(imageReady(fakeImage(true,100,() => Promise.reject(Error('decode')))));
  const failed = fakeImage(false,0); const failure=imageReady(failed); failed.listeners.get('error')(); await assert.rejects(failure);
  let resolveDecode;
  const image = fakeImage(true,100,() => new Promise(resolve => {resolveDecode=resolve;}));
  const time=clock(), bounded=boundedReadiness([imageReady(image)],1700,time);
  time.fire(); assert.equal(await bounded,'timeout'); resolveDecode(); await flush(); assert.equal(await bounded,'timeout');
}

// Exercise actual initMotion, observer and cleanup, rather than just matching source text.
function motionEnvironment(top = 1100) {
  const effects=[], listeners=new Map();
  class FakeElement {
    constructor() { this.dataset={}; this.classList={contains:() => false}; }
    contains() { return false; }
    querySelectorAll() { return []; }
    matches() { return false; }
    animate(frames,options) {
      const events={};
      const animation={frames,options,cancelled:false,addEventListener(name,fn) { events[name]=fn; },
        cancel() { this.cancelled=true; events.cancel?.(); }, finish() { events.finish?.(); }};
      effects.push(animation); return animation;
    }
  }
  const target=new FakeElement(), hero=new FakeElement();
  target.getBoundingClientRect=() => ({top,bottom:top+100,height:100});
  let observer;
  class Observer { constructor(callback,options) { this.callback=callback; this.options=options; observer=this; } observe() {} unobserve() {} }
  let resolveFonts;
  const fonts={ready:new Promise(resolve => {resolveFonts=resolve;})};
  const window={innerHeight:800,scrollY:0,matchMedia:() => ({matches:false}),IntersectionObserver:Observer,
    addEventListener(name,fn) { listeners.set(name,fn); }};
  const document={documentElement:{dataset:{}},hidden:false,activeElement:null,fonts,
    querySelector:selector => selector==='#hero' ? hero : null,
    querySelectorAll:selector => selector.startsWith('.about-photo') ? [target] : [],
    addEventListener(name,fn) { listeners.set(name,fn); }};
  const context=vm.createContext({window,document,Element:FakeElement,IntersectionObserver:Observer,
    location:{hash:''},Promise,console});
  vm.runInContext(motionSource+'\nthis.subject={initMotion,shouldRevealAhead};',context);
  return {target,hero,window,effects,listeners,subject:context.subject,resolveFonts,get observer(){return observer;},setTop(value){top=value;}};
}
{
  const state=motionEnvironment();
  const guard=state.subject.shouldRevealAhead;
  assert.equal(guard({top:600,bottom:900},800),false);
  assert.equal(guard({top:-100,bottom:100},800),false);
  assert.equal(guard({top:1100,bottom:1200},800),true);
  assert.equal(guard({top:1100,bottom:1200},800,true),false);
  let release;
  state.subject.initMotion({ready:new Promise(resolve => {release=resolve;})});
  assert.equal(state.observer.options.rootMargin,'0px 0px 420px 0px');
  state.observer.callback([{isIntersecting:true,target:state.target}]);
  assert.equal(state.effects.length,1);
  state.setTop(700); state.listeners.get('scroll')();
  assert.equal(state.effects[0].cancelled,true,'entering viewport settles before the next paint');
  assert.equal(state.target.dataset.revealState,'complete');
  state.window.scrollY=400; release({animateHero:true}); await flush();
  assert.equal(state.hero.dataset.entranceState,'complete','interaction/scroll precludes a late hero reveal');
  const count=state.effects.length; state.resolveFonts(); await flush();
  assert.equal(state.effects.length,count,'late fonts never conceal visible content again');
}
{
  const state=motionEnvironment(600);
  state.subject.initMotion({ready:Promise.resolve({animateHero:false})});
  state.observer.callback([{isIntersecting:true,target:state.target}]);
  await flush();
  assert.equal(state.effects.length,0,'an already visible section/anchor stays readable');
  assert.equal(state.target.dataset.revealState,'complete');
}
console.log('PASS: intro first/repeat/error/timeout/storage/reduced/interaction/BFCache, image decode and actual reveal guards/cleanup/late-font behavior.');
