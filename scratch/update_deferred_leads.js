const fs = require('fs');
const path = require('path');
const { assessLead } = require('../scripts/lead-search-policy');

const FACTS_DIR = path.resolve(__dirname, '../data/facts');

function updateDeferredLead(slug, data) {
  const p = path.join(FACTS_DIR, `${slug}.json`);
  if (!fs.existsSync(p)) return;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  const now = '2026-11-21T19:55:00+03:00';

  for (const s of data.sources) {
    const idx = d.sources.findIndex(x => x.id === s.id);
    if (idx >= 0) d.sources[idx] = s;
    else d.sources.push(s);
  }
  d.lead_search_checks = data.lead_search_checks;

  const assessment = assessLead(d);
  console.log(`${slug} assessment (expected false):`, assessment.eligible, assessment.reasons.join('; '));
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n', 'utf8');
}

// 1. ponarin-mx
updateDeferredLead('ponarin-mx', {
  sources: [
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/moto_ponarin_mkh/172059395202/",
      checked_at: "2026-11-21T19:47:00+03:00",
      excerpt: "Мото Понарин Мх, Воронеж, ул. Мазлумова, 25А / ул. Антонова-Овсеенко, 9В. Сайт: https://ponarinmx.ru. Telegram: t.me/ponarinmx (канал, 469 подписчиков)."
    },
    {
      id: "two-gis-card",
      url: "https://2gis.ru/voronezh/firm/70000001081692097",
      checked_at: "2026-11-21T19:47:00+03:00",
      excerpt: "Ponarin MX, Воронеж, ул. Антонова-Овсеенко, 9в. Опубликованы t.me/ponarinmx (канал) и t.me/+79601308620 (телефон)."
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/Ponarin+MX+Voronezh/",
      checked_at: "2026-11-21T19:47:00+03:00",
      excerpt: "Ponarin MX: подходящая карточка не найдена после поиска в Google Maps."
    }
  ],
  lead_search_checks: {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/moto_ponarin_mkh/172059395202/",
        checked_at: "2026-11-21T19:47:00+03:00",
        identity_status: "verified",
        identity_evidence: "Ponarin MX: совпали название, город Воронеж и адреса Мазлумова 25А / Антонова-Овсеенко 9В.",
        source_id: "yandex-maps-card",
        website: { status: "found", value: "https://ponarinmx.ru", note: "Сайт открыт из карточки Яндекс Карт." }
      },
      two_gis: {
        status: "verified",
        url: "https://2gis.ru/voronezh/firm/70000001081692097",
        checked_at: "2026-11-21T19:47:00+03:00",
        identity_status: "verified",
        identity_evidence: "Ponarin MX: совпали название, город Воронеж и адрес ул. Антонова-Овсеенко, 9в.",
        source_id: "two-gis-card",
        website: { status: "found", value: "https://ponarinmx.ru", note: "Сайт открыт из карточки 2ГИС." }
      },
      google_maps: {
        status: "missing",
        url: "https://www.google.com/maps/search/Ponarin+MX+Voronezh/",
        checked_at: "2026-11-21T19:47:00+03:00",
        identity_status: "not_found",
        identity_evidence: "Ponarin MX: подходящая карточка не найдена после поиска в Google Maps.",
        source_id: "google-maps-search",
        website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в Google Maps." }
      }
    },
    telegram: {
      status: "missing",
      url: null,
      kind: null,
      role: null,
      role_evidence: "В карточках на картах опубликован только Telegram-канал t.me/ponarinmx (469 подписчиков) и телефонная ссылка t.me/+79601308620; прямой рабочий чат владельца/администратора на картах отсутствует.",
      platform: null,
      source_id: null,
      checked_at: "2026-11-21T19:47:00+03:00"
    }
  }
});

