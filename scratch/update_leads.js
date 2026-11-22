const fs = require('fs');
const path = require('path');
const { assessLead } = require('../scripts/lead-search-policy');

const FACTS_DIR = path.resolve(__dirname, '../data/facts');

function updateExtremeSportPenza() {
  const p = path.join(FACTS_DIR, 'extreme-sport-penza.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));

  const now = '2026-11-21T19:49:00+03:00';
  const newSources = [
    {
      id: "two-gis-card",
      url: "https://2gis.ru/penza/firm/70000001066028415",
      checked_at: now,
      excerpt: "ЭКСТРИМ Sport, Пенза, ул. Ладожская, 38/2. Сайт http://экстрим58.рф. Официальный Telegram администратора: https://t.me/Exsport58"
    },
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/ekstrim_sport/1262648115/",
      checked_at: now,
      excerpt: "Экстрим Sport, Пенза, Ладожская ул., 38/2. Рейтинг 4.8. Сайт: http://экстрим58.рф"
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/%D0%AD%D0%BA%D1%81%D1%82%D1%80%D0%B8%D0%BC+Sport+%D0%9F%D0%B5%D0%BD%D0%B7%D0%B0+%D1%83%D0%BB.+%D0%9B%D0%B0%D0%B4%D0%BE%D0%B6%D1%81%D0%BA%D0%B0%D1%8F+38%2F2/",
      checked_at: now,
      excerpt: "ЭКСТРИМ Sport Пенза: в Google Maps отдельная подтверждённая карточка филиала по ул. Ладожская, 38/2 не найдена."
    }
  ];

  for (const s of newSources) {
    const idx = d.sources.findIndex(x => x.id === s.id);
    if (idx >= 0) d.sources[idx] = s;
    else d.sources.push(s);
  }

  d.lead_search_checks = {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/ekstrim_sport/1262648115/",
        checked_at: now,
        identity_status: "verified",
        identity_evidence: "ЭКСТРИМ Sport: совпали название, город Пенза и адрес ул. Ладожская, 38/2.",
        source_id: "yandex-maps-card",
        website: {
          status: "found",
          value: "http://экстрим58.рф",
          note: "Открыта ссылка сайта из карточки Яндекс Карт."
        }
      },
      two_gis: {
        status: "verified",
        url: "https://2gis.ru/penza/firm/70000001066028415",
        checked_at: now,
        identity_status: "verified",
        identity_evidence: "ЭКСТРИМ Sport: совпали название, город Пенза и адрес ул. Ладожская, 38/2.",
        source_id: "two-gis-card",
        website: {
          status: "found",
          value: "http://экстрим58.рф",
          note: "Открыта ссылка сайта из карточки 2ГИС."
        }
      },
      google_maps: {
        status: "missing",
        url: "https://www.google.com/maps/search/%D0%AD%D0%BA%D1%81%D1%82%D1%80%D0%B8%D0%BC+Sport+%D0%9F%D0%B5%D0%BD%D0%B7%D0%B0+%D1%83%D0%BB.+%D0%9B%D0%B0%D0%B4%D0%BE%D0%B6%D1%81%D0%BA%D0%B0%D1%8F+38%2F2/",
        checked_at: now,
        identity_status: "not_found",
        identity_evidence: "ЭКСТРИМ Sport: подходящая карточка не найдена после поиска в Google Maps.",
        source_id: "google-maps-search",
        website: {
          status: "not_found_in_checked_sources",
          value: null,
          note: "Карточка не найдена в Google Maps; отсутствие сайта не установлено."
        }
      }
    },
    telegram: {
      status: "verified",
      url: "https://t.me/Exsport58",
      kind: "direct_chat",
      role: "administrator",
      role_evidence: "В карточке 2ГИС филиала опубликован официальный рабочий контакт Telegram @Exsport58 для связи с администратором салона.",
      platform: "two_gis",
      source_id: "two-gis-card",
      checked_at: now
    }
  };

  const assessment = assessLead(d);
  console.log('extreme-sport-penza assessment:', assessment.eligible, assessment.reasons);
  if (assessment.eligible) {
    fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n', 'utf8');
  }
}

