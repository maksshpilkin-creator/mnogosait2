# Отчёт о работе локального парсера 2ГИС и строгой фильтрации лидов

**Дата прогона:** 21.11.2026
**Политика отбора:** sales/LEAD_SEARCH_RULES.md (контракт v2026-11-20)
**География сбора:** 15 крупнейших городов РФ (Москва, Санкт-Петербург, Новосибирск, Екатеринбург, Казань, Краснодар, Самара, Нижний Новгород, Уфа, Ростов-на-Дону, Воронеж, Пермь, Красноярск, Тюмень, Челябинск)
**Целевые рубрики:** Мотосалоны, Мототехника, Квадроциклы, Снегоходы, Питбайки / Эндуро

---

## 1. Сводная статистика сбора и фильтрации

| Показатель | Значение | Доля от базы |
|---|---|---|
| **Всего уникальных организаций спарсено** | **888** | 100% |
| Найдена ссылка официального сайта | 723 | 81.4% |
| Сайт в карточке отсутствует (`no_website`) | 165 | 18.6% |
| Обнаружены ссылки на Telegram | 555 | 62.5% |
| **Прошли строгий фильтр (прямой чат администратора/владельца)** | **113** | **12.7%** |

> [!NOTE]
> Строгий фильтр отсекает все Telegram-каналы (включая ссылки с broadcast, /s/, /c/, invite), ботов (*bot) и телефонные хэши (t.me/+7...). Принимаются исключительно верифицированные прямые рабочие аккаунты администраторов и владельцев мотосалонов.

---

## 2. Статистика по городам

| Город | Всего спарсено | С сайтом | Без сайта | С Telegram | Прошли строгий фильтр (Qualified) |
|---|---|---|---|---|---|
| Москва | 76 | 70 | 6 | 53 | **17** |
| Санкт-Петербург | 66 | 62 | 4 | 44 | **7** |
| Новосибирск | 57 | 48 | 9 | 35 | **7** |
| Екатеринбург | 58 | 49 | 9 | 38 | **11** |
| Казань | 56 | 40 | 16 | 42 | **9** |
| Краснодар | 60 | 50 | 10 | 47 | **8** |
| Самара | 55 | 44 | 11 | 37 | **8** |
| Нижний Новгород | 55 | 45 | 10 | 35 | **5** |
| Уфа | 63 | 45 | 18 | 36 | **7** |
| Ростов-на-Дону | 58 | 45 | 13 | 24 | **5** |
| Воронеж | 56 | 45 | 11 | 28 | **4** |
| Пермь | 56 | 45 | 11 | 29 | **9** |
| Красноярск | 56 | 46 | 10 | 41 | **8** |
| Тюмень | 57 | 46 | 11 | 38 | **5** |
| Челябинск | 59 | 43 | 16 | 28 | **3** |

---

## 3. Топ отобранных мотосалонов, готовых для загрузки в CRM-станцию

