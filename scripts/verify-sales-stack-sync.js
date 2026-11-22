'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const { readSalesStack } = require('./sales-stack-content');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sales/FULL_SALES_STACK.md'), 'utf8');
const stack = readSalesStack(source);
const approvedAdminText = 'Здравствуйте! Подскажите рабочий Telegram владельца «[название]»? Я Максим, разрабатываю сайты — работы и отзывы есть в профиле. Хочу показать ему в коротком видео пару идей, как покупателям удобнее выбирать технику и уточнять наличие.';
assert.equal(stack.templates.admin, approvedAdminText, 'Первое сообщение администратору отличается от утверждённого текста');
const activeDocs = ['sales/FULL_SALES_STACK.md', 'sales/OUTREACH_PLAYBOOK.md', 'sales/OUTREACH_TELEGRAM_SCRIPTS.md', 'sales/MAXIM_PROFILE_AND_RULES.md'];
for (const file of activeDocs) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  assert(text.includes('> ' + approvedAdminText), file + ': нет утверждённого первого сообщения');
  assert(!/пересл|перешл|пересыл/i.test(text), file + ': осталась просьба переслать сообщение');
}
assert(!/пересл|перешл|пересыл/i.test(fs.readFileSync(path.join(root, 'sales/CALL_SCRIPTS.md'), 'utf8')), 'CALL_SCRIPTS.md: осталась просьба переслать сообщение');
const leadCount = fs.readdirSync(path.join(root, 'data/facts')).filter(file => file.endsWith('.json')).length;
const sectionCount = (source.match(/^## /gm) || []).length;
const files = ['sales/CALL_STATION.html', 'dist/station/index.html', 'dist/station.html'];
const pages = files.map(file => fs.readFileSync(path.join(root, file), 'utf8'));
assert(pages.every(page => page === pages[0]), 'Три копии станции расходятся');
const html = pages[0];
assert(html.includes('name="sales-stack-sha256" content="' + crypto.createHash('sha256').update(source).digest('hex') + '"'), 'Стек изменился после сборки станции');
assert(html.includes(stack.guideHtml), 'Полный встроенный стек не совпадает с источником');
assert(html.includes(stack.faqHtml), 'Ответы/условия/поддержка не совпадают с источником');
assert(html.includes(stack.videoGuideHtml) && html.includes(stack.callGuideHtml), 'Подсказки видео или звонка расходятся');
assert.equal((html.match(/<details id="stack-section-/g) || []).length, sectionCount, 'Не все разделы стека встроены');
assert(!html.includes('message-variant'), 'В станции остался переключатель разных первых сообщений');
for (const outdated of ['2–4 мин', '10–15 мин', 'пилот 25 контактов', 'рейтинг отличный', 'есть пара конкретных идей']) {
  assert(!html.includes(outdated), 'Старая подсказка: ' + outdated);
}
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim());
assert.equal(scripts.length, 1);
new vm.Script(scripts[0]);
const context = { document: { addEventListener() {} } };
vm.runInNewContext(scripts[0] + '\n globalThis.snapshot = { leadsData, salesStackData, createOutreachDraft };', context);
const { leadsData, salesStackData, createOutreachDraft } = context.snapshot;
assert.equal(leadsData.length, leadCount);
assert.deepEqual(JSON.parse(JSON.stringify(salesStackData.templates)), stack.templates, 'Шаблоны в HTML отличаются от цитат стека');
assert.deepEqual(JSON.parse(JSON.stringify(salesStackData.notes)), stack.notes, 'Пояснения в HTML отличаются от абзацев стека');
const sourceQuotes = [...source.replace(/\r\n?/g, '\n').matchAll(/(?:^|\n)(>[^\n]*(?:\n>[^\n]*)*)/g)].map(m => m[1].split('\n').map(l => l.replace(/^> ?/, '')).join('\n'));
for (const template of Object.values(stack.templates)) {
  assert(sourceQuotes.includes(template), 'Черновик не является точной цитатой из FULL_SALES_STACK.md');
}
let draftsChecked = 0;
for (const lead of leadsData) {
  const cases = [
    ['admin', undefined, 'admin'],
    ['admin', 'adminObserved', 'admin'],
    ['admin', 'adminNoSite', 'admin'],
    ['owner', undefined, lead.hasWebsite ? 'ownerHasSite' : 'ownerNoSite'],
    ['review', undefined, 'review'],
    ['call', undefined, 'call']
  ];
  for (const [kind, variant, key] of cases) {
    const expected = stack.templates[key].replaceAll('[название]', lead.name).replaceAll('[салон]', lead.name).replaceAll('[домен]', lead.existingWebsite || lead.extraWebsite || '[домен]');
    assert.equal(createOutreachDraft(lead, kind, variant), expected, lead.slug + ' / ' + key);
    draftsChecked++;
  }
  const initial = createOutreachDraft(lead, 'admin');
  assert.equal(initial, approvedAdminText.replaceAll('[название]', lead.name), lead.slug + ': первый текст должен отличаться только названием салона');
  assert(!/посмотрел|заметил|нашёл модели|рейтинг отличный/i.test(initial), 'Непроверенное наблюдение в основном первом сообщении');
  assert(!/пересл|перешл|пересыл/i.test(initial), 'Просьба переслать в первом сообщении');
  assert(html.includes('id="note-' + lead.slug + '"') && html.includes('oninput="saveNote(\'' + lead.slug + '\', this.value)"'), 'Нет сохранения заметки при вводе');
}
for (const key of ['motosalon_crm_statuses_v2', 'motosalon_crm_notes_v2']) assert(html.includes(key));
for (const status of ['new', 'admin_contact', 'owner_contact', 'video_agreed', 'review_ready', 'review_sent', 'call_scheduled', 'follow_up', 'thinking', 'deal', 'sent', 'call_later', 'reject']) {
  assert.equal((html.match(new RegExp('<option value="' + status + '">', 'g')) || []).length, leadCount, 'Потерян статус ' + status);
}
console.log('PASS: 3 одинаковые страницы; SHA-256 источника; ' + sectionCount + ' встроенных разделов; ' + Object.keys(stack.templates).length + ' точных цитат; ' + draftsChecked + ' черновика; пояснения/FAQ; прежние ключи и статусы; ' + leadCount + ' заметок oninput; синтаксис JS.');
console.log('Браузерные сценарии и визуальная проверка выполняются отдельно.');