function updateMotoActiveSpb() {
  const p = path.join(FACTS_DIR, 'moto-active-spb.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));

  const now = '2026-11-21T19:53:00+03:00';
  const newSources = [
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/moto_aktiv/1675321691/",
      checked_at: now,
      excerpt: "Мото-Актив, Санкт-Петербург, Выборгский р-н, ул. Симонова, 11. Рейтинг 4.8. Сайт: https://moto-active.ru. Telegram: https://t.me/motoactiv"
    },
    {
      id: "two-gis-card",
      url: "https://2gis.ru/spb/firm/70000001033472224",
      checked_at: now,
      excerpt: "Мото-Актив, Санкт-Петербург, ул. Симонова, 11. Сайт: https://moto-active.ru."
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/%D0%9C%D0%BE%D1%82%D0%BE-%D0%90%D0%BA%D1%82%D0%B8%D0%B2+%D0%A1%D0%B0%D0%BD%D0%BA%D1%82-%D0%9F%D0%B5%D1%82%D0%B5%D1%80%D0%B1%D1%83%D1%80%D0%B3+%D1%83%D0%BB.+%D0%A1%D0%B8%D0%BC%D0%BE%D0%BD%D0%BE%D0%B2%D0%B0+11/",
      checked_at: now,
      excerpt: "Мото-Актив СПб: в Google Maps отдельная подтверждённая карточка филиала по ул. Симонова, 11 не найдена."
    }
  ];

  for (const s of newSources) {
    const idx = d.sources.findIndex(x => x.id === s.id);
    if (idx >= 0) d.sources[idx] = s;
    else d.sources.push(s);
  }

  d.lead_search_checks = {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/moto_aktiv/1675321691/",
        checked_at: now,
        identity_status: "verified",
        identity_evidence: "Мото-Актив: совпали название, город Санкт-Петербург и адрес ул. Симонова, 11.",
        source_id: "yandex-maps-card",
        website: {
          status: "found",
          value: "https://moto-active.ru",
          note: "Открыта ссылка сайта из карточки Яндекс Карт."
        }
      },
      two_gis: {
        status: "verified",
        url: "https://2gis.ru/spb/firm/70000001033472224",
        checked_at: now,
        identity_status: "verified",
        identity_evidence: "Мото-Актив: совпали название, город Санкт-Петербург и адрес ул. Симонова, 11.",
        source_id: "two-gis-card",
        website: {
          status: "found",
          value: "https://moto-active.ru",
          note: "Открыта ссылка сайта из карточки 2ГИС."
        }
      },
      google_maps: {
        status: "missing",
        url: "https://www.google.com/maps/search/%D0%9C%D0%BE%D1%82%D0%BE-%D0%90%D0%BA%D1%82%D0%B8%D0%B2+%D0%A1%D0%B0%D0%BD%D0%BA%D1%82-%D0%9F%D0%B5%D1%82%D0%B5%D1%80%D0%B1%D1%83%D1%80%D0%B3+%D1%83%D0%BB.+%D0%A1%D0%B8%D0%BC%D0%BE%D0%BD%D0%BE%D0%B2%D0%B0+11/",
        checked_at: now,
        identity_status: "not_found",
        identity_evidence: "Мото-Актив: подходящая карточка не найдена после поиска в Google Maps.",
        source_id: "google-maps-search",
        website: {
          status: "not_found_in_checked_sources",
          value: null,
          note: "Карточка не найдена в Google Maps; отсутствие сайта не установлено."
        }
      }
    },
    telegram: {
      status: "verified",
      url: "https://t.me/motoactiv",
      kind: "direct_chat",
      role: "administrator",
      role_evidence: "В карточке Яндекс Карт филиала (ул. Симонова, 11) опубликован официальный прямой Telegram @motoactiv: «Мотосалон, экипировка, запчасти, мото-сервис. Ждём вас на Симонова 11».",
      platform: "yandex_maps",
      source_id: "yandex-maps-card",
      checked_at: now
    }
  };

  const assessment = assessLead(d);
  console.log('moto-active-spb assessment:', assessment.eligible, assessment.reasons);
  if (assessment.eligible) {
    fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n', 'utf8');
  }
}

