'use strict';

// Synthetic evidence only. No real maps are opened and no production data is written.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const policy = require('./lead-search-policy');
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
const clone = value => JSON.parse(JSON.stringify(value));
const checkedAt = '2026-11-20T12:00:00+03:00';

function fixture(slug = 'synthetic-test') {
  const urls = {
    yandex_maps: 'https://yandex.ru/maps/org/synthetic_test/100000000001/',
    two_gis: 'https://2gis.ru/testcity/firm/100000000002',
    google_maps: 'https://www.google.com/maps/place/Synthetic+Test/'
  };
  const maps = Object.fromEntries(Object.entries(urls).map(([platform, url]) => [platform, {
    status: 'verified', url, checked_at: checkedAt,
    identity_status: 'verified', identity_evidence: 'СИНТЕТИЧЕСКИЙ ТЕСТ: совпали название, город, адрес.',
    source_id: platform,
    website: { status: 'not_found_in_checked_sources', value: null, note: 'СИНТЕТИЧЕСКИЙ ТЕСТ: поле сайта просмотрено.' }
  }]));
  return {
    slug, identity_status: 'verified',
    facts: { name: 'СИНТЕТИЧЕСКИЙ ТЕСТ', city: 'Тестовый город', address: 'Тестовый адрес', has_website: false },
    sources: Object.entries(urls).map(([id, url]) => ({ id, url, checked_at: checkedAt, excerpt: 'СИНТЕТИЧЕСКИЙ ТЕСТ: администратор https://t.me/synthetic_admin, сайт не указан.' })),
    lead_search_checks: {
      maps,
      telegram: {
        status: 'verified', url: 'https://t.me/synthetic_admin', kind: 'direct_chat', role: 'administrator',
        role_evidence: 'СИНТЕТИЧЕСКИЙ ТЕСТ: ссылка подписана «Администратор».',
        platform: 'two_gis', source_id: 'two_gis', checked_at: checkedAt
      }
    }
  };
}

function reject(name, mutate) {
  check(name, () => { const raw = fixture(); mutate(raw); assert.equal(policy.assessLead(raw).eligible, false); });
}

check('null, array and primitive card roots are deferred without throwing', () => {
  for (const value of [null, [], false, 'broken', 12]) {
    const result = policy.assessLead(value);
    assert.equal(result.eligible, false);
    assert.equal(result.website_status, 'unknown');
  }
});

