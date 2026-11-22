const { assessLead } = require('../scripts/lead-search-policy');

const testLead = {
  slug: "extreme-sport-penza",
  identity_status: "verified",
  facts: {
    name: "ЭКСТРИМ Sport",
    city: "Пенза",
    address: "ул. Ладожская, 38/2"
  },
  sources: [
    {
      id: "two-gis-card",
      url: "https://2gis.ru/penza/firm/70000001066028415",
      checked_at: "2026-11-21T19:49:00+03:00",
      excerpt: "ЭКСТРИМ Sport, Пенза, ул. Ладожская, 38/2. Сайт http://экстрим58.рф. Официальный Telegram администратора: https://t.me/Exsport58"
    },
    {
      id: "yandex-maps-card",
      url: "https://yandex.ru/maps/org/ekstrim_sport/1262648115/",
      checked_at: "2026-11-21T19:49:00+03:00",
      excerpt: "Экстрим Sport, Пенза, Ладожская ул., 38/2. Рейтинг 4.8. Сайт: http://экстрим58.рф"
    },
    {
      id: "google-maps-search",
      url: "https://www.google.com/maps/search/%D0%AD%D0%BA%D1%81%D1%82%D1%80%D0%B8%D0%BC+Sport+%D0%9F%D0%B5%D0%BD%D0%B7%D0%B0+%D1%83%D0%BB.+%D0%9B%D0%B0%D0%B4%D0%BE%D0%B6%D1%81%D0%BA%D0%B0%D1%8F+38%2F2/",
      checked_at: "2026-11-21T19:49:00+03:00",
      excerpt: "ЭКСТРИМ Sport Пенза: в Google Maps отдельная подтверждённая карточка филиала по ул. Ладожская, 38/2 не найдена."
    }
  ],
  lead_search_checks: {
    maps: {
      yandex_maps: {
        status: "verified",
        url: "https://yandex.ru/maps/org/ekstrim_sport/1262648115/",
        checked_at: "2026-11-21T19:49:00+03:00",
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
        checked_at: "2026-11-21T19:49:00+03:00",
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
        checked_at: "2026-11-21T19:49:00+03:00",
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
      checked_at: "2026-11-21T19:49:00+03:00"
    }
  }
};

const res = assessLead(testLead);
console.log(JSON.stringify(res, null, 2));
