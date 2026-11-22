const fs = require('fs');
const path = require('path');
const { assessLead } = require('../scripts/lead-search-policy');

const updates = [
  {
    slug: 'sp-motors-yar',
    sources: [
      {
        id: 'two-gis-card',
        url: 'https://2gis.ru/yaroslavl/firm/70000001094424645',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'SP Motors, Ярославль, Тутаевское шоссе, 2в. Официальный сайт http://spmotors.su'
      },
      {
        id: 'yandex-maps-card',
        url: 'https://yandex.ru/maps/org/sp_motors/203527200275/',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'SP Motors, Ярославль, Тутаевское ш., 2В. Официальный Telegram администратора: https://t.me/spmotors, сайт http://www.spmotors.su/'
      },
      {
        id: 'google-maps-search',
        url: 'https://www.google.com/maps/search/SP+Motors+%D0%AF%D1%80%D0%BE%D1%81%D0%BB%D0%B0%D0%B2%D0%BB%D1%8C+%D0%A2%D1%83%D1%82%D0%B0%D0%B5%D0%B2%D1%81%D0%BA%D0%BE%D0%B5+%D1%88%D0%BE%D1%81%D1%81%D0%B5+2%D0%B2/',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'SP Motors Ярославль: в Google Maps карточка филиала по Тутаевскому ш., 2в не найдена.'
      }
    ],
    lead_search_checks: {
      maps: {
        yandex_maps: {
          status: 'verified',
          url: 'https://yandex.ru/maps/org/sp_motors/203527200275/',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'verified',
          identity_evidence: 'SP Motors: совпали название, город Ярославль и адрес Тутаевское шоссе, 2в.',
          source_id: 'yandex-maps-card',
          website: {
            status: 'found',
            value: 'http://www.spmotors.su/',
            note: 'Открыта ссылка сайта из карточки Яндекс Карт.'
          }
        },
        two_gis: {
          status: 'verified',
          url: 'https://2gis.ru/yaroslavl/firm/70000001094424645',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'verified',
          identity_evidence: 'SP Motors: совпали название, город Ярославль и адрес Тутаевское шоссе, 2в.',
          source_id: 'two-gis-card',
          website: {
            status: 'found',
            value: 'http://spmotors.su',
            note: 'Открыта ссылка сайта из карточки 2ГИС.'
          }
        },
        google_maps: {
          status: 'missing',
          url: 'https://www.google.com/maps/search/SP+Motors+%D0%AF%D1%80%D0%BE%D1%81%D0%BB%D0%B0%D0%B2%D0%BB%D1%8C+%D0%A2%D1%83%D1%82%D0%B0%D0%B5%D0%B2%D1%81%D0%BA%D0%BE%D0%B5+%D1%88%D0%BE%D1%81%D1%81%D0%B5+2%D0%B2/',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'not_found',
          identity_evidence: 'SP Motors: отдельная подтверждённая карточка филиала по Тутаевскому ш., 2в в Google Maps не найдена.',
          source_id: 'google-maps-search',
          website: {
            status: 'not_found_in_checked_sources',
            value: null,
            note: 'Карточка не найдена в Google Maps; отсутствие сайта не установлено.'
          }
        }
      },
      telegram: {
        status: 'verified',
        url: 'https://t.me/spmotors',
        kind: 'direct_chat',
        role: 'administrator',
        role_evidence: 'В карточке Яндекс Карт филиала опубликован официальный рабочий контакт Telegram @spmotors (SPMOTORS) для связи с салоном.',
        platform: 'yandex_maps',
        source_id: 'yandex-maps-card',
        checked_at: '2026-11-21T23:10:00+03:00'
      }
    }
  },
  {
    slug: 'motosoyuz-nk',
    sources: [
      {
        id: 'two-gis-card',
        url: 'https://2gis.ru/novokuznetsk/firm/70000001083631233',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'МотоСоюз, Новокузнецк, ул. Димитрова, 21. Сайт отсутствует.'
      },
      {
        id: 'yandex-maps-card',
        url: 'https://yandex.ru/maps/org/motosoyuz/83103600904/',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'МотоСоюз, Новокузнецк, ул. Димитрова, 21. Официальный Telegram администратора: https://t.me/motosouznvkz. Сайт отсутствует.'
      },
      {
        id: 'google-maps-search',
        url: 'https://www.google.com/maps/search/%D0%9C%D0%BE%D1%82%D0%BE%D0%A1%D0%BE%D1%8E%D0%B7+%D0%9D%D0%BE%D0%B2%D0%BE%D0%BA%D1%83%D0%B7%D0%BD%D0%B5%D1%86%D0%BA+%D1%83%D0%BB.+%D0%94%D0%B8%D0%BC%D0%B8%D1%82%D1%80%D0%BE%D0%B2%D0%B0+21/',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'МотоСоюз Новокузнецк: в Google Maps карточка филиала по ул. Димитрова, 21 не найдена.'
      }
    ],
    lead_search_checks: {
      maps: {
        yandex_maps: {
          status: 'verified',
          url: 'https://yandex.ru/maps/org/motosoyuz/83103600904/',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'verified',
          identity_evidence: 'МотоСоюз: совпали название, город Новокузнецк и адрес ул. Димитрова, 21.',
          source_id: 'yandex-maps-card',
          website: {
            status: 'not_found_in_checked_sources',
            value: null,
            note: 'В карточке Яндекс Карт поле веб-сайта отсутствует.'
          }
        },
        two_gis: {
          status: 'verified',
          url: 'https://2gis.ru/novokuznetsk/firm/70000001083631233',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'verified',
          identity_evidence: 'МотоСоюз: совпали название, город Новокузнецк и адрес ул. Димитрова, 21.',
          source_id: 'two-gis-card',
          website: {
            status: 'not_found_in_checked_sources',
            value: null,
            note: 'В карточке 2ГИС поле веб-сайта отсутствует.'
          }
        },
        google_maps: {
          status: 'missing',
          url: 'https://www.google.com/maps/search/%D0%9C%D0%BE%D1%82%D0%BE%D0%A1%D0%BE%D1%8E%D0%B7+%D0%9D%D0%BE%D0%B2%D0%BE%D0%BA%D1%83%D0%B7%D0%BD%D0%B5%D1%86%D0%BA+%D1%83%D0%BB.+%D0%94%D0%B8%D0%BC%D0%B8%D1%82%D1%80%D0%BE%D0%B2%D0%B0+21/',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'not_found',
          identity_evidence: 'МотоСоюз: отдельная подтверждённая карточка филиала по ул. Димитрова, 21 в Google Maps не найдена.',
          source_id: 'google-maps-search',
          website: {
            status: 'not_found_in_checked_sources',
            value: null,
            note: 'Карточка не найдена в Google Maps; отсутствие сайта не установлено.'
          }
        }
      },
      telegram: {
        status: 'verified',
        url: 'https://t.me/motosouznvkz',
        kind: 'direct_chat',
        role: 'administrator',
        role_evidence: 'В карточке Яндекс Карт филиала опубликован официальный рабочий контакт Telegram @motosouznvkz (МотоСоюз) для связи с администратором салона.',
        platform: 'yandex_maps',
        source_id: 'yandex-maps-card',
        checked_at: '2026-11-21T23:10:00+03:00'
      }
    }
  },
  {
    slug: 'motorbike-vlg',
    sources: [
      {
        id: 'two-gis-card',
        url: 'https://2gis.ru/volgograd/firm/4644865396794088',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'Моторбайк, Волгоград, ул. Лермонтова, 33. Сайт http://motorbike.ru'
      },
      {
        id: 'yandex-maps-card',
        url: 'https://yandex.ru/maps/org/motosalon_motorbayk/1291955633/',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'Моторбайк, Волгоград, ул. Лермонтова, 33. Официальный Telegram администратора: https://t.me/motorbikeru, сайт http://motorbike.ru/'
      },
      {
        id: 'google-maps-search',
        url: 'https://www.google.com/maps/search/%D0%9C%D0%BE%D1%82%D0%BE%D1%80%D0%B1%D0%B0%D0%B9%D0%BA+%D0%92%D0%BE%D0%BB%D0%B3%D0%BE%D0%B3%D1%80%D0%B0%D0%B4+%D1%83%D0%BB.+%D0%9B%D0%B5%D1%80%D0%BC%D0%BE%D0%BD%D1%82%D0%BE%D0%B2%D0%B0+33/',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'Моторбайк Волгоград: в Google Maps карточка филиала по ул. Лермонтова, 33 не найдена.'
      }
    ],
    lead_search_checks: {
      maps: {
        yandex_maps: {
          status: 'verified',
          url: 'https://yandex.ru/maps/org/motosalon_motorbayk/1291955633/',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'verified',
          identity_evidence: 'Моторбайк: совпали название, город Волгоград и адрес ул. Лермонтова, 33.',
          source_id: 'yandex-maps-card',
          website: {
            status: 'found',
            value: 'http://motorbike.ru/',
            note: 'Открыта ссылка сайта из карточки Яндекс Карт.'
          }
        },
        two_gis: {
          status: 'verified',
          url: 'https://2gis.ru/volgograd/firm/4644865396794088',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'verified',
          identity_evidence: 'Моторбайк: совпали название, город Волгоград и адрес ул. Лермонтова, 33.',
          source_id: 'two-gis-card',
          website: {
            status: 'found',
            value: 'http://motorbike.ru',
            note: 'Открыта ссылка сайта из карточки 2ГИС.'
          }
        },
        google_maps: {
          status: 'missing',
          url: 'https://www.google.com/maps/search/%D0%9C%D0%BE%D1%82%D0%BE%D1%80%D0%B1%D0%B0%D0%B9%D0%BA+%D0%92%D0%BE%D0%BB%D0%B3%D0%BE%D0%B3%D1%80%D0%B0%D0%B4+%D1%83%D0%BB.+%D0%9B%D0%B5%D1%80%D0%BC%D0%BE%D0%BD%D1%82%D0%BE%D0%B2%D0%B0+33/',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'not_found',
          identity_evidence: 'Моторбайк: отдельная подтверждённая карточка филиала по ул. Лермонтова, 33 в Google Maps не найдена.',
          source_id: 'google-maps-search',
          website: {
            status: 'not_found_in_checked_sources',
            value: null,
            note: 'Карточка не найдена в Google Maps; отсутствие сайта не установлено.'
          }
        }
      },
      telegram: {
        status: 'verified',
        url: 'https://t.me/motorbikeru',
        kind: 'direct_chat',
        role: 'administrator',
        role_evidence: 'В карточке Яндекс Карт филиала опубликован официальный рабочий контакт Telegram @motorbikeru (Motorbike.ru) для связи с администратором салона.',
        platform: 'yandex_maps',
        source_id: 'yandex-maps-card',
        checked_at: '2026-11-21T23:10:00+03:00'
      }
    }
  },
  {
    slug: 'motoraion-irk',
    sources: [
      {
        id: 'two-gis-card',
        url: 'https://2gis.ru/irkutsk/firm/70000001059993140',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'Моторайон, Иркутск, ул. Рабочего Штаба, 136. Сайт https://motoraion.ru/'
      },
      {
        id: 'yandex-maps-card',
        url: 'https://yandex.ru/maps/org/motorayon/82364017365/',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'Моторайон, Иркутск, ул. Рабочего Штаба, 136. Официальный Telegram администратора: https://t.me/motoraion38, сайт https://motoraion.ru/'
      },
      {
        id: 'google-maps-search',
        url: 'https://www.google.com/maps/search/%D0%9C%D0%BE%D1%82%D0%BE%D1%80%D0%B0%D0%B9%D0%BE%D0%BD+%D0%98%D1%80%D0%BA%D1%83%D1%82%D1%81%D0%BA+%D1%83%D0%BB.+%D0%A0%D0%B0%D0%B1%D0%BE%D1%87%D0%B5%D0%B3%D0%BE+%D0%A8%D1%82%D0%B0%D0%B1%D0%B0+136/',
        checked_at: '2026-11-21T23:10:00+03:00',
        excerpt: 'Моторайон Иркутск: в Google Maps карточка филиала по ул. Рабочего Штаба, 136 не найдена.'
      }
    ],
    lead_search_checks: {
      maps: {
        yandex_maps: {
          status: 'verified',
          url: 'https://yandex.ru/maps/org/motorayon/82364017365/',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'verified',
          identity_evidence: 'Моторайон: совпали название, город Иркутск и адрес ул. Рабочего Штаба, 136.',
          source_id: 'yandex-maps-card',
          website: {
            status: 'found',
            value: 'https://motoraion.ru/',
            note: 'Открыта ссылка сайта из карточки Яндекс Карт.'
          }
        },
        two_gis: {
          status: 'verified',
          url: 'https://2gis.ru/irkutsk/firm/70000001059993140',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'verified',
          identity_evidence: 'Моторайон: совпали название, город Иркутск и адрес ул. Рабочего Штаба, 136.',
          source_id: 'two-gis-card',
          website: {
            status: 'found',
            value: 'https://motoraion.ru/',
            note: 'Открыта ссылка сайта из карточки 2ГИС.'
          }
        },
        google_maps: {
          status: 'missing',
          url: 'https://www.google.com/maps/search/%D0%9C%D0%BE%D1%82%D0%BE%D1%80%D0%B0%D0%B9%D0%BE%D0%BD+%D0%98%D1%80%D0%BA%D1%83%D1%82%D1%81%D0%BA+%D1%83%D0%BB.+%D0%A0%D0%B0%D0%B1%D0%BE%D1%87%D0%B5%D0%B3%D0%BE+%D0%A8%D1%82%D0%B0%D0%B1%D0%B0+136/',
          checked_at: '2026-11-21T23:10:00+03:00',
          identity_status: 'not_found',
          identity_evidence: 'Моторайон: отдельная подтверждённая карточка филиала по ул. Рабочего Штаба, 136 в Google Maps не найдена.',
          source_id: 'google-maps-search',
          website: {
            status: 'not_found_in_checked_sources',
            value: null,
            note: 'Карточка не найдена в Google Maps; отсутствие сайта не установлено.'
          }
        }
      },
      telegram: {
        status: 'verified',
        url: 'https://t.me/motoraion38',
        kind: 'direct_chat',
        role: 'administrator',
        role_evidence: 'В карточке Яндекс Карт филиала опубликован официальный рабочий контакт Telegram @motoraion38 (МОТОРАЙОН Иркутск) для связи с администратором салона.',
        platform: 'yandex_maps',
        source_id: 'yandex-maps-card',
        checked_at: '2026-11-21T23:10:00+03:00'
      }
    }
  }
];

const FACTS_DIR = path.resolve(__dirname, '../data/facts');

for (const up of updates) {
  const filePath = path.join(FACTS_DIR, `${up.slug}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Merge sources without duplicating ids
  const existingSourceIds = new Set((data.sources || []).map(s => s.id));
  for (const s of up.sources) {
    if (!existingSourceIds.has(s.id)) {
      data.sources.push(s);
      existingSourceIds.add(s.id);
    }
  }

  data.lead_search_checks = up.lead_search_checks;

  const assessment = assessLead(data);
  if (!assessment.eligible) {
    console.error(`FAILED to assess ${up.slug}:`, assessment.reasons);
    process.exit(1);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`[PASS] Updated ${up.slug} -> eligible: true`);
}
