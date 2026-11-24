import { launchBrowser, ensurePreviewServer, PREVIEW_PORT } from '../tests/helpers.js';
import fs from 'fs';
import path from 'path';

async function runHumanDesignAudit() {
  console.log('====================================================');
  console.log('🎨 ЗАПУСК ЧЕЛОВЕЧЕСКОГО ДИЗАЙН-АУДИТА (TRIAMOTO.HTML)');
  console.log('Методология: Impeccable Design Critic + Anti-Slop');
  console.log('====================================================\n');

  const server = await ensurePreviewServer();
  let browser;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    const outputDir = path.resolve('reports/screenshots/design-audit');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const auditFindings = {
      timestamp: new Date().toISOString(),
      url: `http://127.0.0.1:${PREVIEW_PORT}/triamoto.html`,
      viewports: {},
      heroAboveFold: {},
      tapTargetsMobile: [],
      contrastAndReadability: [],
      sectionsAudited: [],
      uxFlowObservations: [],
      recommendations: []
    };

    // -----------------------------------------------------------
    // 1. АУДИТ МОБИЛЬНОЙ ВЕРСИИ (375x812 - iPhone 13/14/15)
    // -----------------------------------------------------------
    console.log('📱 1. Аудит мобильного вьюпорта (375x812)...');
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    await page.goto(auditFindings.url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Проверка первого экрана выше линии сгиба (Fold Line: 812px)
    const mobileHeroMetrics = await page.evaluate(() => {
      const header = document.querySelector('.site-header')?.getBoundingClientRect();
      const hero = document.querySelector('.hero-section')?.getBoundingClientRect();
      const title = document.querySelector('.title-hero')?.getBoundingClientRect();
      const phone = document.querySelector('.header-phone')?.getBoundingClientRect();
      const circularCta = document.querySelector('.hero-circular-btn')?.getBoundingClientRect();
      const statusBadge = document.querySelector('.live-salon-status')?.getBoundingClientRect();
      const bikeImg = document.querySelector('.hero-implant-shift')?.getBoundingClientRect();
      const dock = document.querySelector('.mobile-quick-dock')?.getBoundingClientRect();

      return {
        headerHeight: header?.height,
        heroBottom: hero?.bottom,
        isTitleVisibleAboveFold: title ? title.bottom <= 812 : false,
        isPhoneVisibleAboveFold: phone ? phone.bottom <= 812 : false,
        isCtaVisibleAboveFold: circularCta ? circularCta.top < 812 : false,
        isBikeVisibleAboveFold: bikeImg ? bikeImg.top < 812 : false,
        isDockVisible: dock ? dock.height > 0 : false,
        dockHeight: dock?.height
      };
    });

    auditFindings.heroAboveFold.mobile = mobileHeroMetrics;
    console.log('  -> Метрики первого экрана на мобильном:', mobileHeroMetrics);

    // Скриншот мобильного первого экрана
    await page.screenshot({ path: path.join(outputDir, '01-mobile-hero-fold.jpg') });

    // Проверка кликабельных областей (Tap Targets Ergonomics)
    console.log('  -> Проверка эргономики тапов (Touch Targets >= 44x44px)...');
    const touchTargetIssues = await page.evaluate(() => {
      const interactiveEls = Array.from(document.querySelectorAll(
        'button, a, input, select, .chip-btn, .day-card-btn, .time-slot-btn, .matcher-style-chip, .calc-chip'
      ));

      const issues = [];
      interactiveEls.forEach(el => {
        if (el.offsetParent === null) return; // скрытый элемент
        const rect = el.getBoundingClientRect();
        const text = (el.innerText || el.getAttribute('aria-label') || el.name || '').trim().replace(/\n/g, ' ').slice(0, 35);
        if (rect.width > 0 && rect.height > 0) {
          // WCAG 2.5.5 Touch Target рекомендует от 44x44, минимально 40px
          if (rect.width < 40 || rect.height < 40) {
            issues.push({
              tag: el.tagName.toLowerCase(),
              text: text || '[иконка/без текста]',
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              recommendation: `Увеличить padding или min-height до 44px (сейчас ${Math.round(rect.height)}px)`
            });
          }
        }
      });
      return issues;
    });

    auditFindings.tapTargetsMobile = touchTargetIssues;
    console.log(`  -> Найдено мелких кликабельных зон на телефоне: ${touchTargetIssues.length}`);

    // Полный мобильный скриншот
    await page.screenshot({ path: path.join(outputDir, '02-mobile-fullpage.jpg'), fullPage: true });

    // -----------------------------------------------------------
    // 2. ДЕСКТОПНЫЙ АУДИТ (1440x900)
    // -----------------------------------------------------------
    console.log('\n💻 2. Аудит десктопного вьюпорта (1440x900)...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(auditFindings.url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Скриншот первого экрана десктопа
    await page.screenshot({ path: path.join(outputDir, '03-desktop-hero-fold.jpg') });

    // Скриншоты отдельных секций для детального визуального анализа
    const sectionIds = ['hero', 'about', 'services', 'first-visit', 'matcher', 'prices', 'calculator', 'reviews', 'booking', 'faq', 'contacts', 'footer'];
    console.log('  -> Снятие поблочных скриншотов для визуальной критики...');

    for (const secId of sectionIds) {
      const secEl = await page.$(`#${secId}`);
      if (secEl) {
        await secEl.screenshot({ path: path.join(outputDir, `sec-${secId}.jpg`) });
        auditFindings.sectionsAudited.push(secId);
      }
    }

    // Полный скриншот десктопа
    await page.screenshot({ path: path.join(outputDir, '04-desktop-fullpage.jpg'), fullPage: true });

    // -----------------------------------------------------------
    // 3. АНАЛИЗ ЦВЕТОВОГО КОНТРАСТА И ТИПОГРАФИКИ
    // -----------------------------------------------------------
    console.log('\n👁 3. Анализ контрастности и визуальной иерархии (WCAG & Anti-Slop)...');
    const typographyAudit = await page.evaluate(() => {
      const textElements = Array.from(document.querySelectorAll(
        '.title-hero, .manifesto-heading, .section-tag, .section-subtitle, .preview-summary, .price-row-name, .price-row-val, .calc-monthly-val, .footer-disclaimer, .hero-metadata-bar'
      ));

      return textElements.map(el => {
        const style = window.getComputedStyle(el);
        return {
          selector: el.className,
          textSample: el.innerText.slice(0, 30),
          color: style.color,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing
        };
      });
    });

    auditFindings.contrastAndReadability = typographyAudit;

    // Сохраняем полный отчёт в JSON
    const reportJsonPath = path.resolve('reports/design-audit-results.json');
    fs.writeFileSync(reportJsonPath, JSON.stringify(auditFindings, null, 2), 'utf-8');
    console.log(`\n✅ Аудит завершен. Данные сохранены в ${reportJsonPath}`);
    console.log(`📸 Скриншоты высокого разрешения сохранены в ${outputDir}`);

  } finally {
    if (browser) await browser.close();
    server.stop();
  }
}

runHumanDesignAudit().catch(err => {
  console.error('Ошибка дизайн-аудита:', err);
  process.exit(1);
});
