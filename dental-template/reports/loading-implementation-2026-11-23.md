# «ЭМАЛЬ»: скорость появления страницы и фирменная заставка

Дата: 23.11.2026. Исполнитель: site_developer. Работа поверх принятой визуальной доводки, без её отката.

## Устранённые причины

1. Видимые изображения передавались большими PNG. Созданы уменьшенные WebP-копии тех же изображений, изменены ссылки в HTML, активных CSS и JSON услуг. Исходные PNG сохранены без редактирования.
2. Прежний observer начинал opacity0/полную маску уже внутри viewport; это выглядело как подгрузка. Новый observer предзапускает короткое раскрытие за420px. Уже видимые и сфокусированные элементы сразу получают конечное состояние. Входящее при быстрой прокрутке раскрытие отменяется до следующей отрисовки; базовые стили всегда полностью читаемы.
3. Прежний поздний fonts.ready мог повторно скрыть уже показанный hero. Hero choreography теперь разрешена только после реального ready первой заставки, при верхней позиции страницы и отсутствии якоря/взаимодействия. Повторный вход, timeout/error и поздние fonts/decode не перезапускают скрывающий reveal.

## Изображения: размеры файлов

| Файл | PNG, байт | WebP, байт | Размер доставки |
| --- | ---: | ---: | --- |
| mirror-satin | 2 509 235 | 140 554 | 1200×900 |
| braces-satin | 1 952 305 | 67 470 | 1200×900 |
| service-implant-satin-v1 | 2 358 256 | 130 744 | 1200×900 |
| hero-gradient-layer-v1 | 1 336 213 | 28 060 | 1600×800 |
| hero-implant-layer-v1 | 871 072 | 66 450 | 520×1040, alpha |
| Всего | **9 027 081** | **433 278** | **−95,20%** |

Кодирование: уже установленный Pillow через `C:/Users/makss/AppData/Local/Python/pythoncore-3.14-64/python.exe`, воспроизводимый скрипт `scripts/optimize-assets.py`. Это масштабирование и кодирование, не новая генерация и не изменение содержания. WebP хранятся в `public/assets/images/optimized/`. Прозрачность импланта сохранена. Градиент — quality94 для сохранения плавных переходов; иллюстрации — quality88/90.

Локальный variable TTF371616байт сохранён; fontTools отсутствует, новых пакетов не ставили. Добавлен preload того же URL, что использует CSS. Основные hero-изображения тоже preload/high. Их суммарный размер вместе со шрифтом по файлам снизился с2578901 до466126байт; это сравнение активов, не измерение всего network transfer или времени загрузки.

Три уникальные иллюстрации услуг прогреваются последовательно с low priority после ожидания первого экрана, в idle callback. Hidden drawer больше не содержит src до реального открытия. Картинки ниже первого экрана используют lazy/async; width/height заданы явно, существующие CSS aspect ratios и fallback сохранены.

Прежние PNG остаются в public/dist как исходные архивные активы, но активные HTML/CSS/JSON их не запрашивают. Физический размер всей папки dist не сократился на95%: сокращены используемые браузером файлы.

## Заставка

Декоративная чёрная заставка «ЭМАЛЬ» с небольшим циановым акцентом показывается один раз на сессию этого origin. Она не вводит фальшивый прогресс и не имеет минимальной длительности.

Реальное ожидание: только hero-gradient, hero-implant и загрузка отображаемого шрифта. Readiness/error снимает заставку сразу. Отдельный inline bootstrap снимает её не позже1800ms от запуска даже при ошибке/недоступности внешнего модуля. Модульное ожидание ограничено1700ms. При ограниченном sessionStorage, reduced motion, отсутствии WAAPI, якоре, scroll restore, скрытой вкладке или повторном входе заставка пропускается.

Страница никогда не получает hidden/inert или блокировку прокрутки. Overlay pointer-events:none, aria-hidden:true. Tab/клавиша, указатель, колесо, touch, focus или scroll сразу отпускают заставку и не подавляют событие. BFCache pageshow persisted тоже завершает её. Без JavaScript overlay остаётся hidden, основной HTML читаем.

Диагностика без пользовательских данных: на html `data-intro-state` (active/ready/error/timeout/skip/interaction/restored), `data-intro-shown`, `data-intro-elapsed`, `data-service-images`; у hero `data-entrance-state`, у наблюдаемых секций `data-reveal-state`. Технические подписи в UI не добавлялись.

## Файлы

- `index.html`: preload, самостоятельный bootstrap и критические стили заставки, оптимизированные src, размеры изображений, lazy/async, отсутствие начального src скрытого drawer.
- `src/modules/loading.js`: ограниченная готовность, обработка load/error/decode, последовательное прогревание.
- `src/modules/services.js`: нормализованный URL сравнивается с текущим src; старт галереи не переназначает тот же файл из HTML повторно и не инициирует ненужную повторную загрузку/проверку кэша.
- `src/modules/motion.js`: guard/pre-observer/settle для ниже-экрана, устранение позднего fonts reveal; hero/gallery/circle/scroll scenes и pause/reduced сохранены.
- `src/main.js`: согласование loading→motion и fallback для изображения без src.
- `src/styles/site.css`, `src/styles/motion.css`, `src/data/clinic.json`: URL WebP.
- `scripts/optimize-assets.py`, `public/assets/images/optimized/*`, `tests/test-loading.js`, штатный `dist/`.

## Реально выполненные проверки

- Node syntax: main.js, loading.js, motion.js — успешны.
- `node tests/test-loading.js` — PASS. Выполняются реальные inline bootstrap, readiness/image helpers и initMotion/observer: первый/повторный вход, getItem/setItem throws раздельно, error/timeout, отсутствие минимального ожидания, reduced/no animate, якорь/scroll/hidden, ввод/фокус, BFCache, cached/error/late decode, поздние fonts, ранний reveal и немедленная отмена при входе в viewport.
- `node tests/test-motion-preview.js` — PASS.
- `node tests/test-scroll-scenes.js` — PASS.
- `npm.cmd run build` — успешно. Финальная сборка после узкого same-src guard: `index-BubZqYRb.css`, `index-DEP1-MK0.js`. Все три Node/VM-проверки и syntax services.js повторно прошли после этого изменения.

Исполнитель браузером не управлял: визуально исполнителем не проверено. Root отдельно проверяет реальный browser rendering, медленную отдачу hero/font и отказ module через собственные локальные QA-серверы; независимый business_verifier читает финальный код. Этот отчёт не подменяет их результаты. Puppeteer suites не запускались.

После передачи первичной сборки исходники и dist заморожены на браузерный проход. Реальная отправка формы и публикация не выполнялись; demo/noindex сохранены.
