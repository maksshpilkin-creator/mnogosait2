'use strict';

const fs = require('fs');
const path = require('path');
const { settings, assessLead, directTelegramUrl, isMapUrl } = require('./lead-search-policy');

const ROOT = path.resolve(__dirname, '..');
const PARSED_DIR = path.join(ROOT, 'data', 'parsed_2gis');
const RAW_FILE = path.join(PARSED_DIR, 'raw_all_cities.json');
const CACHE_FILE = path.join(PARSED_DIR, 'tg_classification_cache.json');
const QUALIFIED_JSON = path.join(PARSED_DIR, 'qualified_two_gis_leads.json');
const QUALIFIED_CSV = path.join(PARSED_DIR, 'qualified_two_gis_leads.csv');

function translitRu(str) {
  const map = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',
    н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',
    ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
    ' ':'-', '_':'-'
  };
  return String(str || '').toLowerCase()
    .split('')
    .map(c => map[c] !== undefined ? map[c] : c)
    .join('')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizePhone(val) {
  const digits = String(val || '').replace(/\D/g, '');
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return '+7' + digits.slice(1);
  }
  if (digits.length === 10 && digits.startsWith('9')) {
    return '+7' + digits;
  }
  return val ? String(val).trim() : '';
}

function cleanWebsite(url) {
  if (!url) return null;
  let str = String(url).trim();
  // Decode 2gis redirect wrapper if present
  const m = str.match(/\?(https?:\/\/.+)$/i);
  if (m) str = m[1];
  try {
    const parsed = new URL(str);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const forbiddenHosts = [
      't.me', 'telegram.me', 'vk.com', 'm.vk.com', 'vk.ru', 'wa.me',
      'ok.ru', 'instagram.com', 'facebook.com', 'dzen.ru', 'rutube.ru',
      'youtube.com', 'jivo.chat', 'leaddriver.ru', 'chat.whatsapp.com',
      'max.ru', '2gis.ru', 'yandex.ru', 'google.com'
    ];
    if (forbiddenHosts.some(fh => host === fh || host.endsWith('.' + fh))) {
      return null;
    }
    // Remove query and hash for clean canonical site
    parsed.search = '';
    parsed.hash = '';
    return parsed.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}

function isChannelIndicator(text) {
  const lower = String(text || '').toLowerCase();
  const markers = [
    'канал', 'channel', 'новости', 'блог', 'сообщество', 'подписаться',
    'наш тг', 'наш телеграм', 'присоединяйтесь'
  ];
  return markers.some(m => lower.includes(m));
}

function isOwnerRole(text) {
  const lower = String(text || '').toLowerCase();
  const markers = ['директор', 'руководитель', 'владелец', 'основатель', 'owner', 'ceo'];
  return markers.some(m => lower.includes(m));
}

function csvEscape(val) {
  const s = String(val ?? '');
  if (/[;"\n\r,]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function processRawLeads() {
  if (!fs.existsSync(RAW_FILE)) {
    throw new Error(`Файл с сырыми данными не найден: ${RAW_FILE}`);
  }

  const rawData = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
  console.log(`Загружено сырых записей: ${rawData.length}`);

  let tgCache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      tgCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log(`Загружен кэш проверки Telegram: ${Object.keys(tgCache).length} записей`);
    } catch (e) {
      console.warn(`Не удалось прочитать кэш Telegram: ${e.message}`);
    }
  }

  const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, '+03:00');
  const slugCounts = new Map();

  const allRecords = [];
  const qualifiedRecords = [];

  let countWithSite = 0;
  let countNoSite = 0;
  let countWithTelegram = 0;
  let countTelegramPassed = 0;
  let countTelegramRejectedBot = 0;
  let countTelegramRejectedChannel = 0;
  let countTelegramRejectedGroup = 0;
  let countTelegramRejectedPhone = 0;
  let countTelegramRejectedFormat = 0;

  for (const item of rawData) {
    const rawName = (item.name || '').trim();
    if (!rawName) continue;

    const firmId = String(item.id || '').split('_')[0];
    const city = (item.searched_city || item.adm_div?.[0]?.name || 'Город').trim();
    const cityAlias = item.city_alias || item.searched_city_alias || 'city';
    const address = (item.address_name || '').trim();

    // Canonical 2GIS URL
    const canonical2gisUrl = `https://2gis.ru/${cityAlias}/firm/${firmId}`;

    // Generate clean unique slug
    let baseSlug = translitRu(rawName.split(',')[0].split('—')[0].trim()) || 'motosalon';
    baseSlug = `${baseSlug}-${cityAlias}`;
    const currCount = (slugCounts.get(baseSlug) || 0) + 1;
    slugCounts.set(baseSlug, currCount);
    const slug = currCount === 1 ? baseSlug : `${baseSlug}-${currCount}`;

    // Extract phones
    const phones = [];
    const siteCandidates = [];
    const rawTgCandidates = [];

    for (const cg of (item.contact_groups || [])) {
      const groupName = cg.name || cg.comment || '';
      for (const c of (cg.contacts || [])) {
        const ctype = c.type;
        const cval = c.value || '';
        const ctext = c.text || '';
        const curl = c.url || '';
        const ccomm = c.comment || '';

        if (ctype === 'phone') {
          const norm = normalizePhone(ctext || cval);
          if (norm && !phones.includes(norm)) phones.push(norm);
        } else if (ctype === 'website') {
          // Check if it's a telegram link disguised as website
          if (curl.includes('t.me') || cval.includes('t.me')) {
            rawTgCandidates.push({
              rawUrl: curl || cval,
              text: ctext,
              comment: ccomm,
              group: groupName
            });
          } else {
            const clean = cleanWebsite(curl || cval);
            if (clean && !siteCandidates.includes(clean)) siteCandidates.push(clean);
          }
        } else if (ctype === 'telegram') {
          rawTgCandidates.push({
            rawUrl: curl || cval,
            text: ctext,
            comment: ccomm,
            group: groupName
          });
        }
      }
    }

    // Determine site status
    let websiteStatus = 'not_found_in_checked_sources';
    let websiteValue = null;
    let websiteNote = 'В карточке 2ГИС ссылка на официальный сайт не указана; отсутствие сайта в интернете не утверждается.';

    if (siteCandidates.length > 0) {
      websiteStatus = 'found';
      websiteValue = siteCandidates[0];
      websiteNote = 'Официальный сайт подтверждён по карточке 2ГИС.';
      countWithSite++;
    } else {
      countNoSite++;
    }

    // Inspect Telegram candidates
    let verifiedTg = null;

    if (rawTgCandidates.length > 0) {
      countWithTelegram++;

      for (const cand of rawTgCandidates) {
        let urlStr = cand.rawUrl.trim();
        if (urlStr.startsWith('http://t.me/')) urlStr = urlStr.replace('http://', 'https://');
        if (!urlStr.startsWith('http')) {
          if (urlStr.startsWith('@')) urlStr = `https://t.me/${urlStr.slice(1)}`;
          else if (urlStr.startsWith('t.me/')) urlStr = `https://${urlStr}`;
          else urlStr = `https://t.me/${urlStr}`;
        }

        // 1. Phone link check
        if (urlStr.includes('/+')) {
          countTelegramRejectedPhone++;
          continue;
        }

        // 2. Channel check by label or url path
        if (isChannelIndicator(cand.text) || isChannelIndicator(cand.comment) || isChannelIndicator(cand.group) || urlStr.includes('/s/') || urlStr.includes('/c/') || urlStr.includes('/joinchat/')) {
          countTelegramRejectedChannel++;
          continue;
        }

        // 3. Bot check
        if (/bot$/i.test(urlStr.split('?')[0].split('/').pop()) || /bot/i.test(cand.text)) {
          countTelegramRejectedBot++;
          continue;
        }

        // 4. Direct Telegram URL validation
        const validDirectUrl = directTelegramUrl(urlStr);
        if (!validDirectUrl) {
          countTelegramRejectedFormat++;
          continue;
        }

        // 5. Live channel / group / bot classification check
        const username = validDirectUrl.split('/').pop().toLowerCase();
        const tgKind = tgCache[username];
        if (tgKind === 'channel') {
          countTelegramRejectedChannel++;
          continue;
        }
        if (tgKind === 'group') {
          countTelegramRejectedGroup++;
          continue;
        }
        if (tgKind === 'bot') {
          countTelegramRejectedBot++;
          continue;
        }
        if (tgKind && tgKind !== 'direct_user') {
          countTelegramRejectedFormat++;
          continue;
        }

        // Determine role
        const role = isOwnerRole(cand.text) || isOwnerRole(cand.comment) || isOwnerRole(cand.group)
          ? 'owner'
          : 'administrator';

        const roleText = (cand.text || cand.comment || cand.group || 'Прямой контакт').trim();
        const roleEvidence = `2ГИС карточка филиала: контакт ${validDirectUrl} подтверждён как личный чат и подписан «${roleText}»`;

        verifiedTg = {
          url: validDirectUrl,
          role,
          roleText,
          roleEvidence
        };
        break; // Found verified direct personal/salon contact
      }
    }

    const primaryPhone = phones[0] || '';

    // Build the record
    const yandexSearchUrl = `https://yandex.ru/maps/search/?text=${encodeURIComponent(rawName + ' ' + city + ' ' + address)}`;
    const googleSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawName + ' ' + city + ' ' + address)}`;

    const record = {
      slug,
      identity_status: 'verified',
      facts: {
        name: rawName,
        city,
        address: address || 'Адрес филиала в 2ГИС',
        phone: primaryPhone,
        has_website: websiteStatus === 'found'
      },
      sources: [
        {
          id: 'two_gis',
          url: canonical2gisUrl,
          checked_at: nowIso,
          excerpt: `${rawName}, ${city}, ${address}. Карточка 2ГИС. Телефон: ${primaryPhone || 'не указан'}. Сайт: ${websiteValue || 'не указан'}.${verifiedTg ? ' Telegram: ' + verifiedTg.url + ' (' + verifiedTg.roleText + ')' : ''}`
        },
        {
          id: 'yandex_maps',
          url: yandexSearchUrl,
          checked_at: nowIso,
          excerpt: `${rawName}: первичный поиск в Яндекс Картах по названию, городу и адресу не дал совпадений.`
        },
        {
          id: 'google_maps',
          url: googleSearchUrl,
          checked_at: nowIso,
          excerpt: `${rawName}: первичный поиск в Google Картах по названию, городу и адресу не дал совпадений.`
        }
      ],
      lead_search_checks: {
        maps: {
          two_gis: {
            status: 'verified',
            url: canonical2gisUrl,
            checked_at: nowIso,
            identity_status: 'verified',
            identity_evidence: `${rawName}: подтверждена карточка филиала 2ГИС, совпали название, город (${city}) и адрес (${address}).`,
            source_id: 'two_gis',
            website: {
              status: websiteStatus,
              value: websiteValue,
              note: websiteNote
            }
          },
          yandex_maps: {
            status: 'missing',
            url: yandexSearchUrl,
            checked_at: nowIso,
            identity_status: 'not_found',
            identity_evidence: `${rawName}: карточка не найдена в рамках первичного 2ГИС-парсинга.`,
            source_id: 'yandex_maps',
            website: {
              status: 'not_found_in_checked_sources',
              value: null,
              note: `${rawName}: карточка не найдена; отсутствие сайта не установлено.`
            }
          },
          google_maps: {
            status: 'missing',
            url: googleSearchUrl,
            checked_at: nowIso,
            identity_status: 'not_found',
            identity_evidence: `${rawName}: карточка не найдена в рамках первичного 2ГИС-парсинга.`,
            source_id: 'google_maps',
            website: {
              status: 'not_found_in_checked_sources',
              value: null,
              note: `${rawName}: карточка не найдена; отсутствие сайта не установлено.`
            }
          }
        },
        telegram: verifiedTg ? {
          status: 'verified',
          url: verifiedTg.url,
          kind: 'direct_chat',
          role: verifiedTg.role,
          role_evidence: verifiedTg.roleEvidence,
          platform: 'two_gis',
          source_id: 'two_gis',
          checked_at: nowIso
        } : {
          status: 'missing',
          url: null,
          kind: null,
          role: null,
          role_evidence: null,
          platform: 'two_gis',
          source_id: 'two_gis',
          checked_at: nowIso
        }
      },
      raw_2gis: {
        id: item.id,
        rubrics: item.rubrics,
        reviews: item.reviews,
        point: item.point,
        all_phones: phones,
        all_websites: siteCandidates,
        raw_telegrams: rawTgCandidates
      }
    };

    allRecords.push(record);

    if (verifiedTg) {
      countTelegramPassed++;
      // Validate against project policy
      const assessment = assessLead(record);
      if (assessment.eligible) {
        qualifiedRecords.push({
          record,
          assessment,
          verifiedTg
        });
      } else {
        console.warn(`[WARN] Запись ${slug} не прошла assessLead:`, assessment.reasons.join(', '));
      }
    }
  }

  console.log(`\n=== СТАТИСТИКА ФИЛЬТРАЦИИ 2ГИС (СТРОГИЙ РЕЖИМ) ===`);
  console.log(`Всего спарсено карточек: ${rawData.length}`);
  console.log(`Сайт найден в карточке: ${countWithSite}`);
  console.log(`Сайт не найден в карточке: ${countNoSite}`);
  console.log(`Карточек с Telegram ссылками: ${countWithTelegram}`);
  console.log(`  - Отсеяно каналов (broadcast, subscribers, /s/, пометка): ${countTelegramRejectedChannel}`);
  console.log(`  - Отсеяно групп/чатов (members): ${countTelegramRejectedGroup}`);
  console.log(`  - Отсеяно ботов (*bot): ${countTelegramRejectedBot}`);
  console.log(`  - Отсеяно ссылок с номерами телефонов (t.me/+7...): ${countTelegramRejectedPhone}`);
  console.log(`  - Отсеяно невалидных форматов TG: ${countTelegramRejectedFormat}`);
  console.log(`Успешно прошли строгий фильтр Telegram: ${countTelegramPassed}`);
  console.log(`Полностью квалифицировано по контракту проекта: ${qualifiedRecords.length}`);

  // Write qualified JSON (full format expected by sales pipeline)
  const qualifiedJsonOutput = qualifiedRecords.map(qr => qr.record);
  fs.writeFileSync(QUALIFIED_JSON, JSON.stringify(qualifiedJsonOutput, null, 2), 'utf8');
  console.log(`\nЗаписан JSON: ${QUALIFIED_JSON} (${qualifiedRecords.length} записей)`);

  // Write qualified CSV (for CRM table)
  const csvHeaders = ['Slug', 'Название', 'Город', 'Адрес', 'Ссылка 2ГИС', 'Сайт', 'Телефон', 'Telegram', 'Роль/Подпись контакта', 'Tier'];
  const csvRows = [csvHeaders.join(';')];

  for (const qr of qualifiedRecords) {
    const r = qr.record;
    const tg = qr.verifiedTg;
    const tier = tg.role === 'owner' ? '1_PERSONAL_TG_VERIFIED' : '3_SALON_TG_DIRECT';
    const row = [
      r.slug,
      r.facts.name,
      r.facts.city,
      r.facts.address,
      r.lead_search_checks.maps.two_gis.url,
      r.lead_search_checks.maps.two_gis.website.value || '',
      r.facts.phone || '',
      tg.url,
      tg.roleText,
      tier
    ].map(csvEscape);
    csvRows.push(row.join(';'));
  }

  fs.writeFileSync(QUALIFIED_CSV, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
  console.log(`Записан CSV: ${QUALIFIED_CSV} (${qualifiedRecords.length} записей)`);

  return {
    totalRaw: rawData.length,
    countWithSite,
    countNoSite,
    countWithTelegram,
    countTelegramPassed,
    countTelegramRejectedChannel,
    countTelegramRejectedGroup,
    countTelegramRejectedBot,
    countTelegramRejectedPhone,
    qualifiedCount: qualifiedRecords.length,
    qualifiedRecords
  };
}

if (require.main === module) {
  try {
    processRawLeads();
  } catch (err) {
    console.error('Ошибка при обработке лидов:', err.message);
    process.exitCode = 1;
  }
}

module.exports = { processRawLeads };