// 2. moto-racer-odintsovo
updateDeferredLead('moto-racer-odintsovo', {
  sources: [
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/moto_reyser/1294820192/",
      checked_at: "2026-11-21T19:48:00+03:00",
      excerpt: "Мото Рейсер, Одинцово, Озёрная ул., 115. Рейтинг 4.8. Telegram в карточке отсутствует."
    },
    {
      id: "two-gis-search",
      url: "https://2gis.ru/moscow/search/racer",
      checked_at: "2026-11-21T19:48:00+03:00",
      excerpt: "Мото Рейсер: активная карточка филиала в 2ГИС не найдена, только общий поиск."
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/Moto+Racer+Odintsovo/",
      checked_at: "2026-11-21T19:48:00+03:00",
      excerpt: "Мото Рейсер Одинцово: подходящая карточка не найдена в Google Maps."
    }
  ],
  lead_search_checks: {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/moto_reyser/1294820192/",
        checked_at: "2026-11-21T19:48:00+03:00",
        identity_status: "verified",
        identity_evidence: "Мото Рейсер: совпали название, город Одинцово и адрес Озёрная ул., 115.",
        source_id: "yandex-maps-card",
        website: { status: "not_found_in_checked_sources", value: null, note: "В карточке Яндекс Карт сайт не указан." }
      },
      two_gis: {
        status: "missing",
        url: "https://2gis.ru/moscow/search/racer",
        checked_at: "2026-11-21T19:48:00+03:00",
        identity_status: "not_found",
        identity_evidence: "Мото Рейсер: карточка филиала не найдена в 2ГИС.",
        source_id: "two-gis-search",
        website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в 2ГИС." }
      },
      google_maps: {
        status: "missing",
        url: "https://www.google.com/maps/search/Moto+Racer+Odintsovo/",
        checked_at: "2026-11-21T19:48:00+03:00",
        identity_status: "not_found",
        identity_evidence: "Мото Рейсер: карточка не найдена в Google Maps.",
        source_id: "google-maps-search",
        website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в Google Maps." }
      }
    },
    telegram: {
      status: "missing",
      url: null,
      kind: null,
      role: null,
      role_evidence: "В карточках на картах ссылка на Telegram отсутствует (встречалась только на сайте moto-racer.ru/oplata/).",
      platform: null,
      source_id: null,
      checked_at: "2026-11-21T19:48:00+03:00"
    }
  }
});

// 3. guruenduro
updateDeferredLead('guruenduro', {
  sources: [
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/guruenduro/109738250013/",
      checked_at: "2026-11-21T19:51:00+03:00",
      excerpt: "Guruenduro, Краснодар, ул. Ягодина, 59. Опубликован Telegram-канал t.me/guru_enduro (2438 подписчиков) и сайт guruenduro.ru."
    },
    {
      id: "two-gis-search",
      url: "https://2gis.ru/krasnodar/search/Enduro%20krasnodar",
      checked_at: "2026-11-21T19:51:00+03:00",
      excerpt: "2ГИС Краснодар: подходящая карточка не подтверждена."
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/Guruenduro+Krasnodar/",
      checked_at: "2026-11-21T19:51:00+03:00",
      excerpt: "Guruenduro: карточка не найдена в Google Maps."
    }
  ],
  lead_search_checks: {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/guruenduro/109738250013/",
        checked_at: "2026-11-21T19:51:00+03:00",
        identity_status: "verified",
        identity_evidence: "Guruenduro: совпали название, город Краснодар и адрес ул. Ягодина, 59.",
        source_id: "yandex-maps-card",
        website: { status: "found", value: "https://guruenduro.ru", note: "Сайт открыт из карточки Яндекс Карт." }
      },
      two_gis: {
        status: "missing",
        url: "https://2gis.ru/krasnodar/search/Enduro%20krasnodar",
        checked_at: "2026-11-21T19:51:00+03:00",
        identity_status: "not_found",
        identity_evidence: "Guruenduro: карточка не найдена в 2ГИС.",
        source_id: "two-gis-search",
        website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в 2ГИС." }
      },
      google_maps: {
        status: "missing",
        url: "https://www.google.com/maps/search/Guruenduro+Krasnodar/",
        checked_at: "2026-11-21T19:51:00+03:00",
        identity_status: "not_found",
        identity_evidence: "Guruenduro: карточка не найдена в Google Maps.",
        source_id: "google-maps-search",
        website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в Google Maps." }
      }
    },
    telegram: {
      status: "missing",
      url: null,
      kind: null,
      role: null,
      role_evidence: "В карточке Яндекс Карт опубликован только Telegram-канал t.me/guru_enduro (2438 подписчиков); прямой контакт администратора на картах отсутствует.",
      platform: null,
      source_id: null,
      checked_at: "2026-11-21T19:51:00+03:00"
    }
  }
});

