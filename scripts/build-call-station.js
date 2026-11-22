'use strict';
const fs = require('fs');
const path = require('path');
const { readSalesStack } = require('./sales-stack-content');

const root = path.resolve(__dirname, '..');
const salesStackPath = path.join(root, 'sales', 'FULL_SALES_STACK.md');
const salesStack = readSalesStack(fs.readFileSync(salesStackPath, 'utf8'));
const salesStackData = { hash: salesStack.hash, templates: salesStack.templates, notes: salesStack.notes };
const factsDir = path.join(root, 'data', 'facts');
const ownersFile = path.join(root, 'sales', 'owners_telegram.json');
const salesFile = path.join(root, 'sales', 'CALL_STATION.html');
const distStationDir = path.join(root, 'dist', 'station');
const distStationFile = path.join(distStationDir, 'index.html');
const distStationAlias = path.join(distStationDir + '.html');

if (!fs.existsSync(distStationDir)) {
  fs.mkdirSync(distStationDir, { recursive: true });
}

const factFiles = fs.readdirSync(factsDir).filter(f => f.endsWith('.json'));
const leads = factFiles.map(f => JSON.parse(fs.readFileSync(path.join(factsDir, f), 'utf8')));

const ownersBySlug = {};
if (fs.existsSync(ownersFile)) {
  const ownersList = JSON.parse(fs.readFileSync(ownersFile, 'utf8'));
  for (const item of ownersList) {
    if (item && item.slug) ownersBySlug[item.slug] = item;
  }
}

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function callablePhone(lead) {
  if (lead.phone_check && lead.phone_check.status !== 'verified') return '';

  const { phone, phone_raw: raw } = lead.facts;
  if (typeof phone !== 'string' || !/^\+7\d{10}$/.test(raw)) return '';
  if (phone.replace(/\D/g, '') !== raw.slice(1)) return '';
  return phone;
}

function isPhoneVerified(lead) {
  return !(lead.phone_check && lead.phone_check.status !== 'verified');
}

function normalizeTgHandle(raw) {
  const s = String(raw || '').trim();
  if (!s) return { label: '', url: '', copy: '' };
  if (/^https?:\/\/t\.me\//i.test(s)) {
    const clean = s.split(/\s+/)[0];
    const handleMatch = clean.match(/t\.me\/([A-Za-z0-9_]+)/i);
    return {
      label: handleMatch ? '@' + handleMatch[1] : clean,
      url: clean,
      copy: handleMatch ? '@' + handleMatch[1] : clean
    };
  }
  const m = s.match(/@([A-Za-z0-9_]{3,})/);
  if (m) {
    return {
      label: '@' + m[1],
      url: 'https://t.me/' + m[1],
      copy: '@' + m[1]
    };
  }
  return { label: '', url: '', copy: '' };
}

function isMobileRaw(raw) {
  return /^\+79\d{9}$/.test(String(raw || '').trim());
}

function formatMobilePretty(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length !== 11 || !digits.startsWith('7')) return raw;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

function resolveTelegramInfo(lead, owner) {
  const o = owner || {};
  const phoneOk = isPhoneVerified(lead);
  const verifiedPhone = callablePhone(lead);
  const factRaw = phoneOk ? String(lead.facts.phone_raw || '').trim() : '';

  const personalTg = normalizeTgHandle(o.personal_tg);
  const personalTgNote = String(o.personal_tg_note || '').trim();
  const hiddenMobile = isMobileRaw(o.hidden_personal_phone) ? String(o.hidden_personal_phone).trim() : '';
  const salonDirect = normalizeTgHandle(o.salon_tg_direct);
  // A salon username is a routing hint, not proof that a particular administrator owns it.
  const hasDirectSalonTelegram = Boolean(salonDirect.url && /^@[A-Za-z0-9_]+$/.test(salonDirect.label) && !/bot$/i.test(salonDirect.label));
  const salonChannel = normalizeTgHandle(o.salon_tg);
  const salonChannelFull = String(o.salon_tg || '').trim();

  // Only trust mobile numbers if phone_check did not flag the card as conflicting/missing.
  let salonMobile = '';
  if (phoneOk) {
    if (isMobileRaw(factRaw)) {
      salonMobile = factRaw;
    } else if (isMobileRaw(o.public_mobile)) {
      salonMobile = String(o.public_mobile).trim();
    }
  }

  const tier = String(o.contact_tier || '').trim();

  let primaryUrl = '';
  let primaryLabel = '';
  let primaryCopy = '';
  let tierBadge = '';
  let tierTone = 'slate';
  let tierGroup = 'none'; // 'direct' | 'mobile' | 'channel' | 'none'
  let contactRole = 'admin'; // 'owner' | 'admin' | 'landline'

  if (personalTg.url) {
    primaryUrl = personalTg.url;
    primaryLabel = personalTg.label;
    primaryCopy = personalTg.copy;
    tierBadge = '👑 Личный ТГ владельца';
    tierTone = 'emerald';
    tierGroup = 'direct';
    contactRole = 'owner';
  } else if (hiddenMobile) {
    primaryUrl = 'https://t.me/' + hiddenMobile;
    primaryLabel = formatMobilePretty(hiddenMobile);
    primaryCopy = hiddenMobile;
    tierBadge = '👑 Личный моб. владельца (ТГ)';
    tierTone = 'teal';
    tierGroup = 'direct';
    contactRole = 'owner';
  } else if (tier === '4_MOBILE_IMPORT_WITH_OWNER_NAME' && salonMobile) {
    primaryUrl = 'https://t.me/' + salonMobile;
    primaryLabel = formatMobilePretty(salonMobile);
    primaryCopy = salonMobile;
    tierBadge = '👑 ТГ владельца (имя из ФНС)';
    tierTone = 'emerald';
    tierGroup = 'direct';
    contactRole = 'owner';
  } else if (salonDirect.url) {
    primaryUrl = salonDirect.url;
    primaryLabel = salonDirect.label;
    primaryCopy = salonDirect.copy;
    tierBadge = '👨‍💼 Прямой ТГ админа/салона';
    tierTone = 'sky';
    tierGroup = 'direct';
    contactRole = 'admin';
  } else if (salonMobile) {
    primaryUrl = 'https://t.me/' + salonMobile;
    primaryLabel = formatMobilePretty(salonMobile);
    primaryCopy = salonMobile;
    tierBadge = '👨‍💼 Моб. админа / салона (ТГ)';
    tierTone = 'amber';
    tierGroup = 'mobile';
    contactRole = 'admin';
  } else if (salonChannel.url) {
    primaryUrl = salonChannel.url;
    primaryLabel = salonChannel.label;
    primaryCopy = salonChannel.copy;
    tierBadge = '📢 Канал ТГ салона';
    tierTone = 'indigo';
    tierGroup = 'channel';
    contactRole = 'admin';
  } else {
    tierBadge = 'Только городской';
    tierTone = 'slate';
    contactRole = 'landline';
  }

  // Secondary links so Maxim sees salon TG / mobile even when personal contact is primary.
  const secondaryLinks = [];
  if (salonDirect.url && salonDirect.url !== primaryUrl) {
    secondaryLinks.push({ label: 'ТГ салона: ' + salonDirect.label, url: salonDirect.url });
  }
  if (salonChannel.url && salonChannel.url !== primaryUrl && salonChannel.url !== salonDirect.url) {
    secondaryLinks.push({ label: 'Канал: ' + (salonChannelFull || salonChannel.label), url: salonChannel.url });
  }
  if (salonMobile && ('https://t.me/' + salonMobile) !== primaryUrl) {
    secondaryLinks.push({ label: 'Моб. салона: ' + formatMobilePretty(salonMobile), url: 'https://t.me/' + salonMobile });
  }

  const fnsOwner = String(o.fns_owner || '').trim();
  const fnsKind = String(o.fns_kind || '').trim();
  const extraWebsite = String(o.website || '').trim();

  return {
    phoneOk,
    verifiedPhone,
    primaryUrl,
    primaryLabel,
    primaryCopy,
    tierBadge,
    tierTone,
    tierGroup,
    contactRole,
    hasDirectSalonTelegram,
    personalTgNote,
    secondaryLinks,
    fnsOwner,
    fnsKind,
    extraWebsite
  };
}

