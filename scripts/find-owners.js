#!/usr/bin/env node
'use strict';

/**
 * Строгий отбор контактов по проверкам карт в data/facts/*.json.
 * Карты открывает исследователь по sales/LEAD_SEARCH_RULES.md; этот скрипт
 * проверяет комплект доказательств, не скрейпит карты и не угадывает Telegram.
 * Не изменяет template/, dist/, data/facts/ или content/.
 * Результаты сохраняет в:
 *   - sales/qualified_owners_telegram.csv (UTF-8 BOM для Excel)
 *   - sales/qualified_owners_telegram.json (новая строгая выборка с доказательствами)
 * Старые owners_telegram.json/csv/vcf и станция не изменяются.
 *
 * Использование:
 *   node scripts/find-owners.js --limit 25
 *   node scripts/find-owners.js --only-no-site --limit 30
 *   node scripts/find-owners.js --only-with-site
 *   node scripts/find-owners.js --slugs motobro,ponarin-mx,67moto-smolensk
 *   node scripts/find-owners.js --all
 *   node scripts/find-owners.js --all --dry-run
 */

const fs = require('fs');
const path = require('path');
const { settings, assessLead, mergeResults } = require('./lead-search-policy');

const ROOT = path.resolve(__dirname, '..');
const FACTS_DIR = path.join(ROOT, 'data', 'facts');
const SALES_DIR = path.join(ROOT, 'sales');

const args = process.argv.slice(2);
function getArg(name, def = null) {
  const eq = args.find(a => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) return args[idx + 1];
  return def;
}
const hasFlag = (name) => args.includes(`--${name}`);

const LIMIT = hasFlag('all') ? Infinity : Number(getArg('limit', '20'));
const ONLY_NO_SITE = hasFlag('only-no-site');
const ONLY_WITH_SITE = hasFlag('only-with-site');
const DRY_RUN = hasFlag('dry-run');
const SLUGS_FILTER = getArg('slugs', '') ? getArg('slugs', '').split(',').map(s => s.trim()).filter(Boolean) : null;
const CONCURRENCY = Math.max(1, Math.min(6, Number(getArg('concurrency', '4'))));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Известные служебные ИНН банков/агрегаторов, которые иногда встречаются в футерах чужих сайтов
const BLACKLIST_INNS = new Set([
  '7707083893', // Сбербанк
  '7710140679', // Т-Банк / Тинькофф
  '7728168971', // Альфа-Банк
  '7702070139', // ВТБ
  '7736207543', // Яндекс
  '7704217370', // VK / Mail.ru
  '7743001840', // ВК
  '7705934206', // ЮKassa
  '7724338125', // Tilda
]);

function isValidInn(inn) {
  if (!/^\d{10}$|^\d{12}$/.test(inn)) return false;
  if (BLACKLIST_INNS.has(inn)) return false;
  const d = inn.split('').map(Number);
  if (d.length === 10) {
    const w = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    const sum = w.reduce((acc, wi, i) => acc + wi * d[i], 0);
    return (sum % 11) % 10 === d[9];
  }
  if (d.length === 12) {
    const w1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const w2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const c1 = (w1.reduce((acc, wi, i) => acc + wi * d[i], 0) % 11) % 10;
    const c2 = (w2.reduce((acc, wi, i) => acc + wi * d[i], 0) % 11) % 10;
    return c1 === d[10] && c2 === d[11];
  }
  return false;
}

function normalizePhoneDigits(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return '7' + digits.slice(1);
  }
  if (digits.length === 10 && digits.startsWith('9')) {
    return '7' + digits;
  }
  return '';
}

function isMobilePhone(digits) {
  return /^79\d{9}$/.test(digits);
}

function translitRu(str) {
  const map = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',
    н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',
    ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'
  };
  return String(str || '').toLowerCase().split('').map(c => map[c] ?? c).join('').replace(/[^a-z0-9]+/g, '');
}

async function fetchDecoded(url, timeout = 8000) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeout)
    });
    const ct = res.headers.get('content-type') || '';
    const buf = await res.arrayBuffer();
    let charset = 'utf-8';
    if (/windows-1251|cp1251/i.test(ct)) charset = 'windows-1251';
    let text = new TextDecoder(charset).decode(buf);
    if (charset === 'utf-8' && /charset=["']?windows-1251/i.test(text.slice(0, 2000))) {
      text = new TextDecoder('windows-1251').decode(buf);
    }
    return { status: res.status, url: res.url, text };
  } catch (e) {
    return { error: e.message };
  }
}

