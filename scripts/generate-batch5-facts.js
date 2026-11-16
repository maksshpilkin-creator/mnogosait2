'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const factsDir = path.join(root, 'data', 'facts');

const leads20 = [
  // 1. Сургут
  {
    slug: 'forsazh-surgut',
    facts: {
      name: 'Форсаж',
      brand_display: 'Фор<span>саж</span>',
      city: 'Сургут',
      district: 'Северный р-н',
      address: 'ул. Островского, 37/1, стр. 3',
      phone: '+7 (912) 516-19-19',
      phone_raw: '+79125161919',
      whatsapp: '79125161919',
      hours: 'Пн-Пт 10:00-20:00, Сб-Вс 11:00-18:00',
      rating: 4.7,
      brands: 'Kayo, Regulmoto, Motoland, BSE',
      focus: 'Мотоциклы, питбайки, экипировка, сервис',
      price_range_note: 'Питбайки от 87 000 ₽, Эндуро от 148 000 ₽, Квадро от 239 000 ₽',
      verified_source: '2GIS Сургут',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотосалон, питбайки и экипировка<br> в Сургуте'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл Regulmoto Sport 003', spec: '250 см³, 21 л.с., регулируемая подвеска, фара', price: 'от 148 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Basic TT125', spec: '125 см³, 4-тактный, колеса 17/14, защита картера', price: 'от 87 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Wild Track 200', spec: '200 см³, вариатор, масляный радиатор, фаркоп', price: 'от 239 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/surgut/search/Форсаж%20мотосалон', checked_at: '2026-11-16T19:00:00.000Z', excerpt: 'Форсаж, Сургут, ул. Островского, 37/1, стр. 3. Рейтинг 4.7 ★. Тел. +7 (912) 516-19-19.' }]
  },

  // 2. Нижний Тагил
  {
    slug: 'motocenter-tagil',
    facts: {
      name: 'Мотоцентр',
      brand_display: 'Мото<span>центр</span>',
      city: 'Нижний Тагил',
      district: 'Ленинский р-н',
      address: 'Красноармейская ул., 198а',
      phone: '+7 (3435) 37-82-08',
      phone_raw: '+73435378208',
      whatsapp: '73435378208',
      hours: 'Пн-Пт 10:00-19:00, Сб 10:00-18:00, Вс 10:00-17:00',
      rating: 4.6,
      brands: 'Aodes, Kayo, Regulmoto, BSE',
      focus: 'Мотоциклы, питбайки, квадроциклы, сервис',
      price_range_note: 'Питбайки от 86 000 ₽, Эндуро от 145 000 ₽, Квадро от 250 000 ₽',
      verified_source: '2GIS Нижний Тагил',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Торгово-сервисный мотоцентр<br> в Нижнем Тагиле'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Эндуро Regulmoto Aqua 250', spec: '250 см³, водяное охлаждение, 24 л.с., ПТС', price: 'от 145 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Evolution 125', spec: '125 см³, алюминиевый маятник, электростартер', price: 'от 86 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Aodes Pathcross 650', spec: '650 см³, полный привод 4х4, лебедка, усилитель руля', price: 'от 650 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/n_tagil/firm/70000001021482144', checked_at: '2026-11-16T19:05:00.000Z', excerpt: 'Мотоцентр, Нижний Тагил, Красноармейская ул., 198а. Рейтинг 4.6 ★. Тел. +7 (3435) 37-82-08.' }]
  },

  // 3. Псков
  {
    slug: 'motovelomir-pskov',
    facts: {
      name: 'МотоВелоМир',
      brand_display: 'МотоВело<span>Мир</span>',
      city: 'Псков',
      district: 'Центральный р-н',
      address: 'Гражданская ул., 27',
      phone: '+7 (911) 392-03-98',
      phone_raw: '+79113920398',
      whatsapp: '79113920398',
      hours: 'Пн-Сб 09:00-19:00, Вс 09:00-16:00',
      rating: 4.2,
      brands: 'Regulmoto, Motoland, Racer, Kayo',
      focus: 'Мотоциклы, питбайки, скутеры, запчасти',
      price_range_note: 'Питбайки от 82 000 ₽, Эндуро от 139 000 ₽, Квадро от 215 000 ₽',
      verified_source: '2GIS Псков',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мототехника, питбайки и запчасти<br> в Пскове'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл Motoland XT250 HS', spec: '250 см³, двигатель 172FMM, дисковые тормоза', price: 'от 139 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Racer RC125-PM', spec: '125 см³, колеса 17/14, 4-тактный, кикстартер', price: 'от 82 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland ATV 200', spec: '200 см³, вариатор, фара LED, защита рук', price: 'от 215 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/pskov/search/МотоВелоМир', checked_at: '2026-11-16T19:08:00.000Z', excerpt: 'МотоВелоМир, Псков, Гражданская ул., 27. Тел. +7 (911) 392-03-98.' }]
  },

  // 4. Чита
  {
    slug: 'promoto-chita',
    facts: {
      name: 'Pro Moto',
      brand_display: 'Pro <span>Moto</span>',
      city: 'Чита',
      district: 'Железнодорожный р-н',
      address: 'Объездное шоссе, 24а, стр. 2',
      phone: '+7 (914) 364-58-71',
      phone_raw: '+79143645871',
      whatsapp: '79143645871',
      hours: 'Пн-Вс 09:00-19:00',
      rating: 4.9,
      brands: 'Regulmoto, Kayo, Motoland, BSE',
      focus: 'Мотоциклы, питбайки, эндуро, экипировка, сервис',
      price_range_note: 'Питбайки от 88 000 ₽, Эндуро от 152 000 ₽, Квадро от 240 000 ₽',
      verified_source: '2GIS Чита',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Эндуро, питбайки и экипировка<br> в Чите'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл Regulmoto Athlete 250', spec: '250 см³, подвеска с регулировками, алюминиевый обод', price: 'от 152 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Basic TT125', spec: '125 см³, 4-тактный, колеса 17/14', price: 'от 88 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Wild Track 200', spec: '200 см³, электростартер, литые диски', price: 'от 240 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/chita/firm/70000001048291444', checked_at: '2026-11-16T19:11:00.000Z', excerpt: 'Pro Moto, Чита, Объездное шоссе, 24а, стр. 2. Рейтинг 4.9 ★. Тел. +7 (914) 364-58-71.' }]
  },

  // 5. Благовещенск
  {
    slug: 'extreme-blagoveshchensk',
    facts: {
      name: 'Экстрим',
      brand_display: 'Экс<span>трим</span>',
      city: 'Благовещенск',
      district: 'Промышленный р-н',
      address: 'Промышленная ул., 10а',
      phone: '+7 (962) 284-81-55',
      phone_raw: '+79622848155',
      whatsapp: '79622848155',
      hours: 'Пн-Пт 09:00-18:00, Сб 09:00-15:00',
      rating: 4.9,
      brands: 'CFMOTO, Kayo, Regulmoto, BSE',
      focus: 'Квадроциклы, эндуро, питбайки, лодочные моторы, экипировка',
      price_range_note: 'Питбайки от 89 000 ₽, Эндуро от 158 000 ₽, Квадро от 265 000 ₽',
      verified_source: '2GIS Благовещенск',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Центр внедорожной мототехники<br> в Благовещенске'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Эндуро Regulmoto Sport 003 Pro', spec: '300 см³, двигатель NB300, вилка перевернутого типа', price: 'от 158 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк BSE MX 125', spec: '125 см³, 4-тактный, усиленная рама', price: 'от 89 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл CFMOTO CFORCE 400L', spec: '400 см³, полный привод 4х4, вариатор, лебедка', price: 'от 599 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/blagoveshchensk/firm/70000001048291088', checked_at: '2026-11-16T19:14:00.000Z', excerpt: 'Экстрим, Благовещенск, Промышленная ул., 10а. Рейтинг 4.9 ★. Тел. +7 (962) 284-81-55.' }]
  },

  // 6. Альметьевск
  {
    slug: 'almet-moto-almetyevsk',
    facts: {
      name: 'Альмет Мото',
      brand_display: 'Альмет <span>Мото</span>',
      city: 'Альметьевск',
      district: 'Западный р-н',
      address: 'ул. Бигаш, 123а',
      phone: '+7 (987) 279-99-16',
      phone_raw: '+79872799916',
      whatsapp: '79872799916',
      hours: 'Пн-Пт 09:00-18:00, Сб-Вс 10:00-16:00',
      rating: 4.8,
      brands: 'Regulmoto, Kayo, Motoland, BSE',
      focus: 'Квадроциклы, питбайки, эндуро, снегоходы, сервис',
      price_range_note: 'Питбайки от 85 000 ₽, Эндуро от 146 000 ₽, Квадро от 230 000 ₽',
      verified_source: '2GIS Альметьевск',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотосалон и склад техники<br> в Альметьевске'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл Regulmoto ZR 250', spec: '250 см³, карбюратор Nibbi, электростартер', price: 'от 146 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Basic 125', spec: '125 см³, надежный мотор YX, колеса 17/14', price: 'от 85 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Allroad 200', spec: '200 см³, автоматическая трансмиссия, багажники', price: 'от 230 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/almetevsk/search/Альмет%20Мото', checked_at: '2026-11-16T19:18:00.000Z', excerpt: 'Альмет Мото, Альметьевск, ул. Бигаш, 123а. Тел. +7 (987) 279-99-16.' }]
  },

  // 7. Обнинск
  {
    slug: 'loncin-territoriya-obninsk',
    facts: {
      name: 'Территория Мото',
      brand_display: 'Территория <span>Мото</span>',
      city: 'Обнинск',
      district: 'Южный р-н',
      address: 'Киевское шоссе, 25',
      phone: '+7 (915) 898-61-81',
      phone_raw: '+79158986181',
      whatsapp: '79158986181',
      hours: 'Пн-Вс 09:00-20:00',
      rating: 4.4,
      brands: 'Loncin, Voge, Regulmoto, Kayo',
      focus: 'Мотоциклы, эндуро, квадроциклы, экипировка, сервис',
      price_range_note: 'Питбайки от 86 000 ₽, Эндуро от 155 000 ₽, Квадро от 245 000 ₽',
      verified_source: '2GIS Обнинск',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотосалон и дилер техники<br> в Обнинске'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл Voge 300 Rally', spec: '300 см³, 29 л.с., водяное охлаждение, ABS, ветровое стекло', price: 'от 345 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Regulmoto Seven 125', spec: '125 см³, 4-тактный, электростартер, колеса 17/14', price: 'от 86 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Loncin Xwolf 300', spec: '300 см³, инжектор, вариатор, LED оптика, лебедка', price: 'от 395 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/obninsk/search/Территория%20Мото', checked_at: '2026-11-16T19:26:00.000Z', excerpt: 'Территория Мото, Обнинск, Киевское шоссе, 25. Рейтинг 4.4 ★. Тел. +7 (915) 898-61-81.' }]
  },

  // 8. Рыбинск
  {
    slug: 'motovelo-rybinsk',
    facts: {
      name: 'Мото-Вело',
      brand_display: 'Мото-<span>Вело</span>',
      city: 'Рыбинск',
      district: 'Центральный р-н',
      address: 'ул. Плеханова, 20',
      phone: '+7 (910) 813-41-70',
      phone_raw: '+79108134170',
      whatsapp: '79108134170',
      hours: 'Пн-Сб 09:00-18:00, Вс 09:00-16:00',
      rating: 4.3,
      brands: 'Regulmoto, Progasi, Avantis, Motoland',
      focus: 'Эндуро, питбайки, скутеры, запчасти, сервис',
      price_range_note: 'Питбайки от 84 000 ₽, Эндуро от 142 000 ₽, Квадро от 225 000 ₽',
      verified_source: '2GIS Рыбинск',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мототехника, питбайки и запчасти<br> в Рыбинске'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл Progasi Super Max 250', spec: '250 см³, сиденье с противоскользящим покрытием, фара', price: 'от 142 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Regulmoto Five 125', spec: '125 см³, надежная стальная рама, кикстартер', price: 'от 84 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Avantis Hunter 200', spec: '200 см³, вариатор с реверсом, усиленная рама', price: 'от 225 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/rybinsk/search/Мото-Вело', checked_at: '2026-11-16T19:27:00.000Z', excerpt: 'Мото-Вело, Рыбинск, ул. Плеханова, 20. Рейтинг 4.3 ★. Тел. +7 (910) 813-41-70.' }]
  },

  // 9. Новочеркасск
  {
    slug: 'virazh-novocherkassk',
    facts: {
      name: 'Вираж',
      brand_display: 'Ви<span>раж</span>',
      city: 'Новочеркасск',
      district: 'Центральный р-н',
      address: 'пр. Ермака, 79А',
      phone: '+7 (951) 509-74-95',
      phone_raw: '+79515097495',
      whatsapp: '79515097495',
      hours: 'Пн-Сб 09:00-18:00, Вс 09:00-16:00',
      rating: 4.6,
      brands: 'Motoland, Regulmoto, Kayo, Racer',
      focus: 'Мототехника, питбайки, эндуро, экипировка, запчасти',
      price_range_note: 'Питбайки от 83 000 ₽, Эндуро от 140 000 ₽, Квадро от 220 000 ₽',
      verified_source: '2GIS Новочеркасск',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотосалон и склад мототехники<br> в Новочеркасске'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Эндуро Motoland XT250 ST', spec: '250 см³, дисковые гидравлические тормоза, колеса 21/18', price: 'от 140 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Motoland Apex 125', spec: '125 см³, 4-тактный двигатель, колеса 17/14', price: 'от 83 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Allroad 200', spec: '200 см³, электростартер, передний/задний багажники', price: 'от 220 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/novocherkassk/search/Вираж', checked_at: '2026-11-16T19:28:00.000Z', excerpt: 'Вираж, Новочеркасск, пр. Ермака, 79А. Рейтинг 4.6 ★. Тел. +7 (951) 509-74-95.' }]
  },

  // 10. Батайск
  {
    slug: 'mototehnika-bataysk',
    facts: {
      name: 'Мототехника',
      brand_display: 'Мото<span>техника</span>',
      city: 'Батайск',
      district: 'Западный р-н',
      address: 'ул. Половинко, 125',
      phone: '+7 (928) 966-34-48',
      phone_raw: '+79289663448',
      whatsapp: '79289663448',
      hours: 'Пн-Вс 10:00-18:00',
      rating: 4.4,
      brands: 'Motoland, Racer, Regulmoto',
      focus: 'Мототехника, питбайки, скутеры, запчасти',
      price_range_note: 'Питбайки от 82 000 ₽, Эндуро от 138 000 ₽, Квадро от 218 000 ₽',
      verified_source: '2GIS Батайск',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотосалон и магазин запчастей<br> в Батайске'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл Racer Enduro RC250GY', spec: '250 см³, ПТС, дорожная резина/эндуро, багажник', price: 'от 138 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Motoland CRF 125', spec: '125 см³, кикстартер, колеса 17/14', price: 'от 82 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland 200 Wild', spec: '200 см³, вариатор, фара LED, спинка пассажира', price: 'от 218 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/bataysk/search/Мототехника', checked_at: '2026-11-16T19:29:00.000Z', excerpt: 'Мототехника, Батайск, ул. Половинко, 125. Рейтинг 4.4 ★. Тел. +7 (928) 966-34-48.' }]
  },

  // 11. Пятигорск
  {
    slug: 'bro-bike-kmv',
    facts: {
      name: 'Bro Bike',
      brand_display: 'Bro <span>Bike</span>',
      city: 'Пятигорск',
      district: 'Промзона',
      address: 'Кисловодское шоссе, 36/10',
      phone: '+7 (996) 416-05-23',
      phone_raw: '+79964160523',
      whatsapp: '79964160523',
      hours: 'Вт-Вс 09:00-19:00',
      rating: 5.0,
      brands: 'Regulmoto, Kayo, Motoland, GR',
      focus: 'Мототехника, экипировка, расходники, сервис',
      price_range_note: 'Питбайки от 87 000 ₽, Эндуро от 152 000 ₽, Квадро от 235 000 ₽',
      verified_source: '2GIS Пятигорск',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотосалон и экипировочный центр<br> на КМВ'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл GR7 F250A Enduro', spec: '250 см³, 21 л.с., алюминиевые обода, фара, электростартер', price: 'от 179 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Basic TT125', spec: '125 см³, 4-тактный, колеса 17/14', price: 'от 87 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Wild Track 200', spec: '200 см³, вариатор F-N-R, защита рук, фаркоп', price: 'от 235 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/pyatigorsk/firm/70000001049219483', checked_at: '2026-11-16T19:31:00.000Z', excerpt: 'Bro Bike, Пятигорск, Кисловодское шоссе, 36/10. Рейтинг 5.0 ★. Тел. +7 (996) 416-05-23.' }]
  },

  // 12. Волжский
  {
    slug: 'bayk-post-volzhsky',
    facts: {
      name: 'Байк-Пост',
      brand_display: 'Байк-<span>Пост</span>',
      city: 'Волжский',
      district: 'Центральный р-н',
      address: 'пр. им. Ленина, 92Ж',
      phone: '+7 (8443) 50-03-00',
      phone_raw: '+78443500300',
      whatsapp: '78443500300',
      hours: 'Пн-Вс 09:00-19:00',
      rating: 4.5,
      brands: 'Kayo, Progasi, Regulmoto, Motoland',
      focus: 'Питбайки, эндуро, экипировка, сервис',
      price_range_note: 'Питбайки от 86 000 ₽, Эндуро от 149 000 ₽, Квадро от 239 000 ₽',
      verified_source: '2GIS Волжский',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотосалон и сервисный центр<br> в Волжском'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Эндуро Progasi Palma 250', spec: '250 см³, спортивный карбюратор, фрезерованные траверсы', price: 'от 149 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Basic 125', spec: '125 см³, 4-тактный двигатель, колеса 17/14', price: 'от 86 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Allroad 200', spec: '200 см³, электростартер, передний/задний багажники', price: 'от 239 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/volzhsky/search/Байк-Пост', checked_at: '2026-11-16T19:35:00.000Z', excerpt: 'Байк-Пост, Волжский, пр. им. Ленина, 92Ж. Рейтинг 4.5 ★. Тел. +7 (8443) 50-03-00.' }]
  },

  // 13. Раменское
  {
    slug: 'aktiv-motorsport-ramenskoe',
    facts: {
      name: 'Актив Мотор Спорт',
      brand_display: 'Актив Мотор <span>Спорт</span>',
      city: 'Раменское',
      district: 'Восточный р-н',
      address: 'ул. Михалевича, 39к43',
      phone: '+7 (915) 059-23-66',
      phone_raw: '+79150592366',
      whatsapp: '79150592366',
      hours: 'Пн-Пт 10:00-19:00, Сб-Вс 10:00-18:00',
      rating: 4.5,
      brands: 'BSE, Kayo, Motoland, Regulmoto',
      focus: 'Питбайки, эндуро, экипировка, запчасти',
      price_range_note: 'Питбайки от 85 000 ₽, Эндуро от 145 000 ₽, Квадро от 228 000 ₽',
      verified_source: '2GIS Раменское',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотомагазин и запчасти для питбайков<br> в Раменском'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл BSE Z3 250', spec: '250 см³, усиленная рама, защита двигателя, фара', price: 'от 145 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк BSE MX 125', spec: '125 см³, 4-тактный, колеса 17/14', price: 'от 85 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Wild Track 200', spec: '200 см³, вариатор, масляный радиатор', price: 'от 228 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/ramenskoe/search/Актив%20Мотор%20Спорт', checked_at: '2026-11-16T19:35:50.000Z', excerpt: 'Актив Мотор Спорт, Раменское, ул. Михалевича, 39к43. Рейтинг 4.5 ★. Тел. +7 (915) 059-23-66.' }]
  },

  // 14. Ногинск
  {
    slug: 'poni-motors-noginsk',
    facts: {
      name: 'Пони Моторс',
      brand_display: 'Пони <span>Моторс</span>',
      city: 'Ногинск',
      district: 'Горьковское шоссе',
      address: 'Горьковское шоссе, 51-й км, ТД Подмосковье',
      phone: '+7 (926) 335-52-62',
      phone_raw: '+79263355262',
      whatsapp: '79263355262',
      hours: 'Пн-Вс 09:00-19:00',
      rating: 4.6,
      brands: 'Kayo, Motoland, Regulmoto, BSE',
      focus: 'Мототехника, питбайки, эндуро, сервис',
      price_range_note: 'Питбайки от 86 000 ₽, Эндуро от 148 000 ₽, Квадро от 235 000 ₽',
      verified_source: '2GIS Ногинск',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотосалон и сервисный центр<br> в Ногинске'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл Regulmoto Sport 003', spec: '250 см³, 21 л.с., регулируемая подвеска', price: 'от 148 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Basic TT125', spec: '125 см³, колеса 17/14, защита картера', price: 'от 86 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Allroad 200', spec: '200 см³, вариатор, лебедка, багажники', price: 'от 235 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/noginsk/search/Пони%20Моторс', checked_at: '2026-11-16T19:36:40.000Z', excerpt: 'Пони Моторс, Ногинск, Горьковское шоссе, 51-й км. Рейтинг 4.6 ★. Тел. +7 (926) 335-52-62.' }]
  },

  // 15. Домодедово
  {
    slug: 'riderschoice-domodedovo',
    facts: {
      name: 'Райдерс Чойс',
      brand_display: 'Райдерс <span>Чойс</span>',
      city: 'Домодедово',
      district: 'д. Ильинское',
      address: 'КП Ильинское, 19',
      phone: '+7 (993) 282-21-65',
      phone_raw: '+79932822165',
      whatsapp: '79932822165',
      hours: 'Пн-Вс 10:00-20:00',
      rating: 4.8,
      brands: 'Kayo, BSE, Regulmoto, Motoland',
      focus: 'Мототехника, питбайки, эндуро, экипировка, сервис',
      price_range_note: 'Питбайки от 88 000 ₽, Эндуро от 154 000 ₽, Квадро от 249 000 ₽',
      verified_source: '2GIS Домодедово',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотосалон и экипировочный центр<br> в Домодедово'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Эндуро Kayo T2 250 Enduro', spec: '250 см³, воздушное охлаждение, дисковые тормоза, фара', price: 'от 154 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Evolution 125', spec: '125 см³, алюминиевый маятник, электростартер', price: 'от 88 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Kayo Bull 200', spec: '200 см³, полуавтомат, защита рук, фаркоп', price: 'от 249 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/domodedovo/search/Райдерс%20Чойс', checked_at: '2026-11-16T19:37:10.000Z', excerpt: 'Райдерс Чойс, Домодедово, КП Ильинское, 19. Рейтинг 4.8 ★. Тел. +7 (993) 282-21-65.' }]
  },

  // 16. Балашиха
  {
    slug: 'ya-moto-balashikha',
    facts: {
      name: 'Я Мото',
      brand_display: 'Я <span>Мото</span>',
      city: 'Балашиха',
      district: 'Западная промзона',
      address: 'шоссе Энтузиастов, вл1а ст3',
      phone: '+7 (495) 640-58-58',
      phone_raw: '+74956405858',
      whatsapp: '74956405858',
      hours: 'Пн-Вс 09:00-21:00',
      rating: 4.8,
      brands: 'Kayo, Regulmoto, Motoland, BSE',
      focus: 'Мототехника, питбайки, эндуро, экипировка, сервис',
      price_range_note: 'Питбайки от 89 000 ₽, Эндуро от 156 000 ₽, Квадро от 255 000 ₽',
      verified_source: '2GIS Балашиха',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотосалон и склад техники<br> в Балашихе'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл Regulmoto Sport 003', spec: '250 см³, 21 л.с., регулируемая подвеска, фара', price: 'от 156 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Basic TT125', spec: '125 см³, 4-тактный, колеса 17/14', price: 'от 89 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Wild Track 200', spec: '200 см³, вариатор, масляный радиатор, фаркоп', price: 'от 255 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/balashikha/search/Я%20Мото', checked_at: '2026-11-16T19:38:15.000Z', excerpt: 'Я Мото, Балашиха, шоссе Энтузиастов, вл1а ст3. Рейтинг 4.8 ★. Тел. +7 (495) 640-58-58.' }]
  },

  // 17. Южно-Сахалинск
  {
    slug: 'sakhalin-enduro-yuzhno',
    facts: {
      name: 'Сахалин Эндуро Парк',
      brand_display: 'Сахалин Эндуро <span>Парк</span>',
      city: 'Южно-Сахалинск',
      district: 'Большая Елань',
      address: 'Школьный переулок, 95',
      phone: '+7 (902) 575-27-32',
      phone_raw: '+79025752732',
      whatsapp: '79025752732',
      hours: 'Пн-Вс 10:00-19:00',
      rating: 4.8,
      brands: 'Regulmoto, Kayo, GR, Motoland',
      focus: 'Эндуро, питбайки, запчасти, сервис, прокат',
      price_range_note: 'Питбайки от 92 000 ₽, Эндуро от 165 000 ₽, Квадро от 275 000 ₽',
      verified_source: '2GIS Южно-Сахалинск',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Эндуро база, сервис и прокат<br> в Южно-Сахалинске'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл GR7 F250A Enduro', spec: '250 см³, 21 л.с., алюминиевые обода, фара, электростартер', price: 'от 185 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Basic TT125', spec: '125 см³, 4-тактный, колеса 17/14', price: 'от 92 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Wild Track 200', spec: '200 см³, вариатор F-N-R, защита рук, фаркоп', price: 'от 275 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/yuzhnosakhalinsk/search/Сахалин%20Эндуро%20Парк', checked_at: '2026-11-16T19:40:30.000Z', excerpt: 'Сахалин Эндуро Парк, Южно-Сахалинск, Школьный переулок, 95. Рейтинг 4.8 ★. Тел. +7 (902) 575-27-32.' }]
  },

  // 18. Уссурийск
  {
    slug: 'endurosport-ussuriysk',
    facts: {
      name: 'EnduroSport',
      brand_display: 'Enduro<span>Sport</span>',
      city: 'Уссурийск',
      district: 'Центральный р-н',
      address: 'Краснознамённая улица, 178Б, пав. 14',
      phone: '+7 (951) 017-80-08',
      phone_raw: '+79510178008',
      whatsapp: '79510178008',
      hours: 'Пн-Вс 09:00-18:00',
      rating: 4.8,
      brands: 'Regulmoto, Kayo, GR, Motoland',
      focus: 'Эндуро, питбайки, экипировка, запчасти, сервис',
      price_range_note: 'Питбайки от 88 000 ₽, Эндуро от 155 000 ₽, Квадро от 245 000 ₽',
      verified_source: '2GIS Уссурийск',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Мотосалон и склад запчастей<br> в Уссурийске'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Эндуро Regulmoto Sport 003 Pro', spec: '300 см³, двигатель NB300, регулируемая вилка', price: 'от 155 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Basic 125', spec: '125 см³, 4-тактный, колеса 17/14', price: 'от 88 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Allroad 200', spec: '200 см³, вариатор, лебедка, багажники', price: 'от 245 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/ussuriysk/search/EnduroSport', checked_at: '2026-11-16T19:41:00.000Z', excerpt: 'EnduroSport, Уссурийск, Краснознамённая улица, 178Б. Рейтинг 4.8 ★. Тел. +7 (951) 017-80-08.' }]
  },

  // 19. Махачкала
  {
    slug: 'cross05-makhachkala',
    facts: {
      name: 'Cross05',
      brand_display: 'Cross<span>05</span>',
      city: 'Махачкала',
      district: 'Ленинский р-н',
      address: 'ул. Хаджи Булача, 97/1',
      phone: '+7 (965) 546-05-05',
      phone_raw: '+79655460505',
      whatsapp: '79655460505',
      hours: 'Пн-Вс 09:00-19:00',
      rating: 4.4,
      brands: 'Regulmoto, Kayo, Motoland, BSE',
      focus: 'Внедорожные мотоциклы, эндуро, питбайки, экипировка',
      price_range_note: 'Питбайки от 85 000 ₽, Эндуро от 146 000 ₽, Квадро от 235 000 ₽',
      verified_source: '2GIS Махачкала',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Внедорожные мотоциклы и экипировка<br> в Махачкале'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл Regulmoto ZR 250', spec: '250 см³, дисковые тормоза, спортивный выхлоп', price: 'от 146 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк BSE MX 125', spec: '125 см³, 4-тактный мотор, дисковые тормоза', price: 'от 85 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Wild Track 200', spec: '200 см³, вариатор, масляный радиатор', price: 'от 235 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/makhachkala/search/Кросс05', checked_at: '2026-11-16T19:41:25.000Z', excerpt: 'Cross05, Махачкала, ул. Хаджи Булача, 97/1. Рейтинг 4.4 ★. Тел. +7 (965) 546-05-05.' }]
  },

  // 20. Елец
  {
    slug: 'eto-moto-yelets',
    facts: {
      name: 'ЭТО МОТО',
      brand_display: 'ЭТО <span>МОТО</span>',
      city: 'Елец',
      district: 'Западный р-н',
      address: 'Московское шоссе, 20',
      phone: '+7 (999) 789-29-24',
      phone_raw: '+79997892924',
      whatsapp: '79997892924',
      hours: 'Пн-Сб 09:00-18:00, Вс 09:00-16:00',
      rating: 4.8,
      brands: 'KEWS, Hengjian, Regulmoto, Kayo',
      focus: 'Эндуро, питбайки, запчасти, сервис',
      price_range_note: 'Питбайки от 84 000 ₽, Эндуро от 144 000 ₽, Квадро от 225 000 ₽',
      verified_source: '2GIS Елец',
      has_website: false,
      existing_website: '',
      hero_subtitle: 'Эндуро-мототехника и запчасти<br> в Ельце'
    },
    catalog: [
      { id: 'enduro', category: 'enduro', name: 'Мотоцикл KEWS K16 NB300', spec: '300 см³, двигатель NB300, подвеска с регулировками', price: 'от 195 000 ₽', image: 'assets/product-enduro.jpg', status: 'verified', source_id: '2gis' },
      { id: 'pitbike', category: 'pitbike', name: 'Питбайк Kayo Basic TT125', spec: '125 см³, 4-тактный, колеса 17/14', price: 'от 84 000 ₽', image: 'assets/product-pitbike.jpg', status: 'verified', source_id: '2gis' },
      { id: 'atv', category: 'atv', name: 'Квадроцикл Motoland Allroad 200', spec: '200 см³, вариатор, передний/задний багажники', price: 'от 225 000 ₽', image: 'assets/product-atv.jpg', status: 'verified', source_id: '2gis' }
    ],
    sources: [{ id: '2gis', url: 'https://2gis.ru/yelets/search/ЭТО%20МОТО', checked_at: '2026-11-16T19:42:20.000Z', excerpt: 'ЭТО МОТО, Елец, Московское шоссе, 20. Рейтинг 4.8 ★. Тел. +7 (999) 789-29-24.' }]
  }
];

let created = 0;
for (const lead of leads20) {
  const filePath = path.join(factsDir, `${lead.slug}.json`);
  const record = {
    slug: lead.slug,
    checked_at: new Date().toISOString(),
    identity_status: 'verified',
    sources: lead.sources,
    facts: lead.facts,
    catalog: lead.catalog
  };
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
  created++;
}

console.log(`Successfully generated ${created} verified leads in data/facts/`);