// Timezone offset relative to MSK (UTC+3)
const cityOffsets = {
  // MSK (UTC+3)
  'Москва': 0, 'Мытищи': 0, 'Подольск': 0, 'Серпухов': 0, 'Коломна': 0, 'Сергиев Посад': 0,
  'Дмитров': 0, 'Ногинск': 0, 'Одинцово': 0, 'Санкт-Петербург': 0, 'Казань': 0,
  'Нижний Новгород': 0, 'Дзержинск': 0, 'Краснодар': 0, 'Сочи': 0, 'Новороссийск': 0,
  'Анапа': 0, 'Армавир': 0, 'Майкоп': 0, 'Ростов-на-Дону': 0, 'Таганрог': 0,
  'Шахты': 0, 'Волгодонск': 0, 'Ставрополь': 0, 'Пятигорск': 0, 'Минеральные Воды': 0,
  'Воронеж': 0, 'Волгоград': 0, 'Тверь': 0, 'Тула': 0, 'Рязань': 0, 'Ярославль': 0,
  'Киров': 0, 'Пенза': 0, 'Липецк': 0, 'Белгород': 0, 'Старый Оскол': 0, 'Брянск': 0,
  'Смоленск': 0, 'Иваново': 0, 'Владимир': 0, 'Ковров': 0, 'Муром': 0, 'Кострома': 0,
  'Вологда': 0, 'Череповец': 0, 'Петрозаводск': 0, 'Архангельск': 0, 'Мурманск': 0,
  'Сыктывкар': 0, 'Йошкар-Ола': 0, 'Чебоксары': 0, 'Саранск': 0, 'Тамбов': 0,
  'Орёл': 0, 'Курск': 0, 'Великий Новгород': 0, 'Псков': 0, 'Альметьевск': 0,
  'Обнинск': 0, 'Рыбинск': 0, 'Новочеркасск': 0, 'Батайск': 0, 'Волжский': 0,
  'Раменское': 0, 'Домодедово': 0, 'Балашиха': 0, 'Махачкала': 0, 'Елец': 0,
  // MSK-1 (UTC+2)
  'Калининград': -1,
  // MSK+1 (UTC+4)
  'Самара': 1, 'Тольятти': 1, 'Сызрань': 1, 'Саратов': 1, 'Энгельс': 1, 'Балаково': 1,
  'Ульяновск': 1, 'Астрахань': 1,
  // MSK+2 (UTC+5)
  'Екатеринбург': 2, 'Челябинск': 2, 'Миасс': 2, 'Магнитогорск': 2, 'Каменск-Уральский': 2,
  'Тюмень': 2, 'Пермь': 2, 'Уфа': 2, 'Стерлитамак': 2, 'Салават': 2, 'Нефтекамск': 2,
  'Оренбург': 2, 'Курган': 2, 'Набережные Челны': 2, 'Сургут': 2, 'Нижний Тагил': 2,
  // MSK+3 (UTC+6)
  'Омск': 3,
  // MSK+4 (UTC+7)
  'Новосибирск': 4, 'Красноярск': 4, 'Томск': 4, 'Кемерово': 4, 'Новокузнецк': 4,
  'Барнаул': 4, 'Бийск': 4, 'Абакан': 4,
  // MSK+5 (UTC+8)
  'Иркутск': 5, 'Братск': 5, 'Улан-Удэ': 5, 'Ангарск': 5,
  // MSK+6 (UTC+9)
  'Чита': 6, 'Благовещенск': 6,
  // MSK+7 (UTC+10)
  'Хабаровск': 7, 'Владивосток': 7, 'Уссурийск': 7,
  // MSK+8 (UTC+11)
  'Южно-Сахалинск': 8
};

// Sort leads: who is closer to MSK (UTC+3) is higher up (0 first, then +1/-1, +2, +3, +4, +5, +7)
leads.sort((a, b) => {
  const offA = cityOffsets[a.facts.city] ?? 0;
  const offB = cityOffsets[b.facts.city] ?? 0;
  const distA = Math.abs(offA);
  const distB = Math.abs(offB);
  if (distA !== distB) return distA - distB;
  if (offA !== offB) return offA - offB;
  return a.facts.city.localeCompare(b.facts.city, 'ru');
});

const resolvedLeads = leads.map(lead => ({
  lead,
  tg: resolveTelegramInfo(lead, ownersBySlug[lead.slug])
}));
// Group 1: Leads where we ALREADY have the owner's Telegram (contactRole === 'owner') -> TOP!
// Group 2: Leads where we only have business admins' Telegram (contactRole === 'admin') -> BELOW!
// Group 3: Leads with only landline (contactRole === 'landline') -> BOTTOM!
const ownerLeads = resolvedLeads.filter(item => item.tg.contactRole === 'owner');
const adminLeads = resolvedLeads.filter(item => item.tg.contactRole === 'admin');
const landlineLeads = resolvedLeads.filter(item => item.tg.contactRole === 'landline');

const enrichedLeads = [
  ...ownerLeads,
  ...adminLeads,
  ...landlineLeads
];