check('complete evidence with no website link', () => {
  const result = policy.assessLead(fixture());
  assert.equal(result.eligible, true);
  assert.equal(result.website_status, 'not_found_in_checked_sources');
  assert.equal(result.website, null);
});
check('website from a verified card overrides historical false flag', () => {
  const raw = fixture();
  raw.lead_search_checks.maps.yandex_maps.website = { status: 'found', value: 'https://synthetic.example/catalog', note: 'СИНТЕТИЧЕСКИЙ ТЕСТ: ссылка сайта.' };
  const result = policy.assessLead(raw);
  assert.equal(result.eligible, true);
  assert.equal(result.website_status, 'found');
  assert.equal(result.website, 'https://synthetic.example/catalog');
});
check('documented missing card allowed; at least one other verified card supplies TG', () => {
  const raw = fixture();
  Object.assign(raw.lead_search_checks.maps.google_maps, {
    status: 'missing', url: 'https://www.google.com/maps/search/Synthetic+Test+Testcity/',
    identity_status: 'not_found', identity_evidence: 'СИНТЕТИЧЕСКИЙ ТЕСТ: поиск по названию, городу, адресу, совпадений нет.'
  });
  raw.sources.find(s => s.id === 'google_maps').url = raw.lead_search_checks.maps.google_maps.url;
  assert.equal(policy.assessLead(raw).eligible, true);
});
check('owner instead of administrator', () => {
  const raw = fixture(); raw.lead_search_checks.telegram.role = 'owner';
  assert.equal(policy.assessLead(raw).eligible, true);
});
reject('historical phone/website/VK are not evidence', raw => { delete raw.lead_search_checks; raw.facts.has_website = true; raw.personal_tg = '@synthetic_admin'; });
reject('missing required platform', raw => { delete raw.lead_search_checks.maps.google_maps; });
reject('missing source', raw => { raw.sources = raw.sources.filter(s => s.id !== 'two_gis'); });
reject('duplicate source id', raw => { raw.sources.push(clone(raw.sources[0])); });
reject('source URL belongs to another card', raw => { raw.sources[1].url = 'https://2gis.ru/testcity/firm/999'; });
reject('source without evidence', raw => { delete raw.sources[1].excerpt; });
reject('source without date', raw => { delete raw.sources[1].checked_at; });
reject('calendar-invalid source date', raw => { raw.sources[1].checked_at = '2026-02-31T12:00:00Z'; });
reject('map date missing', raw => { delete raw.lead_search_checks.maps.two_gis.checked_at; });
reject('telegram date missing', raw => { delete raw.lead_search_checks.telegram.checked_at; });
reject('business identity unresolved', raw => { raw.identity_status = 'unresolved'; });
reject('verified map uses search results instead of card', raw => { raw.lead_search_checks.maps.two_gis.url = 'https://2gis.ru/testcity/search/Test'; });
reject('wrong map platform', raw => { raw.lead_search_checks.maps.two_gis.url = 'https://yandex.ru/maps/org/test/123/'; });
reject('lookalike map host', raw => { raw.lead_search_checks.maps.two_gis.url = 'https://2gis.ru.example/firm/123'; });
reject('role unknown', raw => { raw.lead_search_checks.telegram.role = 'unknown'; });
reject('role has no evidence', raw => { delete raw.lead_search_checks.telegram.role_evidence; });
reject('telegram source is website only', raw => { raw.sources.push({ id: 'site', url: 'https://synthetic.example', checked_at: checkedAt, excerpt: 'TG' }); raw.lead_search_checks.telegram.source_id = 'site'; });
reject('telegram links to missing map instead of verified card', raw => { raw.lead_search_checks.maps.two_gis.status = 'missing'; });
reject('telegram explicitly channel', raw => { raw.lead_search_checks.telegram.kind = 'channel'; });
reject('telegram explicitly bot', raw => { raw.lead_search_checks.telegram.kind = 'bot'; });
for (const url of ['https://t.me/synthetic_bot', 'https://t.me/+79999999999', 'https://t.me/+InviteHash', 'https://t.me/s/channel', 'https://t.me/share', 'https://t.me/joinchat/InviteHash', 'https://t.me/c/123/1', 'https://t.me/login', 'https://t.me/synthetic_admin?start=bot', 'https://t.me.example/synthetic_admin', 'https://vk.com/synthetic_admin']) {
  reject(`not a direct Telegram chat: ${url}`, raw => { raw.lead_search_checks.telegram.url = url; });
}
for (const status of ['inaccessible', 'conflicting']) {
  reject(`map ${status} defers record`, raw => { raw.lead_search_checks.maps.google_maps.status = status; });
}
for (const status of ['unknown', 'inaccessible', 'conflicting']) {
  reject(`website ${status} defers record`, raw => { raw.lead_search_checks.maps.google_maps.website.status = status; });
}
reject('missing website is not false or empty string', raw => { raw.lead_search_checks.maps.google_maps.website.value = ''; });
reject('social profile is not an independent website', raw => { raw.lead_search_checks.maps.google_maps.website = { status: 'found', value: 'https://vk.com/synthetic', note: 'Тест' }; });