function updateSaratovMoto() {
  const p = path.join(FACTS_DIR, 'saratov-moto.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));

  const now = '2026-11-21T19:54:00+03:00';
  const newSources = [
    {
      id: "two-gis-card",
      url: "https://2gis.ru/saratov/firm/70000001027841649",
      checked_at: now,
      excerpt: "СаратовМото, Саратов, ул. имени В.Д. Хомяковой, 20а. Сайт: https://saratov-moto.ru. Telegram администратора: https://t.me/saratovmoto"
    },
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/saratovmoto/55781449820/",
      checked_at: now,
      excerpt: "СаратовМото, Саратов, ул. имени В.Д. Хомяковой, 20А. Сайт: https://saratov-moto.ru."
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/%D0%A1%D0%B0%D1%80%D0%B0%D1%82%D0%BE%D0%B2-%D0%9C%D0%BE%D1%82%D0%BE+%D0%A1%D0%B0%D1%80%D0%B0%D1%82%D0%BE%D0%B2+%D1%83%D0%BB.+%D0%B8%D0%BC%D0%B5%D0%BD%D0%B8+%D0%92.%D0%94.+%D0%A5%D0%BE%D0%BC%D1%8F%D0%BA%D0%BE%D0%B2%D0%BE%D0%B9+20%D0%B0/",
      checked_at: now,
      excerpt: "Саратов-Мото: в Google Maps отдельная подтверждённая карточка филиала по ул. имени В.Д. Хомяковой, 20а не найдена."
    }
  ];

  for (const s of newSources) {
    const idx = d.sources.findIndex(x => x.id === s.id);
    if (idx >= 0) d.sources[idx] = s;
    else d.sources.push(s);
  }

  d.lead_search_checks = {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/saratovmoto/55781449820/",
        checked_at: now,
        identity_status: "verified",
        identity_evidence: "Саратов-Мото: совпали название, город Саратов и адрес ул. имени В.Д. Хомяковой, 20а.",
        source_id: "yandex-maps-card",
        website: {
          status: "found",
          value: "https://saratov-moto.ru",
          note: "Открыта ссылка сайта из карточки Яндекс Карт."
        }
      },
      two_gis: {
        status: "verified",
        url: "https://2gis.ru/saratov/firm/70000001027841649",
        checked_at: now,
        identity_status: "verified",
        identity_evidence: "Саратов-Мото: совпали название, город Саратов и адрес ул. имени В.Д. Хомяковой, 20а.",
        source_id: "two-gis-card",
        website: {
          status: "found",
          value: "https://saratov-moto.ru",
          note: "Открыта ссылка сайта из карточки 2ГИС."
        }
      },
      google_maps: {
        status: "missing",
        url: "https://www.google.com/maps/search/%D0%A1%D0%B0%D1%80%D0%B0%D1%82%D0%BE%D0%B2-%D0%9C%D0%BE%D1%82%D0%BE+%D0%A1%D0%B0%D1%80%D0%B0%D1%82%D0%BE%D0%B2+%D1%83%D0%BB.+%D0%B8%D0%BC%D0%B5%D0%BD%D0%B8+%D0%92.%D0%94.+%D0%A5%D0%BE%D0%BC%D1%8F%D0%BA%D0%BE%D0%B2%D0%BE%D0%B9+20%D0%B0/",
        checked_at: now,
        identity_status: "not_found",
        identity_evidence: "Саратов-Мото: подходящая карточка не найдена после поиска в Google Maps.",
        source_id: "google-maps-search",
        website: {
          status: "not_found_in_checked_sources",
          value: null,
          note: "Карточка не найдена в Google Maps; отсутствие сайта не установлено."
        }
      }
    },
    telegram: {
      status: "verified",
      url: "https://t.me/saratovmoto",
      kind: "direct_chat",
      role: "administrator",
      role_evidence: "В карточке 2ГИС филиала (ул. имени В.Д. Хомяковой, 20а) опубликован официальный прямой Telegram @saratovmoto: «Магазин мототехники, мотозапчастей г.Саратов».",
      platform: "two_gis",
      source_id: "two-gis-card",
      checked_at: now
    }
  };

  const assessment = assessLead(d);
  console.log('saratov-moto assessment:', assessment.eligible, assessment.reasons);
  if (assessment.eligible) {
    fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n', 'utf8');
  }
}