const ownerCount = ownerLeads.length;
const adminCount = adminLeads.length;
const landlineCount = landlineLeads.length;
const noSiteCount = enrichedLeads.filter(x => !x.lead.facts.has_website).length;
const hasSiteCount = enrichedLeads.filter(x => x.lead.facts.has_website).length;
const directTgCount = enrichedLeads.filter(x => x.tg.tierGroup === 'direct').length;
const anyTgCount = enrichedLeads.filter(x => x.tg.tierGroup !== 'none').length;

// Embedded as source in the generated page so newlines are not double-escaped.
function getDraftTemplateKey(lead, kind, variant) {
  if (kind === 'admin') return 'admin';
  if (kind === 'owner') return lead.hasWebsite ? 'ownerHasSite' : 'ownerNoSite';
  if (kind === 'review' || kind === 'call') return kind;
  throw new Error('Неизвестный тип черновика');
}

function createOutreachDraft(lead, kind, variant) {
  const key = getDraftTemplateKey(lead, kind, variant);
  const template = salesStackData.templates[key];
  // Only identifiers are filled automatically; observations and identities remain explicit drafts.
  return template
    .replaceAll('[название]', lead.name)
    .replaceAll('[салон]', lead.name)
    .replaceAll('[домен]', lead.existingWebsite || lead.extraWebsite || '[домен]');
}

const toneClasses = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  teal: 'bg-teal-500/15 text-teal-300 border-teal-500/35',
  sky: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
  indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
  slate: 'bg-slate-800 text-slate-400 border-slate-700'
};

