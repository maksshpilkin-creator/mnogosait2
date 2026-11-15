'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const factsDir = path.join(root, 'data', 'facts');
const salesFile = path.join(root, 'sales', 'CALL_STATION.html');
const distStationDir = path.join(root, 'dist', 'station');
const distStationFile = path.join(distStationDir, 'index.html');

if (!fs.existsSync(distStationDir)) {
  fs.mkdirSync(distStationDir, { recursive: true });
}

const factFiles = fs.readdirSync(factsDir).filter(f => f.endsWith('.json'));
const leads = factFiles.map(f => JSON.parse(fs.readFileSync(path.join(factsDir, f), 'utf8')));

// Timezone offset relative to MSK (UTC+3)
const cityOffsets = {
  // MSK (UTC+3)
  'Москва': 0, 'Мытищи': 0, 'Подольск': 0, 'Серпухов': 0, 'Коломна': 0, 'Сергиев Посад': 0,
  'Дмитров': 0, 'Ногинск': 0, 'Одинцово': 0, 'Санкт-Петербург': 0, 'Казань': 0,
  'Нижний Новгород': 0, 'Дзержинск': 0, 'Краснодар': 0, 'Сочи': 0, 'Новороссийск': 0,
  'Анапа': 0, 'Армавир': 0, 'Майкоп': 0, 'Ростов-на-Дону': 0, 'Таганрог': 0,
  'Шахты': 0, 'Волгодонск': 0, 'Ставрополь': 0, 'Пятигорск': 0, 'Минеральные Воды': 0,
  'Воронеж': 0, 'Волгоград': 0, 'Тверь': 0, 'Тула': 0, 'Рязань': 0, 'Ярославль': 0,
  'Киров': 0, 'Пенза': 0, 'Липецк': 0, 'Белгород': 0, 'Старый Оскол': 0, 'Брянск': 0,
  'Смоленск': 0, 'Иваново': 0, 'Владимир': 0, 'Ковров': 0, 'Муром': 0, 'Кострома': 0,
  'Вологда': 0, 'Череповец': 0, 'Петрозаводск': 0, 'Архангельск': 0, 'Мурманск': 0,
  'Сыктывкар': 0, 'Йошкар-Ола': 0, 'Чебоксары': 0, 'Саранск': 0, 'Тамбов': 0,
  'Орёл': 0, 'Курск': 0, 'Великий Новгород': 0,
  // MSK-1 (UTC+2)
  'Калининград': -1,
  // MSK+1 (UTC+4)
  'Самара': 1, 'Тольятти': 1, 'Сызрань': 1, 'Саратов': 1, 'Энгельс': 1, 'Балаково': 1,
  'Ульяновск': 1, 'Астрахань': 1,
  // MSK+2 (UTC+5)
  'Екатеринбург': 2, 'Челябинск': 2, 'Миасс': 2, 'Магнитогорск': 2, 'Каменск-Уральский': 2,
  'Тюмень': 2, 'Пермь': 2, 'Уфа': 2, 'Стерлитамак': 2, 'Салават': 2, 'Нефтекамск': 2,
  'Оренбург': 2, 'Курган': 2, 'Набережные Челны': 2,
  // MSK+3 (UTC+6)
  'Омск': 3,
  // MSK+4 (UTC+7)
  'Новосибирск': 4, 'Красноярск': 4, 'Томск': 4, 'Кемерово': 4, 'Новокузнецк': 4,
  'Барнаул': 4, 'Бийск': 4, 'Абакан': 4,
  // MSK+5 (UTC+8)
  'Иркутск': 5, 'Братск': 5, 'Улан-Удэ': 5,
  // MSK+7 (UTC+10)
  'Хабаровск': 7, 'Владивосток': 7
};

// Sort leads: who is closer to MSK (UTC+3) is higher up (0 first, then +1/-1, +2, +3, +4, +5, +7)
leads.sort((a, b) => {
  const offA = cityOffsets[a.facts.city] ?? 0;
  const offB = cityOffsets[b.facts.city] ?? 0;
  const distA = Math.abs(offA);
  const distB = Math.abs(offB);
  if (distA !== distB) return distA - distB;
  if (offA !== offB) return offA - offB;
  return a.facts.city.localeCompare(b.facts.city, 'ru');
});