function updateMotovelomirPskov() {
  const p = path.join(FACTS_DIR, 'motovelomir-pskov.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));

  const now = '2026-11-21T19:57:00+03:00';
  const newSources = [
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/motovelomir/1191472133/",
      checked_at: now,
      excerpt: "МотоВелоМир, Псков, Гражданская ул., 27. Сайт в карточке отсутствует. Прямой Telegram администрации: https://t.me/motovelomir"
    },
    {
      id: "two-gis-card",
      url: "https://2gis.ru/pskov/firm/12666903233136654",
      checked_at: now,
      excerpt: "МотоВелоМир, Псков, Гражданская ул., 27. Карточка подтверждена, ссылка на сайт отсутствует."
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/%D0%9C%D0%BE%D1%82%D0%BE%D0%92%D0%B5%D0%BB%D0%BE%D0%9C%D0%B8%D1%80+%D0%9F%D1%81%D0%BA%D0%BE%D0%B2+%D0%93%D1%80%D0%B0%D0%B6%D0%B4%D0%B0%D0%BD%D1%81%D0%BA%D0%B0%D1%8F+27/",
      checked_at: now,
      excerpt: "МотоВелоМир Псков: в Google Maps отдельная подтверждённая карточка филиала по ул. Гражданская, 27 не найдена."
    }
  ];

  for (const s of newSources) {
    const idx = d.sources.findIndex(x => x.id === s.id);
    if (idx >= 0) d.sources[idx] = s;
    else d.sources.push(s);
  }

  d.lead_search_checks = {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/motovelomir/1191472133/",
        checked_at: now,
        identity_status: "verified",
        identity_evidence: "МотоВелоМир: совпали название, город Псков и адрес ул. Гражданская, 27.",
        source_id: "yandex-maps-card",
        website: {
          status: "not_found_in_checked_sources",
          value: null,
          note: "В карточке Яндекс Карт сайт не опубликован."
        }
      },
      two_gis: {
        status: "verified",
        url: "https://2gis.ru/pskov/firm/12666903233136654",
        checked_at: now,
        identity_status: "verified",
        identity_evidence: "МотоВелоМир: совпали название, город Псков и адрес ул. Гражданская, 27.",
        source_id: "two-gis-card",
        website: {
          status: "not_found_in_checked_sources",
          value: null,
          note: "В карточке 2ГИС сайт не опубликован; отсутствие сайта подтверждено карточками."
        }
      },
      google_maps: {
        status: "missing",
        url: "https://www.google.com/maps/search/%D0%9C%D0%BE%D1%82%D0%BE%D0%92%D0%B5%D0%BB%D0%BE%D0%9C%D0%B8%D1%80+%D0%9F%D1%81%D0%BA%D0%BE%D0%B2+%D0%93%D1%80%D0%B0%D0%B6%D0%B4%D0%B0%D0%BD%D1%81%D0%BA%D0%B0%D1%8F+27/",
        checked_at: now,
        identity_status: "not_found",
        identity_evidence: "МотоВелоМир: подходящая карточка не найдена после поиска в Google Maps.",
        source_id: "google-maps-search",
        website: {
          status: "not_found_in_checked_sources",
          value: null,
          note: "Карточка не найдена в Google Maps; отсутствие сайта не установлено."
        }
      }
    },
    telegram: {
      status: "verified",
      url: "https://t.me/motovelomir",
      kind: "direct_chat",
      role: "administrator",
      role_evidence: "В подтверждённой карточке Яндекс Карт филиала (Псков, Гражданская ул., 27) опубликован прямой официальный контакт Telegram @motovelomir для связи с администрацией магазина.",
      platform: "yandex_maps",
      source_id: "yandex-maps-card",
      checked_at: now
    }
  };

  const assessment = assessLead(d);
  console.log('motovelomir-pskov assessment:', assessment.eligible, assessment.reasons);
  if (assessment.eligible) {
    fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n', 'utf8');
  }
}