// 4. motobro
updateDeferredLead('motobro', {
  sources: [
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/motobro/147653886434/",
      checked_at: "2026-11-21T19:52:00+03:00",
      excerpt: "МотоБРО, Новосибирск, ул. Писарева, 60. Опубликован канал t.me/motobro_shop (473 подписчика) и сайт motobro.shop."
    },
    {
      id: "two-gis-card",
      url: "https://2gis.ru/novosibirsk/firm/141265769628791",
      checked_at: "2026-11-21T19:52:00+03:00",
      excerpt: "МотоБРО, Новосибирск, ул. Писарева, 60. Telegram отсутствует."
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/Motobro+Novosibirsk+Pisareva+60/",
      checked_at: "2026-11-21T19:52:00+03:00",
      excerpt: "МотоБРО: карточка не найдена в Google Maps."
    }
  ],
  lead_search_checks: {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/motobro/147653886434/",
        checked_at: "2026-11-21T19:52:00+03:00",
        identity_status: "verified",
        identity_evidence: "МотоБРО: совпали название, город Новосибирск и адрес ул. Писарева, 60.",
        source_id: "yandex-maps-card",
        website: { status: "found", value: "https://motobro.shop", note: "Сайт открыт из карточки Яндекс Карт." }
      },
      two_gis: {
        status: "verified",
        url: "https://2gis.ru/novosibirsk/firm/141265769628791",
        checked_at: "2026-11-21T19:52:00+03:00",
        identity_status: "verified",
        identity_evidence: "МотоБРО: совпали название, город Новосибирск и адрес ул. Писарева, 60.",
        source_id: "two-gis-card",
        website: { status: "not_found_in_checked_sources", value: null, note: "Сайт в карточке 2ГИС не указан." }
      },
      google_maps: {
        status: "missing",
        url: "https://www.google.com/maps/search/Motobro+Novosibirsk+Pisareva+60/",
        checked_at: "2026-11-21T19:52:00+03:00",
        identity_status: "not_found",
        identity_evidence: "МотоБРО: карточка не найдена в Google Maps.",
        source_id: "google-maps-search",
        website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в Google Maps." }
      }
    },
    telegram: {
      status: "missing",
      url: null,
      kind: null,
      role: null,
      role_evidence: "В карточке Яндекс Карт опубликован только Telegram-канал t.me/motobro_shop (473 подписчика); прямой чат на картах отсутствует.",
      platform: null,
      source_id: null,
      checked_at: "2026-11-21T19:52:00+03:00"
    }
  }
});

