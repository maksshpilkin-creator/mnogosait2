'use strict';

// This validates recorded evidence, not the truth of a page. A researcher must
// first open the map cards and record the evidence described in LEAD_SEARCH_RULES.md.
const settings = require('../data/lead-search-settings.json');

const nonEmpty = value => typeof value === 'string' && value.trim().length > 0;
const fieldValue = value => value && typeof value === 'object' ? value.value : value;
function validDate(value) {
  if (!nonEmpty(value) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    || !Number.isFinite(Date.parse(value))) return false;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  return calendar.getUTCFullYear() === year && calendar.getUTCMonth() === month - 1 && calendar.getUTCDate() === day
    && Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60 && Number(value.slice(17, 19)) < 60;
}

function parseUrl(value) {
  if (!nonEmpty(value)) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url : null;
  } catch { return null; }
}

function normalizedUrl(value) {
  const url = parseUrl(value);
  if (!url) return '';
  url.hash = '';
  return url.href.replace(/\/$/, '');
}

function isMapUrl(value, platform, cardOnly = false) {
  const url = parseUrl(value);
  if (!url) return false;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (platform === 'yandex_maps') {
    if (!['yandex.ru', 'yandex.com', 'yandex.by', 'yandex.kz'].includes(host) || !/^\/maps(?:\/|$)/.test(url.pathname)) return false;
    return !cardOnly || /^\/maps\/org\/[^/]+\/\d+(?:\/|$)/.test(url.pathname);
  }
  if (platform === 'two_gis') {
    if (!['2gis.ru', '2gis.com', '2gis.kz', '2gis.kg', '2gis.uz', '2gis.by'].includes(host)) return false;
    return !cardOnly || /\/firm\/\d+(?:\/|$)/.test(url.pathname);
  }
  if (platform === 'google_maps') {
    if (!['google.com', 'google.ru', 'maps.google.com', 'maps.google.ru'].includes(host)) return false;
    if (!/^\/maps(?:\/|$)/.test(url.pathname) && !host.startsWith('maps.google.')) return false;
    return !cardOnly || /^\/maps\/place\/[^/]+/.test(url.pathname)
      || /^\d+$/.test(url.searchParams.get('cid') || '')
      || /^(?:place_id:|ChIJ)/.test(url.searchParams.get('q') || '');
  }
  return false;
}

function isMapSearchUrl(value, platform) {
  if (!isMapUrl(value, platform) || isMapUrl(value, platform, true)) return false;
  const url = parseUrl(value);
  if (platform === 'yandex_maps') return /\/search(?:\/|$)/.test(url.pathname) || nonEmpty(url.searchParams.get('text'));
  if (platform === 'two_gis') return /\/search\/.+/.test(url.pathname) || nonEmpty(url.searchParams.get('q'));
  return /\/maps\/search(?:\/|$)/.test(url.pathname) || nonEmpty(url.searchParams.get('q')) || nonEmpty(url.searchParams.get('query'));
}

function directTelegramUrl(value) {
  const url = parseUrl(value);
  if (!url || url.protocol !== 'https:' || !['t.me', 'telegram.me'].includes(url.hostname.toLowerCase())) return '';
  if (url.search || url.hash) return '';
  const match = url.pathname.match(/^\/([A-Za-z][A-Za-z0-9_]{4,31})\/?$/);
  if (!match || /bot$/i.test(match[1])) return '';
  if (['share', 'joinchat', 'login', 'proxy', 'socks', 'addstickers', 'addemoji', 'setlanguage', 'confirmphone', 'iv', 'contact', 'addlist', 'boost', 'giftcode', 'invoice', 'resolve'].includes(match[1].toLowerCase())) return '';
  return `https://t.me/${match[1]}`;
}

function isWebsiteUrl(value) {
  const url = parseUrl(value);
  if (!url) return false;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (['t.me', 'telegram.me', 'vk.com', 'm.vk.com', 'wa.me', 'ok.ru', 'instagram.com', 'facebook.com'].includes(host)) return false;
  return !settings.required_map_platforms.some(platform => isMapUrl(value, platform));
}