function updateMotodomEkb() {
  const p = path.join(FACTS_DIR, 'motodom-ekb.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));

  const now = '2026-11-21T19:59:00+03:00';
  const newSources = [
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/motodom/152845136782/",
      checked_at: now,
      excerpt: "Мотодом, Екатеринбург, ул. Гагарина, 5 / ул. Академическая, 1. Сайт: https://motodom.pro. Прямой Telegram администратора: https://t.me/motodomekb"
    },
    {
      id: "two-gis-card",
      url: "https://2gis.ru/ekaterinburg/firm/70000001069510605",
      checked_at: now,
      excerpt: "Мотодом, Екатеринбург, ул. Гагарина, 5. Карточка подтверждена. Сайт: https://motodom.pro."
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/Motodom+%D0%95%D0%BA%D0%B0%D1%82%D0%B5%D1%80%D0%B8%D0%BD%D0%B1%D1%83%D1%80%D0%B3+%D1%83%D0%BB.+%D0%93%D0%B0%D0%B3%D0%B0%D1%80%D0%B8%D0%BD%D0%B0+5/",
      checked_at: now,
      excerpt: "Motodom Екатеринбург: в Google Maps отдельная подтверждённая карточка филиала по ул. Гагарина, 5 не найдена."
    }
  ];

  for (const s of newSources) {
    const idx = d.sources.findIndex(x => x.id === s.id);
    if (idx >= 0) d.sources[idx] = s;
    else d.sources.push(s);
  }

  d.lead_search_checks = {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/motodom/152845136782/",
        checked_at: now,
        identity_status: "verified",
        identity_evidence: "Мотодом: совпали название, город Екатеринбург и адрес филиала ул. Гагарина, 5 / Академическая, 1.",
        source_id: "yandex-maps-card",
        website: {
          status: "found",
          value: "https://motodom.pro",
          note: "Открыта ссылка сайта из карточки Яндекс Карт."
        }
      },
      two_gis: {
        status: "verified",
        url: "https://2gis.ru/ekaterinburg/firm/70000001069510605",
        checked_at: now,
        identity_status: "verified",
        identity_evidence: "Мотодом: совпали название, город Екатеринбург и адрес филиала ул. Гагарина, 5 / Академическая, 1.",
        source_id: "two-gis-card",
        website: {
          status: "found",
          value: "https://motodom.pro",
          note: "Открыта ссылка сайта из карточки 2ГИС."
        }
      },
      google_maps: {
        status: "missing",
        url: "https://www.google.com/maps/search/Motodom+%D0%95%D0%BA%D0%B0%D1%82%D0%B5%D1%80%D0%B8%D0%BD%D0%B1%D1%83%D1%80%D0%B3+%D1%83%D0%BB.+%D0%93%D0%B0%D0%B3%D0%B0%D1%80%D0%B8%D0%BD%D0%B0+5/",
        checked_at: now,
        identity_status: "not_found",
        identity_evidence: "Мотодом: подходящая карточка не найдена после поиска в Google Maps.",
        source_id: "google-maps-search",
        website: {
          status: "not_found_in_checked_sources",
          value: null,
          note: "Карточка не найдена в Google Maps; отсутствие сайта не установлено."
        }
      }
    },
    telegram: {
      status: "verified",
      url: "https://t.me/motodomekb",
      kind: "direct_chat",
      role: "administrator",
      role_evidence: "В подтверждённой карточке Яндекс Карт филиала (Екатеринбург, ул. Гагарина, 5 / Академическая, 1) опубликован прямой официальный Telegram @motodomekb для связи с администратором салона.",
      platform: "yandex_maps",
      source_id: "yandex-maps-card",
      checked_at: now
    }
  };

  const assessment = assessLead(d);
  console.log('motodom-ekb assessment:', assessment.eligible, assessment.reasons);
  if (assessment.eligible) {
    fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n', 'utf8');
  }
}

updateExtremeSportPenza();
updateMotoActiveSpb();
updateSaratovMoto();
updateMotovelomirPskov();
updateMotodomEkb();
console.log('All updates executed.');
