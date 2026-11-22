const fs = require('fs');
const path = require('path');
const { assessLead } = require('../scripts/lead-search-policy');

const FACTS_DIR = path.resolve(__dirname, '../data/facts');

function updateLead(slug, newSources, mapChecks, tgCheck) {
  const p = path.join(FACTS_DIR, `${slug}.json`);
  if (!fs.existsSync(p)) return;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));

  for (const s of newSources) {
    const idx = d.sources.findIndex(x => x.id === s.id);
    if (idx >= 0) d.sources[idx] = s;
    else d.sources.push(s);
  }

  d.lead_search_checks = {
    maps: mapChecks,
    telegram: tgCheck
  };

  const assessment = assessLead(d);
  console.log(`${slug} assessment:`, assessment.eligible, assessment.reasons.join('; '));
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n', 'utf8');
}

// rockot-armavir
updateLead('rockot-armavir', [
  { id: "two-gis-card", url: "https://2gis.ru/armavir/firm/70000001021481944", checked_at: "2026-11-21T19:50:00+03:00", excerpt: "Rockot Армавир, ул. Ефремова, 229А. В карточке Telegram отсутствует." },
  { id: "yandex-maps-card", url: "https://yandex.ru/maps/org/rockot/136570198361/", checked_at: "2026-11-21T19:50:00+03:00", excerpt: "Rockot Армавир, ул. Ефремова, 227. Опубликован телефонный Telegram t.me/+79385337373." },
  { id: "google-maps-search", url: "https://www.google.com/maps/search/Rockot+Armavir+Efremova/", checked_at: "2026-11-21T19:50:00+03:00", excerpt: "Rockot Армавир: карточка не найдена в Google Maps." }
], {
  yandex_maps: {
    status: "verified", url: "https://yandex.ru/maps/org/rockot/136570198361/", checked_at: "2026-11-21T19:50:00+03:00",
    identity_status: "verified", identity_evidence: "Rockot: совпали название, город Армавир и адрес ул. Ефремова, 227/229А.",
    source_id: "yandex-maps-card", website: { status: "not_found_in_checked_sources", value: null, note: "В карточке Яндекс Карт сайт не указан." }
  },
  two_gis: {
    status: "verified", url: "https://2gis.ru/armavir/firm/70000001021481944", checked_at: "2026-11-21T19:50:00+03:00",
    identity_status: "verified", identity_evidence: "Rockot: совпали название, город Армавир и адрес ул. Ефремова, 229А.",
    source_id: "two-gis-card", website: { status: "not_found_in_checked_sources", value: null, note: "В карточке 2ГИС сайт не указан." }
  },
  google_maps: {
    status: "missing", url: "https://www.google.com/maps/search/Rockot+Armavir+Efremova/", checked_at: "2026-11-21T19:50:00+03:00",
    identity_status: "not_found", identity_evidence: "Rockot Армавир: карточка не найдена в Google Maps.",
    source_id: "google-maps-search", website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в Google Maps." }
  }
}, {
  status: "missing", url: null, kind: null, role: null,
  role_evidence: "В карточке Яндекс Карт опубликован только телефонный номер t.me/+79385337373; прямой рабочий контакт владельца отсутствует.",
  platform: null, source_id: null, checked_at: "2026-11-21T19:50:00+03:00"
});