// Execute the actual CLI main against an in-memory filesystem. Network requests
// throw, so this also catches any accidental call into the old network heuristics.
const root = path.resolve(__dirname, '..');
const factsDir = path.join(root, 'data', 'facts');
const salesDir = path.join(root, 'sales');
const qualifiedJson = path.join(salesDir, 'qualified_owners_telegram.json');
function runMain(records, args, existing = null) {
  const files = new Map(records.map(raw => [path.join(factsDir, raw.slug + '.json'), JSON.stringify(raw)]));
  if (existing !== null) files.set(qualifiedJson, JSON.stringify(existing));
  const writes = [];
  const logs = [];
  let networkCalls = 0;
  const fakeFs = {
    readdirSync: dir => { assert.equal(dir, factsDir); return records.map(raw => raw.slug + '.json'); },
    readFileSync: file => { assert(files.has(file), `Unexpected read: ${file}`); return files.get(file); },
    existsSync: file => file === salesDir || files.has(file),
    mkdirSync: () => { throw new Error('No mkdir expected'); },
    writeFileSync: (file, content) => { writes.push(file); files.set(file, content); }
  };
  const customRequire = name => name === 'fs' ? fakeFs : name === './lead-search-policy' ? policy : require(name);
  const moduleObject = { exports: {} };
  const context = {
    require: customRequire, module: moduleObject, __dirname,
    process: { argv: ['node', 'find-owners.js', ...args] },
    console: { log: text => logs.push(text), error: text => logs.push(text) },
    fetch: () => { networkCalls++; throw new Error('Network is forbidden in this test'); },
    URL, Date, Set, Map, Buffer, AbortSignal
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'find-owners.js'), 'utf8'), context, { filename: 'find-owners.js' });
  const result = moduleObject.exports.main();
  assert.equal(networkCalls, 0);
  return { result, writes, files, logs };
}

check('actual CLI dry-run has zero writes/network and preserves unknown as null', () => {
  const run = runMain([fixture()], ['--all', '--dry-run']);
  assert.equal(run.writes.length, 0);
  assert.equal(run.result.selected.length, 1);
  assert.equal(run.result.selected[0].has_website_flag, null);
});
check('actual CLI no-site filter uses maps, not old Boolean', () => {
  const raw = fixture(); raw.facts.has_website = false;
  raw.lead_search_checks.maps.yandex_maps.website = { status: 'found', value: 'https://synthetic.example', note: 'Тест' };
  const run = runMain([raw], ['--all', '--dry-run', '--only-no-site']);
  assert.equal(run.result.selected.length, 0);
  assert.equal(run.result.filtered, 1);
});
check('actual CLI with-site filter does not trust historical true flag', () => {
  const raw = fixture(); raw.facts.has_website = true;
  assert.equal(runMain([raw], ['--all', '--dry-run', '--only-with-site']).result.selected.length, 0);
});
check('actual CLI unknown website is deferred, never treated as no-site', () => {
  const raw = fixture(); raw.lead_search_checks.maps.google_maps.website.status = 'unknown';
  const run = runMain([raw], ['--all', '--dry-run', '--only-no-site']);
  assert.equal(run.result.selected.length, 0);
  assert.equal(run.result.deferred.length, 1);
});
check('actual CLI empty ready selection does not overwrite prior outputs', () => {
  const raw = fixture(); delete raw.lead_search_checks;
  const run = runMain([raw], ['--all'], [{ slug: 'historical-output', preserve: true }]);
  assert.equal(run.writes.length, 0);
});
check('actual CLI partial run preserves other strict records and writes only separate outputs', () => {
  const first = runMain([fixture('synthetic-other')], ['--all']);
  const previous = JSON.parse(first.files.get(qualifiedJson));
  const second = runMain([fixture('synthetic-new')], ['--slugs', 'synthetic-new', '--limit', '1'], previous);
  const merged = JSON.parse(second.files.get(qualifiedJson));
  assert.deepEqual(merged.map(row => row.slug), ['synthetic-new', 'synthetic-other']);
  assert(second.writes.every(file => /qualified_owners_telegram\.(json|csv)$/.test(file)));
  assert.equal(merged.find(row => row.slug === 'synthetic-new').best_tg_entry, 'https://t.me/synthetic_admin');
});
check('actual CLI refuses invalid saved strict evidence before writing', () => {
  assert.throws(() => runMain([fixture()], ['--all'], [{ slug: 'bad', search_policy_version: policy.settings.version }]), /без актуального комплекта доказательств/);
});
check('merge helper preserves unrelated records', () => {
  assert.deepEqual(policy.mergeResults([{ slug: 'a', value: 1 }, { slug: 'b', value: 2 }], [{ slug: 'a', value: 3 }]), [{ slug: 'a', value: 3 }, { slug: 'b', value: 2 }]);
});
console.log(`Completed ${passed} synthetic checks. Real maps and production files were not changed.`);
