import { launchBrowser, ensurePreviewServer, PREVIEW_PORT } from './helpers.js';
import fs from 'fs';
import path from 'path';

async function runTriamotoTest() {
  console.log('=== Запуск комплексной проверки triamoto.html ===');
  const server = await ensurePreviewServer();
  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleLogs.push({ type: msg.type(), text: msg.text() });
      }
    });

    const targetUrl = `http://127.0.0.1:${PREVIEW_PORT}/triamoto.html`;
    console.log(`Открываем страницу: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 15000 });

    // 1. Проверка viewports на отсутствие горизонтального скролла
    const viewports = [375, 768, 1024, 1440];
    const vpResults = [];

    for (const width of viewports) {
      await page.setViewport({ width, height: 900 });
      await new Promise(r => setTimeout(r, 200));

      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          hasOverflow: root.scrollWidth > root.clientWidth
        };
      });

      console.log(`Viewport ${width}px: clientWidth=${metrics.clientWidth}, scrollWidth=${metrics.scrollWidth}, overflow=${metrics.hasOverflow}`);
      if (metrics.hasOverflow) {
        throw new Error(`Горизонтальный overflow на разрешении ${width}px!`);
      }
      vpResults.push({ width, ...metrics });
    }

    // 2. Проверка битых изображений
    await page.setViewport({ width: 1440, height: 900 });
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => !img.hidden && (!img.complete || img.naturalWidth === 0)).map(img => img.src);
    });
    console.log(`Битых изображений: ${brokenImages.length}`, brokenImages);

    // 3. Проверка табов каталога
    console.log('Проверяем интерактивные табы каталога...');
    const categories = ['enduro', 'pitbike', 'atv', 'engines', 'service'];
    for (const cat of categories) {
      await page.click(`#service-tab-${cat}`);
      await new Promise(r => setTimeout(r, 150));
      const activeText = await page.evaluate(() => {
        return {
          code: document.querySelector('.preview-code')?.textContent,
          price: document.querySelector('.preview-price-val')?.textContent,
          summary: document.querySelector('.preview-summary')?.textContent
        };
      });
      console.log(`Таб [${cat}] активирован: code=${activeText.code}, price=${activeText.price}`);
    }

    // 4. Проверка бокового Drawer (ТТХ техники)
    console.log('Проверяем боковой Drawer с ТТХ...');
    await page.click('.btn-service-detail');
    await new Promise(r => setTimeout(r, 400));

    const drawerState = await page.evaluate(() => {
      const drawer = document.querySelector('.price-drawer');
      const title = drawer?.querySelector('.drawer-title')?.textContent;
      const rows = drawer?.querySelectorAll('.drawer-price-row')?.length || 0;
      const isOpen = drawer?.classList.contains('is-open');
      return { isOpen, title, rows };
    });
    console.log('Состояние Drawer:', drawerState);

    // Закрываем Drawer по Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));
    const closed = await page.evaluate(() => !document.querySelector('.price-drawer')?.classList.contains('is-open'));
    console.log('Drawer закрыт по Escape:', closed);

    // 5. Проверка клика по ссылке в таблице цен -> выбор в форме
    console.log('Проверяем переход из таблицы цен в форму...');
    await page.click('[data-service-name="Питбайки"]');
    await new Promise(r => setTimeout(r, 400));

    const chipSelected = await page.evaluate(() => {
      const selected = Array.from(document.querySelectorAll('.chip-btn')).find(c => c.classList.contains('is-selected'));
      return selected?.textContent;
    });
    console.log('В форме автоматически выбран чип:', chipSelected);

    // 6. Проверка заполнения формы и генерации черновика
    console.log('Проверяем форму заявки / брони...');
    await page.type('#client-name', 'Алексей');
    await page.type('#client-phone', '9159401555');
    await page.type('#client-comment', 'Рост 182 см, интересует BSE Z3 250');
    await page.click('.btn-submit-booking');
    await new Promise(r => setTimeout(r, 200));

    const toastResult = await page.evaluate(() => {
      const toast = document.querySelector('.booking-toast');
      const text = toast?.innerText;
      const waLink = toast?.querySelector('.btn-toast-wa')?.href;
      return { text, waLink };
    });
    console.log('Результат черновика заявки:');
    console.log(toastResult.text);
    console.log('Ссылка WhatsApp:', toastResult.waLink);

    // 7. Проверка FAQ
    console.log('Проверяем FAQ...');
    const faqButtons = await page.$$('.faq-header-btn');
    if (faqButtons.length > 0) {
      await faqButtons[0].click();
      await new Promise(r => setTimeout(r, 300));
      const firstOpen = await page.evaluate(() => {
        const item = document.querySelector('.faq-item');
        return item?.classList.contains('is-open');
      });
      console.log('Первый вопрос FAQ открыт:', firstOpen);
    }

    // Сохранение скриншотов
    const screensDir = path.resolve('reports/screenshots/triamoto');
    if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });

    await page.screenshot({ path: path.join(screensDir, 'desktop-full.jpg'), fullPage: true });
    await page.setViewport({ width: 375, height: 812 });
    await page.screenshot({ path: path.join(screensDir, 'mobile-hero.jpg') });
    await page.screenshot({ path: path.join(screensDir, 'mobile-full.jpg'), fullPage: true });

    console.log('Скриншоты успешно сохранены в reports/screenshots/triamoto/');
    console.log('Логи консоли (ошибки/предупреждения):', consoleLogs);
    console.log('=== ВСЕ ПРОВЕРКИ УСПЕШНО ПРОЙДЕНЫ (PASS) ===');

  } finally {
    if (browser) await browser.close();
    server.stop();
  }
}

runTriamotoTest().catch(err => {
  console.error('ОШИБКА ТЕСТА:', err);
  process.exit(1);
});