async function lookupCheckoByINN(inn) {
  try {
    const r = await fetchDecoded('https://checko.ru/search?query=' + encodeURIComponent(inn), 8000);
    if (r.error || r.status !== 200) return null;
    const clean = r.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const ipMatch = clean.match(/ИП\s+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)/);
    if (ipMatch) {
      return {
        legal_name: ipMatch[1].toUpperCase(),
        inn,
        ogrn: '',
        reg_date: '',
        director: '',
        kind: 'ИП',
        active: true,
        source_url: 'https://checko.ru/search?query=' + inn
      };
    }
    const dirMatch = clean.match(/(?:Генеральный директор|Директор|Руководитель)\s+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)/i);
    const oooMatch = clean.match(/ООО\s+[«"']([^»"']{2,50})[»"']/);
    if (dirMatch || oooMatch) {
      return {
        legal_name: oooMatch ? `ООО "${oooMatch[1]}"` : '',
        inn,
        ogrn: '',
        reg_date: '',
        director: dirMatch ? `Директор: ${dirMatch[1]}` : '',
        kind: 'ООО/ЮЛ',
        active: true,
        source_url: 'https://checko.ru/search?query=' + inn
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Последовательная очередь для запросов к ФНС с fallback на Checko.ru
let nalogQueue = Promise.resolve();
function lookupNalogByINN(inn) {
  const run = async () => {
    try {
      const sRes = await fetch('https://egrul.nalog.ru/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': UA
        },
        body: 'query=' + encodeURIComponent(inn),
        signal: AbortSignal.timeout(8000)
      });
      const sData = await sRes.json();
      if (sData && sData.t && !sData.captchaRequired) {
        await new Promise(r => setTimeout(r, 1100));
        const rRes = await fetch('https://egrul.nalog.ru/search-result/' + sData.t, {
          headers: { 'User-Agent': UA },
          signal: AbortSignal.timeout(8000)
        });
        const rData = await rRes.json();
        const rows = (rData && rData.rows) || [];
        if (rows.length) {
          const active = rows.find(r => !r.e) || rows[0];
          return {
            legal_name: active.n || '',
            inn: active.i || inn,
            ogrn: active.o || '',
            reg_date: active.r || '',
            director: active.g || '',
            kind: active.k === 'fl' ? 'ИП' : 'ООО/ЮЛ',
            active: !active.e,
            source_url: 'https://egrul.nalog.ru/'
          };
        }
      }
    } catch {}
    // Fallback на Checko.ru если ФНС выдала таймаут/капчу
    await new Promise(r => setTimeout(r, 400));
    return lookupCheckoByINN(inn);
  };
  nalogQueue = nalogQueue.then(run, run);
  return nalogQueue;
}