const noSiteCount = leads.filter(l => !l.facts.has_website).length;
const hasSiteCount = leads.filter(l => l.facts.has_website).length;

const cardsHtml = leads.map((lead, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  const f = lead.facts;
  const offset = cityOffsets[f.city] ?? 0;
  const offsetLabel = offset === 0 ? 'МСК' : (offset > 0 ? `+${offset} от МСК` : `${offset} от МСК`);
  const absOffset = Math.abs(offset);
  const offsetColor = absOffset >= 5 ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      absOffset >= 3 ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                      absOffset >= 1 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                       'bg-sky-500/20 text-sky-300 border-sky-500/30';

  const modelsSample = lead.catalog.map(c => c.name).slice(0, 2).join(', ');
  const demoUrl = `https://makssaas.gitverse.site/motosalons/${lead.slug}/`;
  const yandexUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(f.name + ' ' + f.city + ' ' + f.address)}`;
  const dgisUrl = `https://2gis.ru/search/${encodeURIComponent(f.name + ' ' + f.city)}`;
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name + ' ' + f.city + ' ' + f.address)}`;
  const hasSite = Boolean(f.has_website);
  const existingHref = f.existing_website
    ? (f.existing_website.startsWith('http') ? f.existing_website : 'https://' + f.existing_website)
    : '';
  const siteBadgeHtml = hasSite
    ? `<div class="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-mono"><span class="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold truncate">🔵 Есть сайт (редизайн)</span>${existingHref ? `<a href="${existingHref}" target="_blank" rel="noopener" class="text-sky-400 hover:underline shrink-0">сайт ↗</a>` : ''}</div>`
    : `<div class="mt-1.5 flex items-center gap-2 text-[11px] font-mono"><span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">🟢 Сайта нет (горячий лид)</span></div>`;

  return `
    <div class="lead-card bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:border-orange-500/50 shadow-md" id="card-${lead.slug}" data-slug="${lead.slug}" data-status="new" data-has-website="${hasSite ? 'yes' : 'no'}" data-search="${f.name.toLowerCase()} ${f.city.toLowerCase()} ${f.address.toLowerCase()} ${f.phone.toLowerCase()}">
      <div>
        <div class="flex items-center justify-between text-xs font-mono mb-2">
          <div class="flex items-center gap-2">
            <span class="text-orange-400 font-bold">#${num} · ${f.city}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${offsetColor}">${offsetLabel}</span>
          </div>
          <span class="text-amber-400 font-bold">★ ${f.rating}</span>
        </div>

        <h3 class="font-extrabold text-base text-white leading-tight">${f.name}</h3>
        ${siteBadgeHtml}
        
        <div class="flex items-center justify-between mt-1.5 text-xs text-slate-400">
          <span class="truncate flex items-center gap-1" title="${f.address}">📍 ${f.address}</span>
          <span class="flex items-center gap-1 shrink-0 ml-2 font-mono text-[10px]">
            <a href="${yandexUrl}" target="_blank" rel="noopener" class="px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500 hover:text-black transition border border-yellow-500/25" title="Яндекс Карты">Яндекс</a>
            <a href="${dgisUrl}" target="_blank" rel="noopener" class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-white transition border border-emerald-500/25" title="2ГИС">2ГИС</a>
            <a href="${googleUrl}" target="_blank" rel="noopener" class="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 hover:bg-blue-500 hover:text-white transition border border-blue-500/25" title="Google Maps">Google</a>
          </span>
        </div>

        <div class="mt-2.5 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
          <div class="flex justify-between items-center text-slate-400">
            <span>График: <strong class="text-slate-300 font-sans">${f.hours}</strong></span>
            <span class="local-time font-bold text-sky-400" data-offset="${offset}">--:--</span>
          </div>
          <div class="text-slate-400 truncate">Модели: <span class="text-slate-200 font-sans">${modelsSample}</span></div>
        </div>

        <!-- Phone & Demo Action Buttons -->
        <div class="mt-3 grid grid-cols-2 gap-2 text-xs font-bold font-mono">
          <a href="tel:${f.phone_raw}" class="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center gap-1.5 transition shadow">
            <span>📞 Позвонить</span>
          </a>
          <a href="${demoUrl}" target="_blank" rel="noopener" class="py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white flex items-center justify-center gap-1.5 transition shadow">
            <span>🌐 Демо-сайт</span>
          </a>
        </div>

        <!-- Telegram / SMS Quick Copy Button -->
        <div class="mt-2">
          <button type="button" class="w-full py-2 px-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 active:scale-95 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition" onclick="copyTelegramMessage('${lead.slug}')">
            <span>📋 Скопировать текст для Telegram / SMS</span>
          </button>
        </div>

        <!-- Call Notes Input -->
        <div class="mt-2.5">
          <input type="text" id="note-${lead.slug}" class="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 font-sans" placeholder="Заметка (имя директора, перезвонить...)" onchange="saveNote('${lead.slug}', this.value)">
        </div>
      </div>

      <!-- Status Footer -->
      <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <label for="select-${lead.slug}" class="text-[10px] font-mono text-slate-500 uppercase">Статус:</label>
        <select id="select-${lead.slug}" class="bg-slate-950 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500 transition font-mono" onchange="updateStatus('${lead.slug}', this.value)">
          <option value="new">⚪ Новый</option>
          <option value="sent">🟡 Скинул в Telegram / SMS</option>
          <option value="call_later">🔵 Перезвонить</option>
          <option value="thinking">🟣 Смотрит демо</option>
          <option value="deal">🟢 СДЕЛКА 15 000 ₽</option>
          <option value="reject">🔴 Отказ / неактуально</option>
        </select>
      </div>
    </div>
  `;
}).join('\n');

const fullHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="robots" content="noindex, nofollow">
  <title>Станция обзвона: ${leads.length} мотосалонов (CRM)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #0B0F14; color: #E2E8F0; -webkit-tap-highlight-color: transparent; }
    .status-deal { border-color: rgba(16, 185, 129, 0.6) !important; background-color: rgba(16, 185, 129, 0.08) !important; }
    .status-sent { border-color: rgba(245, 158, 11, 0.6) !important; background-color: rgba(245, 158, 11, 0.08) !important; }
    .status-call_later { border-color: rgba(59, 130, 246, 0.6) !important; background-color: rgba(59, 130, 246, 0.06) !important; }
    .status-thinking { border-color: rgba(168, 85, 247, 0.6) !important; background-color: rgba(168, 85, 247, 0.06) !important; }
    .status-reject { opacity: 0.45; border-color: rgba(239, 68, 68, 0.3) !important; }
  </style>
</head>
<body class="p-3 sm:p-6 max-w-7xl mx-auto pb-24">

  <!-- Toast Notification -->
  <div id="toast" class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-mono text-xs px-4 py-2.5 rounded-xl shadow-2xl transition-all duration-300 opacity-0 pointer-events-none translate-y-[-10px]">
    Текст скопирован!
  </div>

  <!-- Header -->
  <header class="mb-4 pb-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
    <div>
      <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-xs uppercase mb-1">
        🔥 ВОРКСТЕЙШН ПРОДАЖ · МОТОСАЛОНЫ РФ
      </div>
      <h1 class="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Станция обзвона: ${leads.length} салонов</h1>
      <p class="text-xs text-slate-400 mt-0.5">Прямые звонки, часовые пояса, готовые ссылки и копирование текста в Telegram/SMS.</p>
    </div>

    <!-- Quick Stats & Clock -->
    <div class="flex flex-wrap items-center gap-2.5 bg-slate-900/90 p-2.5 sm:p-3 rounded-2xl border border-slate-800 text-xs font-mono shadow-md w-full sm:w-auto justify-between sm:justify-start">
      <div>
        <span class="text-slate-400 block text-[9px]">БАЗА:</span>
        <span class="text-sm sm:text-base font-bold text-white">${leads.length}</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div>
        <span class="text-slate-400 block text-[9px]">В ТГ/СМС:</span>
        <span id="stat-sent" class="text-sm sm:text-base font-bold text-amber-400">0</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div>
        <span class="text-slate-400 block text-[9px]">ПЕРЕЗВОН:</span>
        <span id="stat-call" class="text-sm sm:text-base font-bold text-sky-400">0</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div>
        <span class="text-slate-400 block text-[9px]">СДЕЛКИ (15k):</span>
        <span id="stat-deal" class="text-sm sm:text-base font-bold text-emerald-400">0</span>
      </div>
      <div class="h-6 w-px bg-slate-800"></div>
      <div>
        <span class="text-slate-400 block text-[9px]">ВРЕМЯ МСК:</span>
        <span id="moscow-clock" class="text-sm sm:text-base font-bold text-orange-400">--:--</span>
      </div>
    </div>
  </header>

  <!-- Mobile Live Search -->
  <div class="mb-3">
    <div class="relative">
      <input type="text" id="live-search" placeholder="🔍 Быстрый поиск: город, название, телефон..." class="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 font-sans shadow-inner" oninput="liveFilter(this.value)">
      <button type="button" onclick="clearSearch()" id="clear-search-btn" class="hidden absolute right-3 top-3 text-slate-500 hover:text-white font-mono text-xs">✕ Очистить</button>
    </div>
  </div>

  <!-- Controls Bar: Script Toggle + Filters -->
  <div class="mb-4 flex flex-col gap-2.5 bg-slate-900/60 p-2.5 sm:p-3 rounded-2xl border border-slate-800/80">
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" onclick="toggleCheatSheet()" class="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shadow">
        <span>📖 Шпаргалка звонящего</span>
      </button>
      <button type="button" onclick="toggleFollowUp()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs font-mono transition flex items-center gap-1.5 border border-slate-700">
        <span>💬 Скрипты дожима</span>
      </button>
      <button type="button" onclick="exportData()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-mono text-xs transition border border-slate-700">
        <span>📥 Экспорт заметок</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-1.5 font-mono text-xs overflow-x-auto pb-1" id="filter-buttons">
      <button type="button" onclick="setFilter('all', this)" class="filter-btn active px-2.5 py-1 rounded-lg bg-white/10 text-white font-bold">Все (${leads.length})</button>
      <button type="button" onclick="setFilter('no_site', this)" class="filter-btn px-2.5 py-1 rounded-lg text-emerald-300 hover:text-white border border-emerald-500/30">Без сайта (${noSiteCount})</button>
      <button type="button" onclick="setFilter('has_site', this)" class="filter-btn px-2.5 py-1 rounded-lg text-sky-300 hover:text-white border border-sky-500/30">Редизайн (${hasSiteCount})</button>
      <button type="button" onclick="setFilter('new', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-white">Новые</button>
      <button type="button" onclick="setFilter('sent', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-amber-400">В ТГ/СМС</button>
      <button type="button" onclick="setFilter('call_later', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-sky-400">Перезвонить</button>
      <button type="button" onclick="setFilter('deal', this)" class="filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-emerald-400">Сделки</button>
    </div>
  </div>

  <!-- Collapsible Cheat Sheet: Objections and Calling Script -->
  <div id="cheatsheet" class="hidden mb-4 p-4 sm:p-5 bg-slate-900 border border-orange-500/40 rounded-2xl shadow-2xl text-xs space-y-4">
    <div class="flex items-center justify-between pb-3 border-b border-slate-800">
      <h2 class="text-sm font-extrabold text-orange-400 uppercase tracking-wider font-mono">🎯 Живой скрипт звонка (с упором на продукт и боль)</h2>
      <button type="button" onclick="toggleCheatSheet()" class="text-slate-400 hover:text-white font-mono text-xs">✕ Закрыть</button>
    </div>

    <div class="bg-slate-950/90 p-4 rounded-xl border border-emerald-500/30 space-y-2.5">
      <h3 class="font-bold text-xs uppercase font-mono text-emerald-300">🔥 Основной разговорный сценарий (20 секунд):</h3>
      <p class="text-slate-200 leading-relaxed font-sans text-sm">
        «— Алло, привет! Это <strong>[Название]</strong>?<br>
        — Слушай, я Максим. Наткнулся на вас на картах в <strong>[Городе]</strong> — салон отличный, отзывы огонь, техника на складе есть, а своего сайта нет вообще.<br>
        А народ сейчас мотики выбирает чисто с телефона. Если цен и наличия сразу не видно — звонить выспрашивать лень, они закрывают вкладку и уходят к конкурентам. Это минус сотня-полторы с продажи.<br>
        <strong>Сразу скажу: я не предлагаю «сделать вам сайт» — это долгая возня. У нас есть готовый продукт — мобильная витрина наличия. Мы уже запустили такую штуку ребятам в соседних городах — клиенты перестали сливаться.</strong><br>
        Я взял и собрал такую витрину конкретно под ваш салон, с вашей техникой. Денег не прошу, она уже работает. <strong>Куда в Телеграм скинуть ссылку глянуть за полминуты с телефона?</strong>»
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
        <h3 class="font-bold text-xs uppercase font-mono text-emerald-300">💰 «Сколько стоит-то?»:</h3>
        <p class="text-slate-300 leading-relaxed font-sans">
          <em>«Да нисколько, глянуть бесплатно. Если потом захотите забрать на свой домен — от 15 000 ₽. Один питбайк продадите — витрина уже окупилась раз пять. Но сначала просто зацените, как сделано. В Телеграм кинуть?»</em>
        </p>
      </div>

      <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
        <h3 class="font-bold text-xs uppercase font-mono text-amber-300">📍 «Нам хватает карт / Авито»:</h3>
        <p class="text-slate-300 leading-relaxed font-sans">
          <em>«На картах и Авито под вашими фотками крутится реклама конкурентов. А на витрине — только ваши байки, цены и кнопка звонка. Человек за 5 секунд видит, что техника в наличии, и не уходит. Глянете в ТГ?»</em>
        </p>
      </div>

      <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
        <h3 class="font-bold text-xs uppercase font-mono text-rose-300">🤨 «В чём подвох? Зачем бесплатно?»:</h3>
        <p class="text-slate-300 leading-relaxed font-sans">
          <em>«Никакого подвоха. Я разработчик (@devbymax), собираю портфолио именно по мотобизнесу. Мне — готовый рабочий кейс, вам — готовая витрина на халяву оценить. Не понравится — просто закроете. Кидаю в ТГ?»</em>
        </p>
      </div>
    </div>
  </div>

  <!-- Collapsible Follow-up Templates -->
  <div id="followup" class="hidden mb-4 p-4 sm:p-5 bg-slate-900 border border-sky-500/40 rounded-2xl shadow-2xl text-xs space-y-4">
    <div class="flex items-center justify-between pb-3 border-b border-slate-800">
      <h2 class="text-sm font-extrabold text-sky-400 uppercase tracking-wider font-mono">💬 Скрипты дожима (Telegram / SMS)</h2>
      <button type="button" onclick="toggleFollowUp()" class="text-slate-400 hover:text-white font-mono text-xs">✕ Закрыть</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
        <h3 class="font-bold text-emerald-300 font-mono">📅 День 2 (на следующий день):</h3>
        <p class="text-slate-300 leading-relaxed font-sans">
          <em>«Привет! Вчера скидывал ссылку на готовую витрину для [Название]. Удалось глянуть с телефона? Интересно ваше мнение 🙂»</em>
        </p>
      </div>

      <div class="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30 space-y-2">
        <h3 class="font-bold text-amber-300 font-mono">📅 День 3 (финальный):</h3>
        <p class="text-slate-300 leading-relaxed font-sans">
          <em>«Коротко напомню — выше ссылка на готовую витрину [Название]. Если сейчас неактуально — черкните «нет», не буду отвлекать. Если интересно, но пока заняты — напишите «позже», свяжемся через неделю 👍»</em>
        </p>
      </div>
    </div>
  </div>

  <!-- Leads Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4" id="cards-container">
    ${cardsHtml}
  </div>

  <script>
    const leadsData = ${JSON.stringify(leads.map(l => ({
      slug: l.slug,
      name: l.facts.name,
      city: l.facts.city,
      address: l.facts.address,
      phone: l.facts.phone,
      hasWebsite: Boolean(l.facts.has_website),
      existingWebsite: l.facts.existing_website || '',
      catalog: l.catalog.slice(0, 2).map(c => c.name + ' (' + c.price + ')').join(', ')
    })), null, 2)};

    const STORAGE_KEY = 'motosalon_crm_statuses_v2';
    const NOTES_KEY = 'motosalon_crm_notes_v2';

    function getStatuses() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e) { return {}; }
    }

    function saveStatuses(data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function getNotes() {
      try { return JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; } catch(e) { return {}; }
    }

    function saveNote(slug, text) {
      const notes = getNotes();
      notes[slug] = text;
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    }

    function updateStatus(slug, status) {
      const statuses = getStatuses();
      statuses[slug] = status;
      saveStatuses(statuses);
      applyCardColor(slug, status);
      updateStats();
    }

    function applyCardColor(slug, status) {
      const card = document.getElementById('card-' + slug);
      if (!card) return;
      card.dataset.status = status;
      card.classList.remove('status-deal', 'status-sent', 'status-call_later', 'status-thinking', 'status-reject');
      if (status !== 'new') card.classList.add('status-' + status);
    }

    function updateStats() {
      const statuses = getStatuses();
      let sent = 0, call = 0, deal = 0;
      for (const slug in statuses) {
        if (statuses[slug] === 'sent') sent++;
        if (statuses[slug] === 'call_later') call++;
        if (statuses[slug] === 'deal') deal++;
      }
      document.getElementById('stat-sent').textContent = sent;
      document.getElementById('stat-call').textContent = call;
      document.getElementById('stat-deal').textContent = deal;
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
      setTimeout(() => {
        t.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-10px]');
      }, 2500);
    }

    function copyTelegramMessage(slug) {
      const lead = leadsData.find(l => l.slug === slug);
      if (!lead) return;
      const demoUrl = 'https://makssaas.gitverse.site/motosalons/' + lead.slug + '/';
      const text = lead.hasWebsite
        ? 'Привет! Это Максим, только что созванивались по поводу «' + lead.name + '» (' + lead.city + ').\\n\\n' +
          'Вот ссылка на альтернативную мобильную витрину под ваш салон:\\n👉 ' + demoUrl + '\\n\\n' +
          '📱 Откройте с телефона: за 5 секунд открывается каталог с ценами «от», кнопка прямого звонка и маршрут к вам. Чтобы клиенты с мобильных не уходили к конкурентам.\\n\\n' +
          'Денег не прошу, посмотрите в свободную минуту! Будут вопросы — пишите прямо сюда 👍'
        : 'Привет! Это Максим, только что созванивались по поводу «' + lead.name + '» (' + lead.city + ').\\n\\n' +
          'Вот готовая мобильная витрина под ваш салон:\\n👉 ' + demoUrl + '\\n\\n' +
          '📱 Откройте именно с телефона:\\n' +
          '1. Каталог моделей с ценами «от» (' + lead.catalog + ')\\n' +
          '2. Яндекс Карта с точным маршрутом к вашим дверям\\n' +
          '3. Кнопка звонка в 1 клик прямо под пальцем\\n\\n' +
          'Это не долгий сайт, а готовый инструмент быстрого захвата клиентов с мобилок. Посмотрите в свободную минуту — бесплатно и ни к чему не обязывает. Будут вопросы — пишите сюда! 👍';

      navigator.clipboard.writeText(text).then(() => {
        showToast('✓ Текст для Telegram / SMS скопирован!');
      }).catch(() => {
        prompt('Скопируйте текст:', text);
      });
    }

    function toggleCheatSheet() {
      document.getElementById('cheatsheet').classList.toggle('hidden');
    }

    function toggleFollowUp() {
      document.getElementById('followup').classList.toggle('hidden');
    }

    let currentFilter = 'all';

    function setFilter(status, btn) {
      currentFilter = status;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'bg-white/10', 'text-white', 'font-bold'));
      if (btn) {
        btn.classList.add('active', 'bg-white/10', 'text-white', 'font-bold');
      }
      applyFilters();
    }

    function liveFilter(val) {
      const clearBtn = document.getElementById('clear-search-btn');
      if (val && val.trim().length > 0) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
      applyFilters();
    }

    function clearSearch() {
      const input = document.getElementById('live-search');
      input.value = '';
      document.getElementById('clear-search-btn').classList.add('hidden');
      applyFilters();
    }

    function applyFilters() {
      const searchVal = (document.getElementById('live-search').value || '').trim().toLowerCase();
      document.querySelectorAll('.lead-card').forEach(card => {
        let matchStatus = true;
        if (currentFilter === 'all') {
          matchStatus = true;
        } else if (currentFilter === 'no_site') {
          matchStatus = (card.dataset.hasWebsite === 'no');
        } else if (currentFilter === 'has_site') {
          matchStatus = (card.dataset.hasWebsite === 'yes');
        } else {
          matchStatus = ((card.dataset.status || 'new') === currentFilter);
        }

        let matchSearch = true;
        if (searchVal.length > 0) {
          const cardText = card.dataset.search || '';
          matchSearch = cardText.includes(searchVal);
        }

        if (matchStatus && matchSearch) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }

    function exportData() {
      const statuses = getStatuses();
      const notes = getNotes();
      const rows = [['Номер', 'Slug', 'Название', 'Город', 'Телефон', 'Статус', 'Заметка']];
      leadsData.forEach((l, i) => {
        rows.push([
          i + 1,
          l.slug,
          '"' + l.name + '"',
          '"' + l.city + '"',
          '"' + l.phone + '"',
          statuses[l.slug] || 'new',
          '"' + (notes[l.slug] || '').replace(/"/g, '""') + '"'
        ]);
      });
      const csv = '\\uFEFF' + rows.map(r => r.join(';')).join('\\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'motosalon_calls_' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
    }

    function updateLiveClocks() {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const mskTime = new Date(utc + (3600000 * 3));
      
      const formatTime = (d) => {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
      };

      const mskEl = document.getElementById('moscow-clock');
      if (mskEl) mskEl.textContent = formatTime(mskTime);

      document.querySelectorAll('.local-time[data-offset]').forEach(el => {
        const offset = parseInt(el.getAttribute('data-offset'), 10);
        const local = new Date(mskTime.getTime() + (offset * 3600000));
        el.textContent = 'Местное: ' + formatTime(local);
      });
    }

    document.addEventListener('DOMContentLoaded', () => {
      const statuses = getStatuses();
      const notes = getNotes();

      for (const slug in statuses) {
        const select = document.getElementById('select-' + slug);
        if (select) {
          select.value = statuses[slug];
          applyCardColor(slug, statuses[slug]);
        }
      }

      for (const slug in notes) {
        const input = document.getElementById('note-' + slug);
        if (input) input.value = notes[slug];
      }

      updateStats();
      updateLiveClocks();
      setInterval(updateLiveClocks, 10000);
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(salesFile, fullHtml, 'utf8');
fs.writeFileSync(distStationFile, fullHtml, 'utf8');

console.log(`CALL_STATION.html успешно собран для ${leads.length} мотосалонов (${noSiteCount} без сайта, ${hasSiteCount} с сайтом):`);
console.log(`- Локальный: ${salesFile}`);
console.log(`- Публичный (мобильный): ${distStationFile}`);