| № | Салон | Город | Фактический адрес | Сайт | Прямой Telegram | Роль / Подпись | Карточка 2ГИС |
|---|---|---|---|---|---|---|---|
| 1 | **Автомаг, магазин-мотосалон** | Москва | Южнопортовая улица, 22 к1 | — | [@amag_ru](https://t.me/amag_ru) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/4504127908551484) |
| 2 | **Автомаг, магазин автозапчастей** | Москва | Тимирязевская улица, 2/3 | [Сайт](http://amag.ru/shops/avtomag-na-dmitrovskoy) | [@amag_ru](https://t.me/amag_ru) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001022130984) |
| 3 | **ДрайвБайк, мотомагазин** | Москва | 5-я Кабельная улица, 2 ст1 | [Сайт](http://drivebike.ru) | [@drivebike_manager](https://t.me/drivebike_manager) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001035555563) |
| 4 | **ES Transit, компания по продаже автомобилей с аукционов Японии, Китая и Южной Кореи** | Москва | Тюменский проезд, 5 ст2 | [Сайт](http://estransit.ru) | [@estransits](https://t.me/estransits) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001104573042) |
| 5 | **КвадроБаза, интернет-магазин мототехники** | Москва | проезд Добролюбова, 3 ст1 | [Сайт](http://kvadrobaza.ru) | [@startmagshop](https://t.me/startmagshop) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001049118280) |
| 6 | **Автомаг, магазин автозапчастей** | Москва | Уржумская улица, 7 | [Сайт](http://amag.ru/shops/avtomag-v-sviblovo) | [@amag_ru](https://t.me/amag_ru) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/4504127908551489) |
| 7 | **Вилли Моторс, мотосалон и мотосервис** | Москва | Нижегородская улица, 32 ст10 | [Сайт](http://wheeliemotors.ru) | [@wheeliemotorsmoscow](https://t.me/wheeliemotorsmoscow) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001099297869) |
| 8 | **ЯмалМото, магазин техники для активного отдыха** | Москва | Смольная улица, 63Б к1 | [Сайт](http://xn--80awbcka1a2h.xn--p1ai) | [@yamalmotozakaz](https://t.me/yamalmotozakaz) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001109780119) |
| 9 | **Moto85, магазин мотоэкипировки для мотокросса и эндуро** | Москва | улица Петра Романова, 6 | [Сайт](http://moto85.ru) | [@moto85_ru](https://t.me/moto85_ru) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001020297066) |
| 10 | **Smotra-moto-shop.ru, интернет-магазин** | Москва | улица Сергия Радонежского, 15-17 ст12 | [Сайт](http://smotra-moto-shop.ru) | [@smotramotoshop](https://t.me/smotramotoshop) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001024931440) |
| 11 | **Motomo, мотосалон** | Москва | 5-я Кабельная улица, 2 ст1 | [Сайт](http://motomo.ru) | [@motomoru](https://t.me/motomoru) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001042048951) |
| 12 | **NavinAuto** | Москва | Пресненская набережная, 8 ст1 | [Сайт](http://navinauto.ru) | [@navinauto_admin](https://t.me/navinauto_admin) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001099072108) |
| 13 | **Мото-хобби, магазин мотозапчастей** | Москва | Загородное шоссе, 15 к1 | [Сайт](http://moto-hobby.ru) | [@moto_hobby_mx](https://t.me/moto_hobby_mx) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/4504127916497330) |
| 14 | **Твойгараж.ру, официальный дилер CFMoto** | Москва | деревня Ближние Прудищи, вл1 ст1 | [Сайт](http://tvoygaraj.ru/catalog) | [@tvoygaraj1](https://t.me/tvoygaraj1) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001027765778) |
| 15 | **Pitland, магазин питбайков и экипировки** | Москва | Западная улица, ст60 | [Сайт](http://pitland.ru) | [@pitland_n1](https://t.me/pitland_n1) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001114774783) |
| 16 | **CarsKorea, компания по продаже автомобилей из Южной Кореи** | Москва | Автозаводская улица, 23а к2 | [Сайт](http://carskorea.shop) | [@carskoreasupport](https://t.me/carskoreasupport) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001082532472) |
| 17 | **Халк Мото** | Москва | Вятская улица, 47 ст6 | [Сайт](http://hulkmoto.ru) | [@hulkmoto](https://t.me/hulkmoto) | `administrator` | [2ГИС](https://2gis.ru/moscow/firm/70000001115915423) |
| 18 | **Акб энерго, пункт выдачи заказов** | Санкт-Петербург | Якорная улица, 3 | [Сайт](http://akbenergo.ru) | [@akbenergo](https://t.me/akbenergo) | `administrator` | [2ГИС](https://2gis.ru/spb/firm/70000001006518488) |
| 19 | **Артмото гараж** | Санкт-Петербург | Тамбовская улица, 11 | [Сайт](http://artmotogarage.ru) | [@artmotogaragespb](https://t.me/artmotogaragespb) | `administrator` | [2ГИС](https://2gis.ru/spb/firm/70000001104917675) |
| 20 | **Сервисмото** | Санкт-Петербург | улица Ватутина, 17 лит Ж | [Сайт](http://xn--b1afkqkajgem.xn--p1ai) | [@servismotospb](https://t.me/servismotospb) | `administrator` | [2ГИС](https://2gis.ru/spb/firm/70000001031455607) |
| 21 | **CarsKorea, компания по привозу автомобилей из Южной Кореи** | Санкт-Петербург | улица Седова, 11 | [Сайт](http://carskorea.shop) | [@carskoreasupport](https://t.me/carskoreasupport) | `administrator` | [2ГИС](https://2gis.ru/spb/firm/70000001087741115) |
| 22 | **Bvdshop, магазин мототехники и электротранспорта** | Санкт-Петербург | Свердловская набережная, 60 | [Сайт](http://spb.bvdshop.ru) | [@bvdshop_kvadromoto](https://t.me/bvdshop_kvadromoto) | `administrator` | [2ГИС](https://2gis.ru/spb/firm/70000001027524855) |
| 23 | **Алексмоторс, мотосалон** | Санкт-Петербург | Московское шоссе, 9а | [Сайт](http://alexmotorsspb.ru) | [@Alexmotors_Servic](https://t.me/Alexmotors_Servic) | `administrator` | [2ГИС](https://2gis.ru/spb/firm/5348553838650821) |
| 24 | **NaMotike.ru, центр проката и аренды техники для активного отдыха** | Санкт-Петербург | Зубровник, 3 | [Сайт](http://namotike.ru) | [@namotike](https://t.me/namotike) | `administrator` | [2ГИС](https://2gis.ru/spb/firm/70000001022396288) |
| 25 | **АКВАТОРИКА, магазин лодочных моторов, запчастей и лодок** | Новосибирск | улица Богдана Хмельницкого, 1/1 | [Сайт](http://akvazip.com) | [@akvatorika54](https://t.me/akvatorika54) | `administrator` | [2ГИС](https://2gis.ru/novosibirsk/firm/70000001031324399) |
| 26 | **Специализированный сервисный центр, представитель BMW** | Новосибирск | Большевистская улица, 177/1 | — | [@priemkasm](https://t.me/priemkasm) | `administrator` | [2ГИС](https://2gis.ru/novosibirsk/firm/70000001019225771) |
| 27 | **Сиб эндуро, пункт проката эндуро-мотоциклов и питбайков** | Новосибирск | Адрес филиала в 2ГИС | [Сайт](http://sib-enduro.ru) | [@sibenduro54](https://t.me/sibenduro54) | `administrator` | [2ГИС](https://2gis.ru/novosibirsk/firm/70000001081125694) |
| 28 | **НБСмотор, торговая компания** | Новосибирск | Пролетарская улица, 271/5 | [Сайт](http://nbsmotor.ru) | [@nbsmotornsk](https://t.me/nbsmotornsk) | `administrator` | [2ГИС](https://2gis.ru/novosibirsk/firm/141265769356466) |
| 29 | **Enduro Life, центр проката эндуро-мотоциклов и снегоходов** | Новосибирск | Инская улица, 2а | [Сайт](http://endurolifensk.ru) | [@enduro_lifensk](https://t.me/enduro_lifensk) | `administrator` | [2ГИС](https://2gis.ru/novosibirsk/firm/70000001061261565) |
| 30 | **Мото Фабрика, магазин мототехники, экипировки и сервиса** | Новосибирск | Красный проспект, 184 | [Сайт](http://www.moto-fabrika.ru) | [@motofabrika_nsk](https://t.me/motofabrika_nsk) | `administrator` | [2ГИС](https://2gis.ru/novosibirsk/firm/70000001080268090) |

---

## 4. Файлы результатов

- **Полная сырая выгрузка:** `data/parsed_2gis/raw_all_cities.json`
- **Строгая квалифицированная база (JSON):** `data/parsed_2gis/qualified_two_gis_leads.json`
- **Таблица для CRM-станции (CSV с BOM):** `data/parsed_2gis/qualified_two_gis_leads.csv`
- **Технический скрипт валидации:** `scripts/verify-qualified-leads.js` (пройдено 100% тестов)