async function inspectTGHandle(rawHandle) {
  const clean = String(rawHandle || '')
    .replace(/^https?:\/\/(?:t\.me|telegram\.me)\//i, '')
    .replace(/^@/, '')
    .split('?')[0]
    .split('/')[0]
    .trim();
  if (!clean || clean.length < 4 || clean.startsWith('+') || !/^[a-zA-Z0-9_]+$/.test(clean)) return null;
  if (['telegram', 'share', 'joinchat', 'addstickers', 'proxy', 'socks', 'iv'].includes(clean.toLowerCase())) return null;

  const r = await fetchDecoded('https://t.me/' + clean, 7000);
  if (r.error || r.status !== 200) return null;
  const title = (r.text.match(/<meta property="og:title" content="([^"]+)"/) || [])[1] || '';
  const desc = (r.text.match(/<meta property="og:description" content="([^"]+)"/) || [])[1] || '';
  const extra = (r.text.match(/<div class="tgme_page_extra">([^<]+)<\/div>/) || [])[1]?.trim() || '';
  const exists = Boolean(
    title &&
    !title.startsWith('Telegram: Contact @') &&
    !title.startsWith('Telegram –') &&
    !title.startsWith('Telegram:')
  );
  if (!exists) return null;

  const isChannel = /subscriber|member/i.test(extra);
  const directLink = (desc.match(/https?:\/\/t\.me\/[a-zA-Z0-9_]+\?direct/i) || [])[0] || '';
  const mentions = [...new Set(desc.match(/@[a-zA-Z0-9_]{4,32}/g) || [])]
    .filter(m => m.toLowerCase() !== '@' + clean.toLowerCase() && m.toLowerCase() !== '@telegram');

  return {
    handle: '@' + clean,
    url: 'https://t.me/' + clean,
    title: decodeHtmlEntities(title),
    extra,
    is_channel: isChannel,
    desc: decodeHtmlEntities(desc).replace(/\s+/g, ' ').trim(),
    direct_link: directLink,
    mentions
  };
}

function decodeHtmlEntities(s) {
  return String(s || '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#33;/g, '!')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

async function inspectTaplinkOrBio(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  if (!/(taplink|mssg\.me|hipolink|linktr\.ee|beacons|t\.me|meconnect)/i.test(url)) return null;
  const r = await fetchDecoded(url, 7000);
  if (r.error || r.status !== 200) return null;
  const tgs = [...new Set(r.text.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/[a-zA-Z0-9_@+]+/gi) || [])];
  const was = [...new Set(r.text.match(/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?(\+?7\d{10})/gi) || [])];
  const waPhones = [...new Set(was.map(w => normalizePhoneDigits(w)).filter(isMobilePhone))];
  const extraHandles = [...new Set([...r.text.matchAll(/(?:tiktok\.com\/@|instagram\.com\/)([a-zA-Z0-9_.]{4,30})/gi)].map(m => m[1]))];
  return { url, tgs, waPhones, extraHandles };
}

async function inspectVKUser(userId) {
  const pathStr = /^\d+$/.test(String(userId)) ? 'id' + userId : String(userId);
  const r = await fetchDecoded('https://vk.com/' + pathStr, 8000);
  if (r.error || r.status !== 200) return null;
  const fn = (r.text.match(/"first_name":"([^"]+)"/) || [])[1] || '';
  const ln = (r.text.match(/"last_name":"([^"]+)"/) || [])[1] || '';
  const sn = (r.text.match(/"screen_name":"([^"]+)"/) || [])[1] || '';
  const city = (r.text.match(/"city":\{"id":\d+,"title":"([^"]+)"\}/) || [])[1] || '';
  const status = (r.text.match(/"status":"([^"]{1,180})"/) || [])[1] || '';
  const about = (r.text.match(/"about":"([^"]{1,250})"/) || [])[1] || '';
  const site = ((r.text.match(/"site":"([^"]{1,200})"/) || [])[1] || '').replace(/\\\//g, '/');
  const mobile = normalizePhoneDigits((r.text.match(/"mobile_phone":"([^"]{1,50})"/) || [])[1] || '');
  // Извлекаем t.me ТОЛЬКО из полей профиля (status/about/site), а не со стены/репостов!
  const profileFieldsBlob = `${status} ${about} ${site}`;
  const tgLinks = [...new Set(profileFieldsBlob.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/[a-zA-Z0-9_@+]+/gi) || [])];

  const bioSiteData = site ? await inspectTaplinkOrBio(site) : null;

  return {
    url: 'https://vk.com/' + (sn || pathStr),
    first_name: fn,
    last_name: ln,
    full_name: (fn + ' ' + ln).trim(),
    screen_name: sn,
    city,
    status: decodeHtmlEntities(status),
    site,
    mobile: isMobilePhone(mobile) ? mobile : '',
    tgLinks,
    bioSiteData
  };
}

async function inspectVKGroup(slug, verifyContext = null) {
  const cleanSlug = String(slug || '').replace(/^https?:\/\/(?:m\.)?vk\.com\//i, '').replace(/[/?#].*$/, '').trim();
  if (!cleanSlug || cleanSlug.length < 3) return null;
  if (['share.php', 'js', 'images', 'doc', 'video', 'wall', 'im', 'login', 'feed', 'away.php'].includes(cleanSlug.toLowerCase())) return null;

  const r = await fetchDecoded('https://vk.com/' + cleanSlug, 8000);
  if (r.error || r.status !== 200) return null;
  // Проверка, что это реально группа/сообщество (есть groups.getById или description)
  if (!r.text.includes('groups.getById') && !r.text.includes('"contacts":[')) return null;

  const desc = ((r.text.match(/"description":"([^"]{0,800})"/) || [])[1] || '').replace(/\\n/g, ' ');
  const site = ((r.text.match(/"site":"([^"]{0,200})"/) || [])[1] || '').replace(/\\\//g, '/');
  const phone = (r.text.match(/"phone":"([^"]{0,50})"/) || [])[1] || '';
  const titleMatch = r.text.match(/"groups\.getById"[\s\S]{0,4000}?"name":"([^"]+)"/);
  const groupName = titleMatch ? titleMatch[1] : '';

  // Если группа угадана эвристикой (не взята с сайта), требуем строгое подтверждение по телефону или городу+мото!
  if (verifyContext) {
    const fullBlob = (groupName + ' ' + desc + ' ' + phone + ' ' + r.text.slice(0, 60000)).toLowerCase();
    const last7 = verifyContext.phoneLast7;
    const phoneMatch = last7 && fullBlob.replace(/\D/g, '').includes(last7);
    const cityMatch = verifyContext.cityLower && fullBlob.includes(verifyContext.cityLower);
    const motoMatch = /(мото|эндуро|питбайк|квадро|экипиров|moto|enduro|pitbike)/i.test(groupName + ' ' + desc);
    if (!phoneMatch && !(cityMatch && motoMatch)) {
      return null;
    }
  }

  const contactsRaw = (r.text.match(/"contacts":\[([^\]]{0,4000})\]/) || [])[1] || '';
  const contacts = [];
  const rx = /"user_id":(\d+)(?:[^}]*"desc":"([^"]*)")?(?:[^}]*"phone":"([^"]*)")?(?:[^}]*"email":"([^"]*)")?/g;
  let m;
  let cnt = 0;
  while ((m = rx.exec(contactsRaw)) !== null && cnt < 3) {
    cnt++;
    const user = await inspectVKUser(m[1]);
    contacts.push({
      user_id: m[1],
      role: decodeHtmlEntities(m[2] || ''),
      phone: normalizePhoneDigits(m[3] || ''),
      email: m[4] || '',
      user
    });
  }

  const linksBlock = (r.text.match(/"links":\[[\s\S]{0,4000}?\]/) || [])[0] || '';
  const groupHeaderBlob = `${desc} ${site} ${linksBlock}`.replace(/\\\//g, '/');
  const tgLinks = [...new Set(groupHeaderBlob.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/[a-zA-Z0-9_@+]+/gi) || [])];
  const groupInns = [...new Set([...desc.matchAll(/ИНН[^\d]{0,12}(\d{10,12})/gi)].map(x => x[1]).filter(isValidInn))];

  return {
    url: 'https://vk.com/' + cleanSlug,
    slug: cleanSlug,
    group_name: decodeHtmlEntities(groupName),
    site,
    phone,
    tgLinks,
    groupInns,
    contacts
  };
}

async function deepScanWebsite(rawSite) {
  if (!rawSite) return null;
  let baseUrl = rawSite.trim();
  if (!/^https?:\/\//i.test(baseUrl)) baseUrl = 'https://' + baseUrl;
  let r = await fetchDecoded(baseUrl, 8000);
  if (r.error && baseUrl.startsWith('https://')) {
    baseUrl = 'http://' + rawSite.trim().replace(/^https?:\/\//i, '');
    r = await fetchDecoded(baseUrl, 8000);
  }
  if (r.error || !r.text) return { baseUrl, error: r.error || 'empty' };

  const texts = [r.text];
  const scanned = [r.url];
  const origin = (() => { try { return new URL(r.url).origin; } catch { return ''; } })();

  const linkRx = /href=["']([^"'#]+)["']/gi;
  const subpages = new Set();
  let m;
  while ((m = linkRx.exec(r.text)) !== null) {
    const h = m[1];
    if (/(contact|kontak|about|o-nas|o-komp|policy|politic|privacy|konfid|ofert|rekvizit|oplat|dostav|legal|soglash)/i.test(h)) {
      try {
        const full = new URL(h, r.url).href;
        if (origin && full.startsWith(origin) && !/\.(jpg|png|pdf|css|js|svg|webp)$/i.test(full)) {
          subpages.add(full);
        }
      } catch {}
    }
  }

  for (const sp of [...subpages].slice(0, 6)) {
    if (sp === r.url) continue;
    const sr = await fetchDecoded(sp, 6000);
    if (!sr.error && sr.status === 200 && sr.text) {
      texts.push(sr.text);
      scanned.push(sp);
    }
  }

  const joined = texts.join('\n');
  const clean = joined
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

  const inns = [...new Set([...clean.matchAll(/ИНН[^\d]{0,18}(\d{10,12})/gi)].map(x => x[1]).filter(isValidInn))];
  const ips = [...new Set(clean.match(/ИП\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?/g) || [])].slice(0, 3);
  const vks = [...new Set(joined.match(/(?:https?:\/\/)?(?:m\.)?vk\.com\/[a-zA-Z0-9_.]+/gi) || [])]
    .map(v => v.replace(/^https?:\/\/(?:m\.)?vk\.com\//i, ''))
    .filter(v => !['share.php', 'js', 'images', 'doc', 'video', 'wall', 'im', 'login', 'feed', 'away.php'].some(bad => v.toLowerCase().startsWith(bad)));
  const tgs = [...new Set(joined.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/[a-zA-Z0-9_@+?=-]+/gi) || [])]
    .filter(t => !/t\.me\/share/i.test(t));
  const emails = [...new Set(clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])]
    .filter(e => !/\.(png|jpg|svg|webp|css|js)$/i.test(e))
    .slice(0, 4);
  const mobiles = [...new Set([...clean.matchAll(/(?:\+7|8)[\s\-(]*9\d{2}[\s\-)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/g)]
    .map(x => normalizePhoneDigits(x[0]))
    .filter(isMobilePhone))];

  return { scanned, inns, ips, vks: [...new Set(vks)].slice(0, 3), tgs: tgs.slice(0, 5), emails, mobiles };
}

function extractSurname(fullName) {
  if (!fullName) return '';
  // Для "ГЕНЕРАЛЬНЫЙ ДИРЕКТОР: Хрюкин Александр Александрович" -> "хрюкин"
  const cleaned = fullName
    .replace(/^(?:ГЕНЕРАЛЬНЫЙ\s+)?ДИРЕКТОР[:\s]+/i, '')
    .replace(/^ИНДИВИДУАЛЬНЫЙ\s+ПРЕДПРИНИМАТЕЛЬ\s+/i, '')
    .replace(/^ИП\s+/i, '')
    .trim();
  const firstWord = cleaned.split(/\s+/)[0] || '';
  return firstWord.toLowerCase().replace(/ё/g, 'е');
}

function surnamesMatch(s1, s2) {
  if (!s1 || !s2 || s1.length < 3 || s2.length < 3) return false;
  const a = s1.toLowerCase().replace(/ё/g, 'е');
  const b = s2.toLowerCase().replace(/ё/g, 'е');
  if (a === b) return true;
  // Учитываем женскую/мужскую форму фамилии (Иванов / Иванова, Новокшонов / Новокшонова, Понарьин / Понарьина)
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b.slice(0, -1)) || b.startsWith(a.slice(0, -1)))) return true;
  return false;
}

async function processLead(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const f = raw.facts || {};
  const slug = raw.slug || path.basename(filePath, '.json');
  const name = f.name || slug;
  const city = f.city || '';
  const publicPhoneDigits = normalizePhoneDigits(f.phone_raw || f.phone || f.whatsapp || '');
  const whatsappDigits = normalizePhoneDigits(f.whatsapp || '');
  const primaryMobile = isMobilePhone(publicPhoneDigits) ? publicPhoneDigits : (isMobilePhone(whatsappDigits) ? whatsappDigits : '');
  const phoneLast7 = (primaryMobile || publicPhoneDigits).slice(-7);

  // Также проверим URL в sources (иногда там есть clients.site или домен)
  let siteCandidate = (f.existing_website || '').trim();
  if (!siteCandidate && Array.isArray(raw.sources)) {
    const nonMapSource = raw.sources.find(s => s.url && !/(2gis\.ru|yandex\.ru|google\.|flamp\.ru)/i.test(s.url));
    if (nonMapSource) siteCandidate = nonMapSource.url;
  }

  const evidence = [];
  let siteScan = null;
  if (siteCandidate) {
    siteScan = await deepScanWebsite(siteCandidate);
    if (siteScan && siteScan.scanned) evidence.push(...siteScan.scanned.slice(0, 3));
  }

  // Шаг 1: Проверка ИНН -> ФНС
  const allInns = new Set(siteScan?.inns || []);
  let fnsInfo = null;
  for (const inn of allInns) {
    fnsInfo = await lookupNalogByINN(inn);
    if (fnsInfo) {
      evidence.push(`FNS:${inn}`);
      break;
    }
  }

  const fnsOwnerFull = fnsInfo
    ? (fnsInfo.kind === 'ИП' ? fnsInfo.legal_name : fnsInfo.director || fnsInfo.legal_name)
    : (siteScan?.ips?.[0] || '');
  const fnsSurname = extractSurname(fnsOwnerFull);

  // Шаг 2: Поиск и разбор группы ВК
  const vkGroups = [];
  const checkedVkSlugs = new Set();
  if (siteScan && siteScan.vks) {
    for (const v of siteScan.vks.slice(0, 2)) {
      if (checkedVkSlugs.has(v.toLowerCase())) continue;
      checkedVkSlugs.add(v.toLowerCase());
      const g = await inspectVKGroup(v, null);
      if (g) {
        vkGroups.push(g);
        evidence.push(g.url);
      }
    }
  }

  // Если на сайте не было ВК (или сайта нет), проверяем эвристические slug'и ВК со строгой верификацией по городу/телефону
  if (vkGroups.length === 0) {
    const brandLatin = translitRu(name);
    const cityLatin = translitRu(city);
    const candidates = [...new Set([
      slug.replace(/-/g, '_'),
      slug.replace(/-/g, ''),
      brandLatin,
      brandLatin && cityLatin ? `${brandLatin}_${cityLatin}` : ''
    ].filter(s => s && s.length >= 4 && s.length <= 32))];

    for (const cand of candidates.slice(0, 3)) {
      if (checkedVkSlugs.has(cand.toLowerCase())) continue;
      checkedVkSlugs.add(cand.toLowerCase());
      const g = await inspectVKGroup(cand, { phoneLast7, cityLower: city.toLowerCase() });
      if (g) {
        vkGroups.push(g);
        evidence.push(g.url);
        // Если нашли ИНН в описании ВК и ещё нет ФНС — пробьём!
        if (!fnsInfo && g.groupInns.length > 0) {
          fnsInfo = await lookupNalogByINN(g.groupInns[0]);
          if (fnsInfo) evidence.push(`FNS:${g.groupInns[0]}`);
        }
        break;
      }
    }
  }

  // Шаг 3: Разбор контактов владельца из ВК и поиск личного Telegram
  let ownerVk = '';
  let ownerVkName = '';
  let ownerVkMatchStatus = 'none';
  let hiddenPersonalPhone = '';
  const personalTgCandidates = new Set();
  const salonTgHandles = new Set();
  const salonTgLinks = new Set();

  for (const tgRaw of (siteScan?.tgs || [])) {
    salonTgLinks.add(tgRaw);
    const clean = tgRaw.replace(/^https?:\/\/(?:t\.me|telegram\.me)\//i, '').replace(/^@/, '').split('?')[0].split('/')[0];
    if (clean && !clean.startsWith('+')) salonTgHandles.add(clean);
  }

  for (const g of vkGroups) {
    for (const tgRaw of g.tgLinks) {
      salonTgLinks.add(tgRaw);
      const clean = tgRaw.replace(/^https?:\/\/(?:t\.me|telegram\.me)\//i, '').replace(/^@/, '').split('?')[0].split('/')[0];
      if (clean && !clean.startsWith('+')) salonTgHandles.add(clean);
    }

    for (const c of g.contacts) {
      if (!c.user) continue;
      const u = c.user;
      const isFnsMatch = surnamesMatch(u.last_name, fnsSurname) || surnamesMatch(u.first_name, fnsSurname);
      const isNotFake = u.full_name && !/(менеджер|админ|салон|мото|moto|enduro|эндуро|admin)/i.test(u.full_name);

      if (isFnsMatch || (!ownerVk && isNotFake)) {
        ownerVk = u.url;
        ownerVkName = u.full_name;
        ownerVkMatchStatus = isFnsMatch ? 'FNS_CONFIRMED' : 'VK_CONTACT_UNVERIFIED';

        if (u.mobile && u.mobile !== primaryMobile) hiddenPersonalPhone = u.mobile;
        if (c.phone && isMobilePhone(c.phone) && c.phone !== primaryMobile) hiddenPersonalPhone = c.phone;

        if (u.screen_name && !/^id\d+$/.test(u.screen_name) && u.screen_name.length >= 5) {
          personalTgCandidates.add(u.screen_name);
        }
        for (const t of u.tgLinks) {
          const clean = t.replace(/^https?:\/\/(?:t\.me|telegram\.me)\//i, '').replace(/^@/, '').split('?')[0].split('/')[0];
          if (clean && !clean.startsWith('+')) personalTgCandidates.add(clean);
        }
        if (u.bioSiteData) {
          if (u.bioSiteData.waPhones.length > 0) {
            const p = u.bioSiteData.waPhones.find(x => x !== primaryMobile) || u.bioSiteData.waPhones[0];
            if (p) hiddenPersonalPhone = p;
          }
          for (const h of u.bioSiteData.extraHandles) personalTgCandidates.add(h);
          for (const t of u.bioSiteData.tgs) {
            const clean = t.replace(/^https?:\/\/(?:t\.me|telegram\.me)\//i, '').replace(/^@/, '').split('?')[0].split('/')[0];
            if (clean && !clean.startsWith('+')) personalTgCandidates.add(clean);
          }
        }
        if (isFnsMatch) break;
      }
    }
  }

  // Шаг 4: Верификация найденных Telegram-кандидатов
  let personalTg = '';
  let personalTgNote = '';
  for (const cand of personalTgCandidates) {
    const info = await inspectTGHandle(cand);
    if (!info) continue;
    if (info.is_channel) {
      // Если это канал (например, личный блог), отметим но продолжим искать личку
      if (!personalTg) {
        personalTg = info.handle;
        personalTgNote = `Канал владельца (${info.title})`;
      }
      continue;
    }
    // Проверяем совпадение имени или упоминание салона/мото в био
    const bioAndTitle = (info.title + ' ' + info.desc).toLowerCase();
    const ownerFirst = (ownerVkName.split(' ')[0] || '').toLowerCase();
    const nameHit = ownerFirst.length >= 3 && bioAndTitle.includes(ownerFirst.slice(0, 4));
    const motoHit = /(мото|эндуро|питбайк|квадро|moto|enduro)/i.test(bioAndTitle) || bioAndTitle.includes(name.toLowerCase().slice(0, 5));
    if (nameHit || motoHit || ownerVkMatchStatus === 'FNS_CONFIRMED') {
      personalTg = info.handle;
      personalTgNote = `${info.title}${info.desc && !info.desc.startsWith('You can contact') ? ' | ' + info.desc.slice(0, 80) : ''}`;
      evidence.push(info.url);
      break;
    }
  }

  // Проверяем Telegram-каналы/аккаунты самого салона
  let salonTg = '';
  let salonTgDirect = '';
  for (const h of salonTgHandles) {
    const info = await inspectTGHandle(h);
    if (!info) continue;
    evidence.push(info.url);
    if (!info.is_channel && !salonTgDirect) {
      salonTgDirect = info.handle;
    } else if (info.is_channel) {
      salonTg = info.handle + (info.extra ? ` (${info.extra})` : '');
      if (info.direct_link) salonTgDirect = info.direct_link;
      if (info.mentions.length > 0 && !salonTgDirect) salonTgDirect = info.mentions[0];
    }
  }

  // Если канал салона ещё не найден, пробуем эвристику транслитом СТРОГО с проверкой по телефону или городу!
  if (!salonTg && !salonTgDirect) {
    const brandLat = translitRu(name);
    if (brandLat.length >= 5) {
      const info = await inspectTGHandle(brandLat);
      if (info) {
        const blob = (info.title + ' ' + info.desc).toLowerCase();
        const phoneHit = Boolean(phoneLast7 && blob.replace(/\D/g, '').includes(phoneLast7));
        const cityStem = city ? city.toLowerCase().slice(0, Math.min(5, city.length)) : '';
        const cityHit = Boolean(cityStem && cityStem.length >= 4 && blob.includes(cityStem));
        const motoHit = /(мото|эндуро|питбайк|квадро|moto|enduro)/i.test(blob);
        if (phoneHit || (cityHit && motoHit)) {
          evidence.push(info.url);
          if (info.is_channel) {
            salonTg = info.handle + (info.extra ? ` (${info.extra})` : '');
            if (info.direct_link) salonTgDirect = info.direct_link;
            if (info.mentions.length > 0 && !salonTgDirect) salonTgDirect = info.mentions[0];
          } else {
            salonTgDirect = info.handle;
          }
        }
      }
    }
  }

  // Итоговый статус и лучший контакт для первого касания в Telegram
  let contactTier = 'PHONE_IMPORT_ONLY';
  let bestTgEntry = primaryMobile ? `https://t.me/+${primaryMobile}` : '';
  if (personalTg) {
    contactTier = ownerVkMatchStatus === 'FNS_CONFIRMED' ? '1_PERSONAL_TG_VERIFIED' : '2_PERSONAL_TG_VK_ADMIN';
    bestTgEntry = `https://t.me/${personalTg.replace(/^@/, '')}`;
  } else if (hiddenPersonalPhone) {
    contactTier = '2_HIDDEN_PERSONAL_PHONE';
    bestTgEntry = `https://t.me/+${hiddenPersonalPhone}`;
  } else if (salonTgDirect) {
    contactTier = '3_SALON_TG_DIRECT';
    bestTgEntry = salonTgDirect.startsWith('http') ? salonTgDirect : `https://t.me/${salonTgDirect.replace(/^@/, '')}`;
  } else if (primaryMobile) {
    contactTier = fnsOwnerFull ? '4_MOBILE_IMPORT_WITH_OWNER_NAME' : '5_MOBILE_IMPORT_ONLY';
    bestTgEntry = `https://t.me/+${primaryMobile}`;
  } else {
    contactTier = '6_LANDLINE_ONLY';
  }

  return {
    slug,
    name,
    city,
    has_website_flag: Boolean(f.has_website),
    website: siteCandidate,
    contact_tier: contactTier,
    best_tg_entry: bestTgEntry,
    fns_owner: fnsOwnerFull,
    fns_kind: fnsInfo?.kind || '',
    inn: fnsInfo?.inn || [...allInns][0] || '',
    personal_tg: personalTg,
    personal_tg_note: personalTgNote,
    hidden_personal_phone: hiddenPersonalPhone ? '+' + hiddenPersonalPhone : '',
    public_mobile: primaryMobile ? '+' + primaryMobile : '',
    public_phone: f.phone || '',
    owner_vk: ownerVk,
    owner_vk_name: ownerVkName,
    owner_vk_match: ownerVkMatchStatus,
    salon_vk: vkGroups[0]?.url || '',
    salon_tg: salonTg,
    salon_tg_direct: salonTgDirect,
    email: siteScan?.emails?.[0] || '',
    checked_at: new Date().toISOString(),
    evidence: [...new Set(evidence)].slice(0, 6)
  };
}

function csvEscape(val) {
  const s = String(val ?? '');
  if (/[;"\n\r,]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function buildVCard(results) {
  const cards = [];
  for (const r of results) {
    const phone = r.hidden_personal_phone || r.public_mobile;
    if (!phone) continue;
    const ownerLabel = r.fns_owner
      ? r.fns_owner.replace(/^ГЕНЕРАЛЬНЫЙ ДИРЕКТОР:\s*/i, '').split(' ').slice(0, 2).join(' ')
      : (r.owner_vk_name || '');
    const fn = `${r.name} (${r.city})${ownerLabel ? ' - ' + ownerLabel : ''}`.replace(/[;\r\n]/g, ' ');
    const note = [
      `Tier: ${r.contact_tier}`,
      r.fns_owner ? `Owner: ${r.fns_owner}` : '',
      r.personal_tg ? `PersonalTG: ${r.personal_tg}` : '',
      r.owner_vk ? `VK: ${r.owner_vk}` : '',
      r.website ? `Site: ${r.website}` : 'No site'
    ].filter(Boolean).join(' | ');

    cards.push([
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${fn}`,
      `TEL;TYPE=CELL:${phone}`,
      `NOTE:${note}`,
      'END:VCARD'
    ].join('\r\n'));
  }
  return cards.join('\r\n');
}

function main() {
  if (!Number.isFinite(LIMIT) && LIMIT !== Infinity || LIMIT <= 0 || LIMIT !== Infinity && !Number.isInteger(LIMIT)) {
    throw new Error('--limit должен быть положительным целым числом');
  }
  if (ONLY_NO_SITE && ONLY_WITH_SITE) throw new Error('Выбери только один фильтр сайта');
  const allFiles = fs.readdirSync(FACTS_DIR).filter(f => f.endsWith('.json')).sort();
  const ready = [];
  const deferred = [];
  let filtered = 0;
  for (const file of allFiles) {
    const slug = path.basename(file, '.json');
    if (SLUGS_FILTER && !SLUGS_FILTER.includes(slug)) continue;
    let raw;
    try { raw = JSON.parse(fs.readFileSync(path.join(FACTS_DIR, file), 'utf8')); }
    catch (error) { deferred.push({ slug, reasons: [`JSON не читается: ${error.message}`] }); continue; }
    const assessment = assessLead(raw);
    if (!assessment.eligible) { deferred.push({ slug, reasons: assessment.reasons }); continue; }
    if (ONLY_NO_SITE && assessment.website_status !== 'not_found_in_checked_sources'
      || ONLY_WITH_SITE && assessment.website_status !== 'found') { filtered++; continue; }
    const tgHandle = '@' + assessment.telegram_url.split('/').pop();
    const field = value => value && typeof value === 'object' ? value.value : value;
    ready.push({
      slug,
      name: field(raw.facts.name),
      city: field(raw.facts.city),
      has_website_flag: assessment.website_status === 'found' ? true : null,
      website_status: assessment.website_status,
      website: assessment.website || '',
      website_candidates: assessment.website_candidates,
      contact_tier: assessment.telegram_role === 'owner' ? '1_PERSONAL_TG_VERIFIED' : '3_SALON_TG_DIRECT',
      best_tg_entry: assessment.telegram_url,
      personal_tg: assessment.telegram_role === 'owner' ? tgHandle : '',
      salon_tg_direct: assessment.telegram_role === 'administrator' ? tgHandle : '',
      telegram_role: assessment.telegram_role,
      telegram_map_url: assessment.telegram_map_url,
      telegram_checked_at: raw.lead_search_checks.telegram.checked_at,
      search_policy_version: settings.version,
      checked_at: new Date().toISOString(),
      evidence: settings.required_map_platforms.map(platform => raw.lead_search_checks.maps[platform].url),
      qualification_record: {
        identity_status: raw.identity_status,
        facts: { name: raw.facts.name, city: raw.facts.city, address: raw.facts.address },
        sources: raw.sources,
        lead_search_checks: raw.lead_search_checks
      }
    });
  }
  const selected = ready.slice(0, LIMIT);
  console.log(`Строгий отбор по правилам ${settings.version}; проверка карт выполняется исследователем, сетевых запросов нет.`);
  console.log(`Готовы: ${ready.length}; выбраны с учётом лимита: ${selected.length}; отложены: ${deferred.length}; не подходят фильтру сайта: ${filtered}.`);
  for (const row of selected) console.log(`  ГОТОВ: ${row.slug} | ${row.website_status} | ${row.best_tg_entry}`);
  for (const row of deferred) console.log(`  ОТЛОЖЕН: ${row.slug} | ${row.reasons.join('; ')}`);
  if (DRY_RUN) {
    console.log('Dry-run: файлы не записывались, старые контакты и станция не изменены.');
    return { selected, deferred, filtered };
  }
  if (!selected.length) {
    console.log('Нет готовых записей: файлы результатов не создавались и не перезаписывались.');
    return { selected, deferred, filtered };
  }
  const jsonPath = path.join(SALES_DIR, 'qualified_owners_telegram.json');
  const csvPath = path.join(SALES_DIR, 'qualified_owners_telegram.csv');
  let existing = [];
  if (fs.existsSync(jsonPath)) {
    existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!Array.isArray(existing) || existing.some(row => !row || !row.slug
      || row.search_policy_version !== settings.version || !row.qualification_record
      || !assessLead(row.qualification_record).eligible)) {
      throw new Error('В qualified_owners_telegram.json есть записи без актуального комплекта доказательств; файл сохранён без изменений, требуется проверка.');
    }
  }
  const results = mergeResults(existing, selected)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const headers = ['slug', 'name', 'city', 'website_status', 'website', 'best_tg_entry', 'telegram_role', 'telegram_map_url', 'telegram_checked_at', 'search_policy_version', 'evidence'];
  const csvRows = [headers.join(';'), ...results.map(row => headers.map(key => csvEscape(
    key === 'evidence' ? (row.evidence || []).join(' | ') : row[key]
  )).join(';'))];
  if (!fs.existsSync(SALES_DIR)) fs.mkdirSync(SALES_DIR, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
  fs.writeFileSync(csvPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
  console.log(`Добавлены/обновлены ${selected.length} строгих записей; всего в отдельной выборке ${results.length}.`);
  console.log(`Результаты: ${jsonPath} и ${csvPath}. Исторические owners_telegram и станция не изменены.`);
  return { selected, deferred, filtered };
}

// Legacy network heuristics above are retained for reference only. main() does
// not call processLead(), inspectTGHandle(), phone import or guessed usernames.
if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { main };