// lkmoto-mytishchi
updateLead('lkmoto-mytishchi', [
  { id: "two-gis-card", url: "https://2gis.ru/mytishchi/firm/70000001094681306", checked_at: "2026-11-21T19:51:00+03:00", excerpt: "ЛКМото Мытищи. Опубликован телефон t.me/+79299746929." },
  { id: "yandex-maps-card", url: "https://yandex.ru/maps/org/lkmoto/25608010041/", checked_at: "2026-11-21T19:51:00+03:00", excerpt: "ЛКМото, Мытищи, Ярмарочная ул., с4Б. Сайт: https://lkmoto.ru." },
  { id: "google-maps-search", url: "https://www.google.com/maps/search/LKMoto+Mytishchi+Yarmarochnaya/", checked_at: "2026-11-21T19:51:00+03:00", excerpt: "ЛКМото: карточка не найдена в Google Maps." }
], {
  yandex_maps: {
    status: "verified", url: "https://yandex.ru/maps/org/lkmoto/25608010041/", checked_at: "2026-11-21T19:51:00+03:00",
    identity_status: "verified", identity_evidence: "ЛКМото: совпали название, город Мытищи и адрес Ярмарочная ул., с4Б.",
    source_id: "yandex-maps-card", website: { status: "found", value: "https://lkmoto.ru", note: "Сайт открыт из карточки Яндекс Карт." }
  },
  two_gis: {
    status: "verified", url: "https://2gis.ru/mytishchi/firm/70000001094681306", checked_at: "2026-11-21T19:51:00+03:00",
    identity_status: "verified", identity_evidence: "ЛКМото: совпали название, город Мытищи и адрес Ярмарочная ул., с4Б.",
    source_id: "two-gis-card", website: { status: "found", value: "https://lkmoto.ru", note: "Сайт открыт из карточки 2ГИС." }
  },
  google_maps: {
    status: "missing", url: "https://www.google.com/maps/search/LKMoto+Mytishchi+Yarmarochnaya/", checked_at: "2026-11-21T19:51:00+03:00",
    identity_status: "not_found", identity_evidence: "ЛКМото: карточка не найдена в Google Maps.",
    source_id: "google-maps-search", website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в Google Maps." }
  }
}, {
  status: "missing", url: null, kind: null, role: null,
  role_evidence: "В карточке 2ГИС опубликован только телефон t.me/+79299746929; прямой рабочий контакт администратора отсутствует.",
  platform: null, source_id: null, checked_at: "2026-11-21T19:51:00+03:00"
});

// gsbmoto-rostov
updateLead('gsbmoto-rostov', [
  { id: "two-gis-card", url: "https://2gis.ru/rostov-on-don/firm/70000001109695563", checked_at: "2026-11-21T19:55:00+03:00", excerpt: "GSBMOTO Ростов-на-Дону, ул. Доватора, 140/151. В карточке Telegram отсутствует." },
  { id: "yandex-maps-card", url: "https://yandex.ru/maps/org/gsbmoto/175136469107/", checked_at: "2026-11-21T19:55:00+03:00", excerpt: "GSBMOTO Ростов-на-Дону, ул. Доватора, 140. В карточке Telegram отсутствует." },
  { id: "google-maps-search", url: "https://www.google.com/maps/search/GSBMOTO+Rostov+Dovatora/", checked_at: "2026-11-21T19:55:00+03:00", excerpt: "GSBMOTO: карточка не найдена в Google Maps." }
], {
  yandex_maps: {
    status: "verified", url: "https://yandex.ru/maps/org/gsbmoto/175136469107/", checked_at: "2026-11-21T19:55:00+03:00",
    identity_status: "verified", identity_evidence: "GSBMOTO: совпали название, город Ростов-на-Дону и адрес ул. Доватора, 140.",
    source_id: "yandex-maps-card", website: { status: "found", value: "https://gsbmoto.com", note: "Сайт открыт из карточки Яндекс Карт." }
  },
  two_gis: {
    status: "verified", url: "https://2gis.ru/rostov-on-don/firm/70000001109695563", checked_at: "2026-11-21T19:55:00+03:00",
    identity_status: "verified", identity_evidence: "GSBMOTO: совпали название, город Ростов-на-Дону и адрес ул. Доватора, 151/140.",
    source_id: "two-gis-card", website: { status: "found", value: "https://gsbmoto.com", note: "Сайт открыт из карточки 2ГИС." }
  },
  google_maps: {
    status: "missing", url: "https://www.google.com/maps/search/GSBMOTO+Rostov+Dovatora/", checked_at: "2026-11-21T19:55:00+03:00",
    identity_status: "not_found", identity_evidence: "GSBMOTO: карточка не найдена в Google Maps.",
    source_id: "google-maps-search", website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в Google Maps." }
  }
}, {
  status: "missing", url: null, kind: null, role: null,
  role_evidence: "В карточках на картах ссылка на Telegram отсутствует (встречалась только на сайте компании gsbmoto.com).",
  platform: null, source_id: null, checked_at: "2026-11-21T19:55:00+03:00"
});