function renderLeadCard(lead, tg, idx) {
  const num = String(idx).padStart(2, '0');
  const f = lead.facts;
  const offset = cityOffsets[f.city] ?? 0;
  const offsetLabel = offset === 0 ? 'МСК' : (offset > 0 ? `+${offset} от МСК` : `${offset} от МСК`);
  const absOffset = Math.abs(offset);
  const offsetColor = absOffset >= 5 ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      absOffset >= 3 ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                      absOffset >= 1 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                       'bg-sky-500/20 text-sky-300 border-sky-500/30';

  const modelsSample = lead.catalog.map(c => c.name).slice(0, 2).join(', ');
  const demoUrl = `https://makssaas.gitverse.site/motosalons/${lead.slug}/`;
  const yandexUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(f.name + ' ' + f.city + ' ' + f.address)}`;
  const dgisUrl = `https://2gis.ru/search/${encodeURIComponent(f.name + ' ' + f.city)}`;
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name + ' ' + f.city + ' ' + f.address)}`;
  const hasSite = Boolean(f.has_website);
  const existingHref = f.existing_website
    ? (f.existing_website.startsWith('http') ? f.existing_website : 'https://' + f.existing_website)
    : '';
  const extraHref = tg.extraWebsite
    ? (tg.extraWebsite.startsWith('http') ? tg.extraWebsite : 'https://' + tg.extraWebsite)
    : '';
  const showExtraHref = extraHref && extraHref !== existingHref;

  const siteBadgeHtml = hasSite
    ? `<div class="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-mono"><span class="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold truncate">🔵 Сайт указан (разбор сайта)</span>${existingHref ? `<a href="${escHtml(existingHref)}" target="_blank" rel="noopener" class="text-sky-400 hover:underline shrink-0">сайт ↗</a>` : ''}</div>`
    : `<div class="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-mono"><span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold truncate">Сайт не указан — проверить</span>${showExtraHref ? `<a href="${escHtml(extraHref)}" target="_blank" rel="noopener" class="text-amber-300 hover:underline shrink-0" title="Ссылка найдена автоматически в базе, проверить перед разбором">ссылка ↗</a>` : ''}</div>`;

  const fnsHtml = tg.fnsOwner
    ? `<div class="mt-2 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/90 text-[11px] text-slate-300 flex items-center gap-1.5"><span class="text-slate-500 shrink-0 font-mono">ФНС:</span><span class="truncate font-medium" title="${escHtml(tg.fnsOwner)}">${escHtml(tg.fnsOwner)}</span></div>`
    : '';

  let tgBlockHtml = '';
  if (tg.primaryUrl) {
    const toneClass = toneClasses[tg.tierTone] || toneClasses.slate;
    const noteHtml = tg.personalTgNote
      ? `<p class="mt-1.5 text-[10px] text-amber-300/90 leading-snug break-words">Профиль ТГ: ${escHtml(tg.personalTgNote)}</p>`
      : '';
    const secondaryHtml = tg.secondaryLinks.length
      ? `<div class="mt-1.5 flex flex-wrap gap-1.5">${tg.secondaryLinks.map(item =>
          `<a href="${escHtml(item.url)}" target="_blank" rel="noopener" class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition truncate max-w-full">${escHtml(item.label)} ↗</a>`
        ).join('')}</div>`
      : '';

    tgBlockHtml = `
        <div class="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${toneClass}">${escHtml(tg.tierBadge)}</span>
            ${tg.verifiedPhone && tg.primaryCopy !== tg.verifiedPhone ? `<span class="text-[10px] font-mono text-slate-500 truncate" title="Общий телефон салона">${escHtml(tg.verifiedPhone)}</span>` : ''}
          </div>
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0 flex-1">
              <a href="${escHtml(tg.primaryUrl)}" target="_blank" rel="noopener" class="text-sky-300 hover:text-sky-200 font-mono font-extrabold text-sm select-all tracking-tight block truncate" title="Открыть в Telegram">
                ✈️ ${escHtml(tg.primaryLabel)}
              </a>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button type="button" onclick="copyContact(${escHtml(JSON.stringify(tg.primaryCopy))})" class="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-lg text-[11px] font-mono border border-slate-700 transition shadow-sm" title="Скопировать контакт для поиска в Telegram">
                📋 Копия
              </button>
              <a href="${escHtml(tg.primaryUrl)}" target="_blank" rel="noopener" class="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-lg text-[11px] font-mono font-bold transition shadow-sm" title="Открыть чат в Telegram">
                В ТГ ↗
              </a>
            </div>
          </div>
          ${noteHtml}
          ${secondaryHtml}
        </div>`;
  } else if (tg.verifiedPhone) {
    tgBlockHtml = `
        <div class="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
          <div class="min-w-0 flex-1">
            <span class="text-[10px] text-slate-400 font-mono block leading-none mb-1">Только городской (ТГ/моб. не найден):</span>
            <span class="text-slate-300 font-mono font-bold text-sm select-all block truncate">${escHtml(tg.verifiedPhone)}</span>
          </div>
          <button type="button" onclick="copyContact(${escHtml(JSON.stringify(tg.verifiedPhone))})" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-mono border border-slate-700 transition shrink-0">
            📋 Копия
          </button>
        </div>`;
  } else {
    tgBlockHtml = `
        <div class="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold text-amber-300">
          Контакт требует уточнения (телефон в базе спорный или отсутствует)
        </div>`;
  }

  const searchBlob = [
    f.name, f.city, f.address, tg.verifiedPhone, tg.primaryLabel, tg.fnsOwner, tg.tierBadge, f.existing_website || '', tg.extraWebsite || ''
  ].join(' ').toLowerCase();

  const isOwner = (tg.contactRole === 'owner');
  const isLandline = (tg.contactRole === 'landline');
  const cardBorderClass = isOwner
    ? 'border-emerald-500/40 hover:border-emerald-400/80 shadow-emerald-950/20'
    : isLandline
    ? 'border-slate-800/80 hover:border-slate-700 opacity-90'
    : 'border-slate-800 hover:border-orange-500/50 shadow-md';

  const roleBadgeHtml = isOwner
    ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">👑 ВЛАДЕЛЕЦ</span>`
    : isLandline
    ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">☎️ ГОРОДСКОЙ</span>`
    : `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">👨‍💼 АДМИН</span>`;

  const btn1Class = isOwner
    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
    : isLandline
    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
    : 'bg-orange-600 hover:bg-orange-500 text-white shadow';
  const btn2Class = isOwner
    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow border border-emerald-500/40 font-extrabold'
    : 'bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30';

  return `
    <div class="lead-card bg-slate-900/90 border ${cardBorderClass} rounded-2xl p-4 flex flex-col justify-between transition-all duration-200" id="card-${escHtml(lead.slug)}" data-slug="${escHtml(lead.slug)}" data-status="new" data-has-website="${hasSite ? 'yes' : 'no'}" data-tg-group="${escHtml(tg.tierGroup)}" data-contact-role="${escHtml(tg.contactRole)}" data-search="${escHtml(searchBlob)}">
      <div>
        <div class="flex items-center justify-between text-xs font-mono mb-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-orange-400 font-bold">#${num} · ${escHtml(f.city)}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${offsetColor}">${offsetLabel}</span>
            ${roleBadgeHtml}
          </div>
          <span class="text-amber-400 font-bold">★ ${escHtml(f.rating)}</span>
        </div>

        <h3 class="font-extrabold text-base text-white leading-tight">${escHtml(f.name)}</h3>
        ${siteBadgeHtml}

        <div class="flex items-center justify-between mt-1.5 text-xs text-slate-400">
          <span class="truncate flex items-center gap-1" title="${escHtml(f.address)}">📍 ${escHtml(f.address)}</span>
          <span class="flex items-center gap-1 shrink-0 ml-2 font-mono text-[10px]">
            <a href="${yandexUrl}" target="_blank" rel="noopener" class="px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500 hover:text-black transition border border-yellow-500/25" title="Яндекс Карты">Яндекс</a>
            <a href="${dgisUrl}" target="_blank" rel="noopener" class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-white transition border border-emerald-500/25" title="2ГИС">2ГИС</a>
            <a href="${googleUrl}" target="_blank" rel="noopener" class="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 hover:bg-blue-500 hover:text-white transition border border-blue-500/25" title="Google Maps">Google</a>
          </span>
        </div>

        <div class="mt-2.5 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
          <div class="flex justify-between items-center text-slate-400">
            <span>График: <strong class="text-slate-300 font-sans">${escHtml(f.hours)}</strong></span>
            <span class="local-time font-bold text-sky-400" data-offset="${offset}">--:--</span>
          </div>
          <div class="text-slate-400 truncate">Модели: <span class="text-slate-200 font-sans">${escHtml(modelsSample)}</span></div>
        </div>

        ${fnsHtml}
        ${tgBlockHtml}

        <p class="mt-1.5 text-xs text-slate-400">${escHtml(salesStack.contactNote)}</p>

        <!-- Editable outreach drafts; nothing is sent from this station. -->
        <div class="mt-2 grid grid-cols-2 gap-2 text-xs font-bold font-mono">
          <button type="button" class="py-2 px-2 rounded-xl ${btn1Class} active:scale-95 transition" onclick="openMessageDraft('${escHtml(lead.slug)}', 'admin')">1. Админу (ТГ)</button>
          <button type="button" class="py-2 px-2 rounded-xl ${btn2Class} active:scale-95 transition" onclick="openMessageDraft('${escHtml(lead.slug)}', 'owner')">2. Владельцу (вопрос)</button>
          <button type="button" class="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition" onclick="openMessageDraft('${escHtml(lead.slug)}', 'review')">3. К готовому видео</button>
          <button type="button" class="py-2 px-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition" onclick="openMessageDraft('${escHtml(lead.slug)}', 'call')">4. Созвон при интересе</button>
        </div>
        <a href="${demoUrl}" target="_blank" rel="noopener" class="mt-2 py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-center text-[11px] font-mono text-orange-300 hover:text-orange-200 block transition">Демо-концепт · при необходимости</a>

        <!-- Notes Input -->
        <div class="mt-2.5">
          <label for="note-${escHtml(lead.slug)}" class="block mb-1 text-xs text-slate-400">Контакт, наблюдение, результат и следующий шаг с датой</label>
          <input type="text" id="note-${escHtml(lead.slug)}" class="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 font-sans" placeholder="Контакт / наблюдение / ссылка на видео / следующий шаг" oninput="saveNote('${escHtml(lead.slug)}', this.value)" onchange="saveNote('${escHtml(lead.slug)}', this.value)">
        </div>
      </div>

      <!-- Status Footer -->
      <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <label for="select-${escHtml(lead.slug)}" class="text-[10px] font-mono text-slate-500 uppercase">Статус:</label>
        <select id="select-${escHtml(lead.slug)}" class="min-w-0 max-w-full bg-slate-950 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500 transition font-mono" onchange="updateStatus('${escHtml(lead.slug)}', this.value)">
          <option value="new">⚪ Новый</option>
          <option value="admin_contact">🟡 Написал админу в ТГ</option>
          <option value="owner_contact">🟠 Контакт владельца получен</option>
          <option value="video_agreed">✅ Согласился на видео</option>
          <option value="review_ready">🎬 Видео записано</option>
          <option value="review_sent">🔵 Видео отправлено</option>
          <option value="call_scheduled">📞 Назначен созвон</option>
          <option value="follow_up">💬 Доп. касание в ТГ</option>
          <option value="thinking">🟣 В диалоге / думает</option>
          <option value="deal">🟢 СДЕЛКА</option>
          <option value="sent">Ранее отправлена ссылка (старый)</option>
          <option value="call_later">Перезвонить (старый)</option>
          <option value="reject">🔴 Отказ / неактуально</option>
        </select>
      </div>
    </div>
  `;
}