// 5. darex-moto-nn
updateDeferredLead('darex-moto-nn', {
  sources: [
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/darex_moto/18587033313/",
      checked_at: "2026-11-21T19:52:00+03:00",
      excerpt: "Darex Moto, Нижний Новгород, Московское шоссе, 302/1Д. Опубликован Telegram-канал t.me/darex_moto_ru (6801 подписчик) и сайт darexmoto.ru."
    },
    {
      id: "two-gis-search",
      url: "https://2gis.ru/n_novgorod/search/Darex%20Moto",
      checked_at: "2026-11-21T19:52:00+03:00",
      excerpt: "Darex Moto: карточка филиала не найдена в 2ГИС."
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/Darex+Moto+Nizhny+Novgorod/",
      checked_at: "2026-11-21T19:52:00+03:00",
      excerpt: "Darex Moto: карточка не найдена в Google Maps."
    }
  ],
  lead_search_checks: {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/darex_moto/18587033313/",
        checked_at: "2026-11-21T19:52:00+03:00",
        identity_status: "verified",
        identity_evidence: "Darex Moto: совпали название, город Нижний Новгород и адрес Московское шоссе, 302/1Д.",
        source_id: "yandex-maps-card",
        website: { status: "found", value: "https://darexmoto.ru", note: "Сайт открыт из карточки Яндекс Карт." }
      },
      two_gis: {
        status: "missing",
        url: "https://2gis.ru/n_novgorod/search/Darex%20Moto",
        checked_at: "2026-11-21T19:52:00+03:00",
        identity_status: "not_found",
        identity_evidence: "Darex Moto: карточка филиала не найдена в 2ГИС.",
        source_id: "two-gis-search",
        website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в 2ГИС." }
      },
      google_maps: {
        status: "missing",
        url: "https://www.google.com/maps/search/Darex+Moto+Nizhny+Novgorod/",
        checked_at: "2026-11-21T19:52:00+03:00",
        identity_status: "not_found",
        identity_evidence: "Darex Moto: карточка не найдена в Google Maps.",
        source_id: "google-maps-search",
        website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в Google Maps." }
      }
    },
    telegram: {
      status: "missing",
      url: null,
      kind: null,
      role: null,
      role_evidence: "В карточке Яндекс Карт опубликован только канал t.me/darex_moto_ru (6801 подписчик); прямой контакт администратора на картах отсутствует.",
      platform: null,
      source_id: null,
      checked_at: "2026-11-21T19:52:00+03:00"
    }
  }
});

// 6. fox-moto-chel
updateDeferredLead('fox-moto-chel', {
  sources: [
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/foks_moto/1211079822/",
      checked_at: "2026-11-21T19:56:00+03:00",
      excerpt: "FOX moto, Челябинск, ул. Татьяничевой, 16. Опубликован Telegram-канал t.me/foxmoto74 (72 подписчика) и сайт foxmoto.ru."
    },
    {
      id: "two-gis-card",
      url: "https://2gis.ru/chelyabinsk/firm/2111590606572857",
      checked_at: "2026-11-21T19:56:00+03:00",
      excerpt: "FOX moto, Челябинск, ул. Татьяничевой, 16. Опубликован Telegram-канал t.me/foxmoto74."
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/FOX+moto+Chelyabinsk+Tatyanichevoy+16/",
      checked_at: "2026-11-21T19:56:00+03:00",
      excerpt: "FOX moto: карточка не найдена в Google Maps."
    }
  ],
  lead_search_checks: {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/foks_moto/1211079822/",
        checked_at: "2026-11-21T19:56:00+03:00",
        identity_status: "verified",
        identity_evidence: "FOX moto: совпали название, город Челябинск и адрес ул. Татьяничевой, 16.",
        source_id: "yandex-maps-card",
        website: { status: "found", value: "https://foxmoto.ru", note: "Сайт открыт из карточки Яндекс Карт." }
      },
      two_gis: {
        status: "verified",
        url: "https://2gis.ru/chelyabinsk/firm/2111590606572857",
        checked_at: "2026-11-21T19:56:00+03:00",
        identity_status: "verified",
        identity_evidence: "FOX moto: совпали название, город Челябинск и адрес ул. Татьяничевой, 16.",
        source_id: "two-gis-card",
        website: { status: "not_found_in_checked_sources", value: null, note: "Сайт в карточке 2ГИС не указан." }
      },
      google_maps: {
        status: "missing",
        url: "https://www.google.com/maps/search/FOX+moto+Chelyabinsk+Tatyanichevoy+16/",
        checked_at: "2026-11-21T19:56:00+03:00",
        identity_status: "not_found",
        identity_evidence: "FOX moto: карточка не найдена в Google Maps.",
        source_id: "google-maps-search",
        website: { status: "not_found_in_checked_sources", value: null, note: "Карточка не найдена в Google Maps." }
      }
    },
    telegram: {
      status: "missing",
      url: null,
      kind: null,
      role: null,
      role_evidence: "В карточках Яндекс Карт и 2ГИС опубликован только канал t.me/foxmoto74 (72 подписчика); прямой контакт на картах отсутствует.",
      platform: null,
      source_id: null,
      checked_at: "2026-11-21T19:56:00+03:00"
    }
  }
});

console.log('Deferred leads updated.');