// crazymoto-sochi
updateLead('crazymoto-sochi', [
  { id: "yandex-maps-card", url: "https://yandex.ru/maps/org/kreyzimoto/68642883298/", checked_at: "2026-11-21T19:54:00+03:00", excerpt: "CrazyMoto Сочи, ул. Авиационная, 19А. Канал t.me/crazymoto_pro (159 подписчиков)." },
  { id: "two-gis-search", url: "https://2gis.ru/sochi/search/CrazyMoto", checked_at: "2026-11-21T19:54:00+03:00", excerpt: "CrazyMoto Сочи: карточка филиала не найдена в 2ГИС." },
  { id: "google-maps-search", url: "https://www.google.com/maps/search/CrazyMoto+Sochi+Aviatsionnaya/", checked_at: "2026-11-21T19:54:00+03:00", excerpt: "CrazyMoto: карточка не найдена в Google Maps." }
], {
  yandex_maps: {
    status: "verified", url: "https://yandex.ru/maps/org/kreyzimoto/68642883298/", checked_at: "2026-11-21T19:54:00+03:00",
    identity_status: "verified", identity_evidence: "CrazyMoto: совпали название, город Сочи и адрес ул. Авиационная, 19А.",
    source_id: "yandex-maps-card", website: { status: "found", value: "https://crazymoto.pro", note: "Сайт открыт из карточки Яндекс Карт." }
  },
  two_gis: {
    status: "missing", url: "https://2gis.ru/sochi/search/CrazyMoto", checked_at: "2026-11-21T19:54:00+03:00",
    identity_status: "not_found", identity_evidence: "CrazyMoto: карточка филиала не найдена в 2ГИС.",
    source_id: "two-gis-search", website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в 2ГИС." }
  },
  google_maps: {
    status: "missing", url: "https://www.google.com/maps/search/CrazyMoto+Sochi+Aviatsionnaya/", checked_at: "2026-11-21T19:54:00+03:00",
    identity_status: "not_found", identity_evidence: "CrazyMoto: карточка не найдена в Google Maps.",
    source_id: "google-maps-search", website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в Google Maps." }
  }
}, {
  status: "missing", url: null, kind: null, role: null,
  role_evidence: "В карточке Яндекс Карт опубликован только Telegram-канал t.me/crazymoto_pro (159 подписчиков); прямой контакт отсутствует.",
  platform: null, source_id: null, checked_at: "2026-11-21T19:54:00+03:00"
});

// pro100moto-tmn
updateLead('pro100moto-tmn', [
  { id: "yandex-maps-card", url: "https://yandex.ru/maps/org/pro_100moto/64157936924/", checked_at: "2026-11-21T19:58:00+03:00", excerpt: "Pro-100moto Тюмень, Березняковская ул., 4, стр. 2. Опубликован Telegram-канал t.me/promoto100 (236 подписчиков)." },
  { id: "two-gis-card", url: "https://2gis.ru/tyumen/firm/70000001084102839", checked_at: "2026-11-21T19:58:00+03:00", excerpt: "Pro-100moto Тюмень. Опубликован канал t.me/promoto100 и телефон t.me/+79088773838." },
  { id: "google-maps-search", url: "https://www.google.com/maps/search/Pro-100moto+Tyumen+Bereznyakovskaya/", checked_at: "2026-11-21T19:58:00+03:00", excerpt: "Pro-100moto: карточка не найдена в Google Maps." }
], {
  yandex_maps: {
    status: "verified", url: "https://yandex.ru/maps/org/pro_100moto/64157936924/", checked_at: "2026-11-21T19:58:00+03:00",
    identity_status: "verified", identity_evidence: "Pro-100moto: совпали название, город Тюмень и адрес ул. Березняковская, 4, стр. 2.",
    source_id: "yandex-maps-card", website: { status: "found", value: "https://pro-100moto.ru", note: "Сайт открыт из карточки Яндекс Карт." }
  },
  two_gis: {
    status: "verified", url: "https://2gis.ru/tyumen/firm/70000001084102839", checked_at: "2026-11-21T19:58:00+03:00",
    identity_status: "verified", identity_evidence: "Pro-100moto: совпали название, город Тюмень и адрес ул. Березняковская, 4, стр. 2.",
    source_id: "two-gis-card", website: { status: "found", value: "https://pro-100moto.ru", note: "Сайт открыт из карточки 2ГИС." }
  },
  google_maps: {
    status: "missing", url: "https://www.google.com/maps/search/Pro-100moto+Tyumen+Bereznyakovskaya/", checked_at: "2026-11-21T19:58:00+03:00",
    identity_status: "not_found", identity_evidence: "Pro-100moto: карточка не найдена в Google Maps.",
    source_id: "google-maps-search", website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в Google Maps." }
  }
}, {
  status: "missing", url: null, kind: null, role: null,
  role_evidence: "В карточках на картах опубликован только Telegram-канал t.me/promoto100 (236 подписчиков) и телефон t.me/+79088773838; прямой контакт администратора на картах отсутствует.",
  platform: null, source_id: null, checked_at: "2026-11-21T19:58:00+03:00"
});

console.log('Additional deferred leads updated.');