let cardNum = 0;
const cardsHtmlList = [];

// Section 1: Owners (TOP!)
cardsHtmlList.push(`
  <div class="col-span-full section-divider p-3.5 sm:p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg" data-divider-role="owner">
    <div class="flex items-center gap-2.5">
      <span class="text-2xl">👑</span>
      <div>
        <h2 class="text-base sm:text-lg font-extrabold text-white">1. Салоны с Telegram владельца / руководителя (${ownerCount} салонов)</h2>
        <p class="text-xs text-emerald-300/90 font-mono mt-0.5">Личный подтверждённый контакт или мобильный с именем владельца по ФНС · Пишем сразу владельцу (Шаг 2)</p>
      </div>
    </div>
    <span class="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30 shrink-0">Карточки #01 – #${String(ownerCount).padStart(2, '0')}</span>
  </div>
`);
ownerLeads.forEach(item => {
  cardNum++;
  cardsHtmlList.push(renderLeadCard(item.lead, item.tg, cardNum));
});

// Section 2: Admins (BELOW!)
cardsHtmlList.push(`
  <div class="col-span-full section-divider mt-6 p-3.5 sm:p-4 rounded-2xl bg-sky-950/80 border border-sky-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg" data-divider-role="admin">
    <div class="flex items-center gap-2.5">
      <span class="text-2xl">👨‍💼</span>
      <div>
        <h2 class="text-base sm:text-lg font-extrabold text-white">2. Салоны с Telegram администратора бизнеса (${adminCount} салонов)</h2>
        <p class="text-xs text-sky-300/90 font-mono mt-0.5">Прямой аккаунт или мобильный салона · Сначала просим контакт владельца (Шаг 1)</p>
      </div>
    </div>
    <span class="px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-300 font-mono text-xs font-bold border border-sky-500/30 shrink-0">Карточки #${String(ownerCount + 1).padStart(2, '0')} – #${String(ownerCount + adminCount).padStart(2, '0')}</span>
  </div>
`);
adminLeads.forEach(item => {
  cardNum++;
  cardsHtmlList.push(renderLeadCard(item.lead, item.tg, cardNum));
});

// Section 3: Landlines (if any)
if (landlineCount > 0) {
  cardsHtmlList.push(`
    <div class="col-span-full section-divider mt-6 p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2" data-divider-role="landline">
      <div class="flex items-center gap-2.5">
        <span class="text-2xl">☎️</span>
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-300">3. Салоны только с городским телефоном (${landlineCount} салонов)</h2>
          <p class="text-xs text-slate-400 font-mono mt-0.5">Telegram не найден · Требуется уточнение мобильного номера</p>
        </div>
      </div>
      <span class="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 font-mono text-xs border border-slate-700 shrink-0">Карточки #${String(ownerCount + adminCount + 1).padStart(2, '0')} – #${String(leads.length).padStart(2, '0')}</span>
    </div>
  `);
  landlineLeads.forEach(item => {
    cardNum++;
    cardsHtmlList.push(renderLeadCard(item.lead, item.tg, cardNum));
  });
}

const cardsHtml = cardsHtmlList.join('\n');

const fullHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <meta name="sales-stack-sha256" content="${salesStack.hash}">
  <title>Станция Telegram-переписок и видеоразборов: ${leads.length} салонов</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #0B0F14; color: #E2E8F0; -webkit-tap-highlight-color: transparent; }
    .status-deal { border-color: rgba(16, 185, 129, 0.6) !important; background-color: rgba(16, 185, 129, 0.08) !important; }
    .status-sent { border-color: rgba(245, 158, 11, 0.6) !important; background-color: rgba(245, 158, 11, 0.08) !important; }
    .status-call_later { border-color: rgba(59, 130, 246, 0.6) !important; background-color: rgba(59, 130, 246, 0.06) !important; }
    .status-thinking { border-color: rgba(168, 85, 247, 0.6) !important; background-color: rgba(168, 85, 247, 0.06) !important; }
    .status-reject { opacity: 0.45; border-color: rgba(239, 68, 68, 0.3) !important; }
    .status-admin_contact, .status-owner_contact { border-color: rgba(56, 189, 248, 0.5) !important; }
    .status-video_agreed, .status-call_scheduled { border-color: rgba(16, 185, 129, 0.55) !important; background-color: rgba(16, 185, 129, 0.05) !important; }
    .status-review_ready, .status-review_sent, .status-follow_up { border-color: rgba(245, 158, 11, 0.6) !important; }
    .lead-card { min-width: 0; }
    #message-dialog { width: min(680px, calc(100% - 24px)); max-height: calc(100dvh - 24px); overflow-y: auto; color: #E2E8F0; background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 20px; }
    #message-dialog::backdrop { background: rgba(0, 0, 0, .7); }
    #message-text { width: 100%; box-sizing: border-box; min-height: 240px; resize: vertical; padding: 12px; background: #020617; border: 1px solid #334155; border-radius: 10px; font: inherit; line-height: 1.6; }
    #message-note { white-space: pre-line; }
    .stack-markdown { min-width: 0; overflow-wrap: anywhere; font-size: 15px; line-height: 1.65; color: #cbd5e1; }
    .stack-markdown details { margin-top: 12px; border: 1px solid #334155; border-radius: 10px; padding: 12px; }
    .stack-markdown summary { cursor: pointer; font-weight: 700; color: #e2e8f0; }
    .stack-section-content { padding-top: 8px; }
    .stack-markdown p, .stack-markdown ul, .stack-markdown ol, .stack-markdown pre, .stack-markdown blockquote { margin: 10px 0; }
    .stack-markdown ul, .stack-markdown ol { padding-left: 24px; }
    .stack-markdown ul { list-style: disc; } .stack-markdown ol { list-style: decimal; }
    .stack-markdown li + li { margin-top: 5px; }
    .stack-markdown h2, .stack-markdown h3, .stack-markdown h4 { margin: 14px 0 8px; font-size: 17px; font-weight: 700; color: #f8fafc; }
    .stack-markdown blockquote { border-left: 3px solid #38bdf8; padding: 2px 12px; background: #020617; }
    .stack-markdown a { color: #7dd3fc; text-decoration: underline; }
    .stack-markdown code { white-space: pre-wrap; overflow-wrap: anywhere; font-size: .9em; }
    .stack-markdown pre { padding: 12px; border-radius: 8px; background: #020617; white-space: pre-wrap; }
    .stack-table-scroll { max-width: 100%; overflow-x: auto; margin: 12px 0; }
    .stack-markdown table { width: 100%; border-collapse: collapse; min-width: 430px; font-size: 14px; }
    .stack-markdown th, .stack-markdown td { border: 1px solid #334155; text-align: left; padding: 8px; vertical-align: top; }
  </style>
</head>
<body class="p-3 sm:p-6 max-w-7xl mx-auto pb-24">

  <!-- Toast Notification -->
  <div id="toast" class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-mono text-xs px-4 py-2.5 rounded-xl shadow-2xl transition-all duration-300 opacity-0 pointer-events-none translate-y-[-10px]">
    Текст скопирован!
  </div>

  <!-- Header -->
  <header class="mb-4 pb-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
    <div>
      <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/25 text-sky-300 font-mono text-xs uppercase mb-1">
        ✈️ TELEGRAM-ВОРКСТЕЙШН · ВИДЕОРАЗБОРЫ МОТОСАЛОНОВ
      </div>
      <h1 class="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Станция переписки: ${leads.length} салонов</h1>
      <p class="text-sm text-slate-400 mt-1">${escHtml(salesStack.route)}</p>
    </div>

    <!-- Quick Stats & Clock -->
    <div class="flex flex-wrap items-center gap-2.5 bg-slate-900/90 p-2.5 sm:p-3 rounded-2xl border border-slate-800 text-xs font-mono shadow-md w-full sm:w-auto justify-between sm:justify-start">
      <div>
        <span class="text-slate-400 block text-[9px]">БАЗА:</span>
        <span class="text-sm sm:text-base font-bold text-white">${leads.length}</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div>
        <span class="text-emerald-400 block text-[9px]">👑 ВЛАДЕЛЬЦЫ:</span>
        <span class="text-sm sm:text-base font-bold text-emerald-300">${ownerCount}</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div>
        <span class="text-sky-400 block text-[9px]">👨‍💼 АДМИНЫ:</span>
        <span class="text-sm sm:text-base font-bold text-sky-300">${adminCount}</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div>
        <span class="text-slate-400 block text-[9px]">АДМИНУ:</span>
        <span id="stat-admin" class="text-sm sm:text-base font-bold text-sky-400">0</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div>
        <span class="text-slate-400 block text-[9px]">ВИДЕО ОТПР.:</span>
        <span id="stat-sent" class="text-sm sm:text-base font-bold text-amber-400">0</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div>
        <span class="text-slate-400 block text-[9px]">СОЗВОНЫ:</span>
        <span id="stat-call" class="text-sm sm:text-base font-bold text-purple-400">0</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div>
        <span class="text-slate-400 block text-[9px]">СДЕЛКИ:</span>
        <span id="stat-deal" class="text-sm sm:text-base font-bold text-emerald-400">0</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div>
        <span class="text-slate-400 block text-[9px]">ВРЕМЯ МСК:</span>
        <span id="moscow-clock" class="text-sm sm:text-base font-bold text-orange-400">--:--</span>
      </div>
    </div>
  </header>

  <!-- Mobile Live Search -->
  <div class="mb-3">
    <div class="relative">
      <input type="text" id="live-search" placeholder="🔍 Поиск: город, название, @telegram, ФИО из ФНС, телефон..." class="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 font-sans shadow-inner" oninput="liveFilter(this.value)">
      <button type="button" onclick="clearSearch()" id="clear-search-btn" class="hidden absolute right-3 top-3 text-slate-500 hover:text-white font-mono text-xs">✕ Очистить</button>
    </div>
  </div>

  <!-- Controls Bar: Script Toggle + Filters -->
  <div class="mb-4 flex flex-col gap-2.5 bg-slate-900/60 p-2.5 sm:p-3 rounded-2xl border border-slate-800/80">
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" onclick="toggleCheatSheet()" class="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shadow">
        <span>Полный стек продаж</span>
      </button>
      <button type="button" onclick="toggleFollowUp()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs font-mono transition flex items-center gap-1.5 border border-slate-700">
        <span>Ответы, условия и поддержка</span>
      </button>
      <a href="https://t.me/dev_by_max_portfolio" target="_blank" rel="noopener" class="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-bold text-xs font-mono transition border border-sky-500/30">
        <span>💼 Портфолио ↗</span>
      </a>
      <button type="button" onclick="exportData()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-mono text-xs transition border border-slate-700">
        <span>📥 Экспорт CSV</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-1.5 font-mono text-xs overflow-x-auto pb-1" id="filter-buttons">
      <button type="button" onclick="setFilter('all', this)" class="filter-btn active px-2.5 py-1 rounded-lg bg-white/10 text-white font-bold">Все (${leads.length})</button>
      <button type="button" onclick="setFilter('owner_tg', this)" class="filter-btn px-2.5 py-1 rounded-lg text-emerald-300 hover:text-white border border-emerald-500/40">👑 Владельцы (${ownerCount})</button>
      <button type="button" onclick="setFilter('admin_tg', this)" class="filter-btn px-2.5 py-1 rounded-lg text-sky-300 hover:text-white border border-sky-500/35">👨‍💼 Админы (${adminCount})</button>
      <button type="button" onclick="setFilter('tg_direct', this)" class="filter-btn px-2.5 py-1 rounded-lg text-sky-300 hover:text-white border border-sky-500/35">✈️ Прямой ТГ (${directTgCount})</button>
      <button type="button" onclick="setFilter('tg_any', this)" class="filter-btn px-2.5 py-1 rounded-lg text-teal-300 hover:text-white border border-teal-500/30">📱 Есть ТГ/моб. (${anyTgCount})</button>
      <button type="button" onclick="setFilter('has_site', this)" class="filter-btn px-2.5 py-1 rounded-lg text-sky-300 hover:text-white border border-sky-500/30">Сайт указан (${hasSiteCount})</button>
      <button type="button" onclick="setFilter('no_site', this)" class="filter-btn px-2.5 py-1 rounded-lg text-emerald-300 hover:text-white border border-emerald-500/30">Сайт не указан (${noSiteCount})</button>
      <button type="button" onclick="setFilter('new', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-white">Новые</button>
      <button type="button" onclick="setFilter('admin_contact', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-sky-400">Админу</button>
      <button type="button" onclick="setFilter('owner_contact', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-orange-400">Контакт владельца</button>
      <button type="button" onclick="setFilter('video_agreed', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-emerald-300">Согласился на видео</button>
      <button type="button" onclick="setFilter('review_sent', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-amber-400">Видео отправлено</button>
      <button type="button" onclick="setFilter('call_scheduled', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-emerald-400">Созвон</button>
      <button type="button" onclick="setFilter('deal', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-emerald-400">Сделки</button>
      <button type="button" onclick="setFilter('sent', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-500 hover:text-white">Ссылка (старый)</button>
      <button type="button" onclick="setFilter('call_later', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-500 hover:text-white">Перезвон (старый)</button>
    </div>
  </div>

  <!-- Sales guidance is rendered directly from FULL_SALES_STACK.md at build time. -->
  <div id="cheatsheet" class="hidden mb-4 p-4 sm:p-5 bg-slate-900 border border-orange-500/40 rounded-2xl shadow-2xl">
    <div class="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
      <h2 class="text-base font-bold text-orange-400">Полный стек продаж</h2>
      <button type="button" onclick="toggleCheatSheet()" class="text-slate-300 text-sm">Закрыть</button>
    </div>
    <p class="my-3 text-sm text-slate-400">Источник подсказок: <code>sales/FULL_SALES_STACK.md</code>. Разделы раскрываются по нажатию.</p>
    ${salesStack.guideHtml}
  </div>

  <div id="followup" class="hidden mb-4 p-4 sm:p-5 bg-slate-900 border border-sky-500/40 rounded-2xl shadow-2xl">
    <div class="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
      <h2 class="text-base font-bold text-sky-400">Ответы, условия и поддержка</h2>
      <button type="button" onclick="toggleFollowUp()" class="text-slate-300 text-sm">Закрыть</button>
    </div>
    ${salesStack.faqHtml}
  </div>

  <dialog id="message-dialog" aria-labelledby="message-title">
    <form method="dialog" class="flex justify-between items-center gap-3 mb-3">
      <h2 id="message-title" class="text-lg font-bold">Черновик сообщения</h2>
      <button type="submit" class="px-3 py-2 bg-slate-800 rounded-lg" aria-label="Закрыть черновик">Закрыть</button>
    </form>
    <p id="message-note" class="text-xs text-amber-300 mb-3 leading-relaxed"></p>
    <label for="message-text" class="block text-xs text-slate-400 mb-2">Текст можно изменить перед копированием</label>
    <textarea id="message-text" spellcheck="true"></textarea>
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" onclick="copyMessageDraft()" class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm">Скопировать текст</button>
      <a id="dialog-tg-link" href="#" target="_blank" rel="noopener" class="hidden px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm">✈️ Открыть Telegram ↗</a>
    </div>
    <p id="message-copy-status" class="mt-2 text-xs text-slate-400" role="status" aria-live="polite">Отправки из станции нет. Статус карточки не изменится.</p>
    <details id="video-draft-guide" class="hidden stack-markdown mt-4">
      <summary>Подготовка видео · из полного стека</summary>
      ${salesStack.videoGuideHtml}
    </details>
    <details id="call-draft-guide" class="hidden stack-markdown mt-4">
      <summary>Когда звонить и что спросить · из полного стека</summary>
      ${salesStack.callGuideHtml}
    </details>
  </dialog>

  <!-- Leads Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4" id="cards-container">
    ${cardsHtml}
  </div>

  <script>
    const leadsData = ${JSON.stringify(enrichedLeads.map(({ lead, tg }) => ({
      slug: lead.slug,
      name: lead.facts.name,
      city: lead.facts.city,
      address: lead.facts.address,
      phone: tg.verifiedPhone,
      hasWebsite: Boolean(lead.facts.has_website),
      existingWebsite: lead.facts.existing_website || '',
      extraWebsite: tg.extraWebsite || '',
      tgUrl: tg.primaryUrl,
      tgLabel: tg.primaryLabel,
      tgBadge: tg.tierBadge,
      fnsOwner: tg.fnsOwner
    })), null, 2)};

    const STORAGE_KEY = 'motosalon_crm_statuses_v2';
    const NOTES_KEY = 'motosalon_crm_notes_v2';
    const salesStackData = ${JSON.stringify(salesStackData).replace(/</g, '\\u003c')};
    const getDraftTemplateKey = ${getDraftTemplateKey.toString()};
    const createOutreachDraft = ${createOutreachDraft.toString()};

    function getStatuses() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) { return {}; }
    }

    function saveStatuses(data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function getNotes() {
      try { return JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; } catch(e) { return {}; }
    }

    function saveNote(slug, text) {
      const notes = getNotes();
      notes[slug] = text;
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    }

    function updateStatus(slug, status) {
      const statuses = getStatuses();
      statuses[slug] = status;
      saveStatuses(statuses);
      applyCardColor(slug, status);
      updateStats();
      applyFilters();
    }

    function applyCardColor(slug, status) {
      const card = document.getElementById('card-' + slug);
      if (!card) return;
      card.dataset.status = status;
      card.classList.remove('status-deal', 'status-sent', 'status-call_later', 'status-thinking', 'status-reject', 'status-admin_contact', 'status-owner_contact', 'status-video_agreed', 'status-call_scheduled', 'status-review_ready', 'status-review_sent', 'status-follow_up');
      if (status !== 'new') card.classList.add('status-' + status);
    }

    function updateStats() {
      const statuses = getStatuses();
      let admin = 0, sent = 0, call = 0, deal = 0;
      for (const slug in statuses) {
        if (statuses[slug] === 'admin_contact' || statuses[slug] === 'owner_contact') admin++;
        if (statuses[slug] === 'review_sent') sent++;
        if (statuses[slug] === 'call_scheduled') call++;
        if (statuses[slug] === 'deal') deal++;
      }
      const adminEl = document.getElementById('stat-admin');
      if (adminEl) adminEl.textContent = admin;
      document.getElementById('stat-sent').textContent = sent;
      document.getElementById('stat-call').textContent = call;
      document.getElementById('stat-deal').textContent = deal;
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
      setTimeout(() => {
        t.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
      }, 2500);
    }

    async function copyContact(value) {
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(value);
        showToast('Контакт скопирован: ' + value);
      } catch (_) {
        prompt('Скопируйте контакт вручную:', value);
      }
    }

    function openMessageDraft(slug, kind, variant) {
      const lead = leadsData.find(l => l.slug === slug);
      if (!lead) return;
      const labels = {
        admin: '1. Админу (ТГ)',
        owner: '2. Владельцу — вопрос до записи видео',
        review: '3. Текст к готовому видео',
        call: '4. Созвон при интересе'
      };
      const key = getDraftTemplateKey(lead, kind, variant);
      document.getElementById('video-draft-guide').classList.toggle('hidden', kind !== 'review');
      document.getElementById('call-draft-guide').classList.toggle('hidden', kind !== 'call');
      document.getElementById('message-title').textContent = labels[kind] + ' — ' + lead.name;
      document.getElementById('message-note').textContent = salesStackData.notes[key];
      document.getElementById('message-text').value = createOutreachDraft(lead, kind, variant);
      document.getElementById('message-copy-status').textContent = 'Отправки из станции нет. Статус карточки не изменится.';

      const tgLink = document.getElementById('dialog-tg-link');
      if (lead.tgUrl) {
        tgLink.href = lead.tgUrl;
        tgLink.classList.remove('hidden');
      } else {
        tgLink.classList.add('hidden');
      }

      const dialog = document.getElementById('message-dialog');
      if (!dialog.open) dialog.showModal();
      const messageText = document.getElementById('message-text');
      messageText.focus();
      messageText.setSelectionRange(0, 0);
      messageText.scrollTop = 0;
      messageText.scrollLeft = 0;
    }

    async function copyMessageDraft() {
      const input = document.getElementById('message-text');
      const status = document.getElementById('message-copy-status');
      const unfinished = /\\[[^\\]]+\\]/.test(input.value);
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(input.value);
        status.textContent = unfinished
          ? 'Черновик скопирован. Перед отправкой заполни поля в [квадратных скобках]. Ничего не отправлено.'
          : 'Текст скопирован. Ничего не отправлено; статус карточки не изменён.';
      } catch (_) {
        input.focus();
        input.select();
        status.textContent = 'Текст выделен — скопируй вручную. Заполни квадратные скобки перед отправкой. Ничего не отправлено.';
      }
    }

    function toggleCheatSheet() {
      document.getElementById('cheatsheet').classList.toggle('hidden');
    }

    function toggleFollowUp() {
      document.getElementById('followup').classList.toggle('hidden');
    }

    let currentFilter = 'all';

    function setFilter(status, btn) {
      currentFilter = status;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'bg-white/10', 'text-white', 'font-bold'));
      if (btn) {
        btn.classList.add('active', 'bg-white/10', 'text-white', 'font-bold');
      }
      applyFilters();
    }

    function liveFilter(val) {
      const clearBtn = document.getElementById('clear-search-btn');
      if (val && val.trim().length > 0) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
      applyFilters();
    }

    function clearSearch() {
      const input = document.getElementById('live-search');
      input.value = '';
      document.getElementById('clear-search-btn').classList.add('hidden');
      applyFilters();
    }

    function applyFilters() {
      const searchVal = (document.getElementById('live-search').value || '').trim().toLowerCase();
      document.querySelectorAll('.lead-card').forEach(card => {
        let matchStatus = true;
        if (currentFilter === 'all') {
          matchStatus = true;
        } else if (currentFilter === 'owner_tg') {
          matchStatus = (card.dataset.contactRole === 'owner');
        } else if (currentFilter === 'admin_tg') {
          matchStatus = (card.dataset.contactRole === 'admin');
        } else if (currentFilter === 'tg_direct') {
          matchStatus = (card.dataset.tgGroup === 'direct');
        } else if (currentFilter === 'tg_any') {
          matchStatus = (card.dataset.tgGroup !== 'none');
        } else if (currentFilter === 'no_site') {
          matchStatus = (card.dataset.hasWebsite === 'no');
        } else if (currentFilter === 'has_site') {
          matchStatus = (card.dataset.hasWebsite === 'yes');
        } else {
          matchStatus = ((card.dataset.status || 'new') === currentFilter);
        }

        let matchSearch = true;
        if (searchVal.length > 0) {
          const cardText = card.dataset.search || '';
          matchSearch = cardText.includes(searchVal);
        }

        if (matchStatus && matchSearch) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      document.querySelectorAll('.section-divider').forEach(div => {
        const divRole = div.dataset.dividerRole;
        if (currentFilter === 'all' && searchVal.length === 0) {
          div.classList.remove('hidden');
        } else if (divRole && (currentFilter === 'owner_tg' && divRole === 'owner' || currentFilter === 'admin_tg' && divRole === 'admin')) {
          div.classList.remove('hidden');
        } else {
          const hasVisible = Array.from(document.querySelectorAll('.lead-card[data-contact-role="' + divRole + '"]')).some(c => !c.classList.contains('hidden'));
          if (hasVisible) {
            div.classList.remove('hidden');
          } else {
            div.classList.add('hidden');
          }
        }
      });
    }

    function exportData() {
      const statuses = getStatuses();
      const notes = getNotes();
      const rows = [['Номер', 'Slug', 'Название', 'Город', 'Telegram', 'ФНС', 'Телефон', 'Статус', 'Заметка']];
      leadsData.forEach((l, i) => {
        rows.push([
          i + 1,
          l.slug,
          '"' + l.name.replace(/"/g, '""') + '"',
          '"' + l.city.replace(/"/g, '""') + '"',
          '"' + (l.tgLabel || '').replace(/"/g, '""') + '"',
          '"' + (l.fnsOwner || '').replace(/"/g, '""') + '"',
          '"' + (l.phone || '').replace(/"/g, '""') + '"',
          statuses[l.slug] || 'new',
          '"' + (notes[l.slug] || '').replace(/"/g, '""') + '"'
        ]);
      });
      const csv = '\\uFEFF' + rows.map(r => r.join(';')).join('\\r\\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'motosalon_telegram_outreach_' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
    }

    function updateLiveClocks() {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const mskTime = new Date(utc + (3600000 * 3));

      const formatTime = (d) => {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
      };

      const mskEl = document.getElementById('moscow-clock');
      if (mskEl) mskEl.textContent = formatTime(mskTime);

      document.querySelectorAll('.local-time[data-offset]').forEach(el => {
        const offset = parseInt(el.getAttribute('data-offset'), 10);
        const local = new Date(mskTime.getTime() + (offset * 3600000));
        el.textContent = 'Местное: ' + formatTime(local);
      });
    }

    document.addEventListener('DOMContentLoaded', () => {
      const statuses = getStatuses();
      const notes = getNotes();

      for (const slug in statuses) {
        const select = document.getElementById('select-' + slug);
        if (select) {
          select.value = statuses[slug];
          applyCardColor(slug, statuses[slug]);
        }
      }

      for (const slug in notes) {
        const input = document.getElementById('note-' + slug);
        if (input) input.value = notes[slug];
      }

      updateStats();
      updateLiveClocks();
      setInterval(updateLiveClocks, 10000);
    });
  </script>
</body>
</html>
`;

const normalizedHtml = fullHtml.replace(/[\t ]+$/gm, '');
fs.writeFileSync(salesFile, normalizedHtml, 'utf8');
fs.writeFileSync(distStationFile, normalizedHtml, 'utf8');
fs.writeFileSync(distStationAlias, normalizedHtml, 'utf8');

console.log(`Станция Telegram-переписок собрана для ${leads.length} мотосалонов:`);
console.log(`- Прямой ТГ (личный / салона): ${directTgCount}`);
console.log(`- Всего с ТГ или проверенным мобильным: ${anyTgCount}`);
console.log(`- Сайт указан: ${hasSiteCount}, сайт не указан: ${noSiteCount}`);
console.log(`- Локальный: ${salesFile}`);
console.log(`- Публичный: ${distStationFile}`);