function assessLead(raw, policy = settings) {
  const reasons = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { eligible: false, reasons: ['Карточка должна быть JSON-объектом'], website_status: 'unknown', website: null, telegram_url: null };
  }
  const checks = raw.lead_search_checks;
  if (!checks || typeof checks !== 'object') {
    return { eligible: false, reasons: ['Нет lead_search_checks: карты и Telegram ещё не проверены'], website_status: 'unknown', website: null, telegram_url: null };
  }
  if (raw.identity_status !== 'verified') reasons.push('Не подтверждена идентичность бизнеса');
  for (const key of ['name', 'city', 'address']) {
    if (!nonEmpty(fieldValue(raw.facts?.[key]))) reasons.push(`Нет идентифицирующего поля facts.${key}`);
  }
  const sourceList = Array.isArray(raw.sources) ? raw.sources : [];
  const sources = new Map(sourceList.filter(source => source && nonEmpty(source.id)).map(source => [source.id, source]));
  const duplicateIds = new Set(sourceList.filter(source => source && nonEmpty(source.id)).map(source => source.id)).size !== sourceList.filter(source => source && nonEmpty(source.id)).length;
  if (duplicateIds) reasons.push('В sources повторяются id источников');
  const websites = [];
  let completeWebsiteCheck = true;
  const checkSource = (sourceId, expectedUrl, label) => {
    const source = sources.get(sourceId);
    if (!source || !normalizedUrl(source.url) || normalizedUrl(source.url) !== normalizedUrl(expectedUrl)
      || !validDate(source.checked_at) || (!nonEmpty(source.excerpt) && !nonEmpty(source.evidence_path))) {
      reasons.push(`${label}: нет подходящего sources с URL, датой и свидетельством`);
      return false;
    }
    return true;
  };
  for (const platform of policy.required_map_platforms) {
    const map = checks.maps?.[platform];
    const label = `Карта ${platform}`;
    if (!map || !['verified', 'missing'].includes(map.status)) {
      reasons.push(`${label}: проверка не завершена (${map?.status || 'нет данных'})`);
      completeWebsiteCheck = false;
      continue;
    }
    if (!validDate(map.checked_at) || !nonEmpty(map.identity_evidence)) {
      reasons.push(`${label}: нет даты или свидетельства идентификации/поиска`);
      completeWebsiteCheck = false;
    }
    if (!(map.status === 'verified' ? isMapUrl(map.url, platform, true) : isMapSearchUrl(map.url, platform))) {
      reasons.push(`${label}: требуется URL ${map.status === 'verified' ? 'конкретной карточки' : 'поиска'} нужной платформы`);
      completeWebsiteCheck = false;
    }
    if (!checkSource(map.source_id, map.url, label)) completeWebsiteCheck = false;
    if (map.identity_status !== (map.status === 'verified' ? 'verified' : 'not_found')) {
      reasons.push(`${label}: идентичность не подтверждена или отсутствие карточки не задокументировано`);
      completeWebsiteCheck = false;
    }
    const website = map.website;
    if (!website || !['found', 'not_found_in_checked_sources'].includes(website.status) || !nonEmpty(website.note)) {
      reasons.push(`${label}: результат проверки сайта неизвестен или не подтверждён`);
      completeWebsiteCheck = false;
    } else if (website.status === 'found') {
      if (map.status !== 'verified' || !isWebsiteUrl(website.value)) {
        reasons.push(`${label}: сайт должен быть URL из подтверждённой карточки`);
        completeWebsiteCheck = false;
      } else websites.push(website.value);
    } else if (website.value !== null) {
      reasons.push(`${label}: при ненайденном сайте website.value должен быть null`);
      completeWebsiteCheck = false;
    }
  }
  const websiteStatus = completeWebsiteCheck
    ? (websites.length ? 'found' : 'not_found_in_checked_sources') : 'unknown';
  const telegram = checks.telegram;
  let telegramUrl = '';
  if (!telegram || telegram.status !== 'verified') reasons.push('Нет подтверждённого Telegram администратора или владельца');
  else {
    telegramUrl = directTelegramUrl(telegram.url);
    if (!telegramUrl || telegram.kind !== policy.telegram.allowed_kind) reasons.push('Telegram должен вести в прямой чат: канал, бот, приглашение или телефон не подходят');
    if (!policy.telegram.allowed_roles.includes(telegram.role) || !nonEmpty(telegram.role_evidence)) reasons.push('Не подтверждена роль администратора или владельца Telegram');
    if (!validDate(telegram.checked_at)) reasons.push('У Telegram нет корректной даты проверки');
    const map = checks.maps?.[telegram.platform];
    if (!policy.required_map_platforms.includes(telegram.platform) || !map || map.status !== 'verified'
      || map.identity_status !== 'verified' || !isMapUrl(map.url, telegram.platform, true)
      || map.source_id !== telegram.source_id) {
      reasons.push('Telegram должен быть опубликован в одной из подтверждённых карточек этого бизнеса на картах');
    } else checkSource(telegram.source_id, map.url, 'Telegram');
  }
  return {
    eligible: reasons.length === 0,
    reasons,
    website_status: websiteStatus,
    website: websiteStatus === 'found' ? websites[0] : null,
    website_candidates: [...new Set(websites)],
    telegram_url: telegramUrl || null,
    telegram_role: telegram?.role || null,
    telegram_map_url: checks.maps?.[telegram?.platform]?.url || null,
    policy_version: policy.version
  };
}

function mergeResults(existing, updates) {
  const merged = new Map(existing.map(row => [row.slug, row]));
  for (const row of updates) merged.set(row.slug, row);
  return [...merged.values()];
}

module.exports = { settings, assessLead, directTelegramUrl, isMapUrl, mergeResults };
