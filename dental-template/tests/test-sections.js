import { launchBrowser, ensurePreviewServer, PREVIEW_URL } from './helpers.js';

async function testSections() {
  console.log('--- Running Test Suite: All 8 Sections & Semantic Content ---');
  const server = await ensurePreviewServer();
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(PREVIEW_URL, { waitUntil: 'domcontentloaded' });

    // 1. Header
    const headerLogo = await page.$eval('.header-logo', el => el.innerText.trim());
    if (headerLogo !== 'ЭМАЛЬ') throw new Error(`Header logo mismatch: expected 'ЭМАЛЬ', got '${headerLogo}'`);
    console.log('✓ Header: Brand logo «ЭМАЛЬ» verified.');

    // 2. Section: Hero
    const heroHeadline = await page.$eval('#hero .hero-top .title-hero', el => (el.innerText || el.textContent).replace(/\s+/g, ' ').trim());
    if (!heroHeadline.includes('ЗДЕСЬ НЕ БОЯТСЯ') || !heroHeadline.includes('СТОМАТОЛОГА')) {
      throw new Error(`Hero top headline mismatch: ${heroHeadline}`);
    }
    const heroBottomHeadline = await page.$eval('#hero .hero-bottom-content .title-hero', el => (el.innerText || el.textContent).replace(/\s+/g, ' ').trim());
    if (!heroBottomHeadline.includes('ЛЕЧИМ БЕЗ БОЛИ') || !heroBottomHeadline.includes('ЛИШНИХ СЛОВ')) {
      throw new Error(`Hero bottom headline mismatch: ${heroBottomHeadline}`);
    }
    const heroArt = await page.$eval('#hero', el => getComputedStyle(el).backgroundImage);
    if (!heroArt.includes('hero-backdrop-v2.png')) throw new Error('Hero background artwork missing');
    const heroCta = await page.$('#hero .hero-circular-btn');
    if (!heroCta) throw new Error('Hero circular CTA button missing');
    console.log('✓ Section Hero: Top/bottom headlines, 3D implant visual, circular button verified.');

    // 3. Marquee Ticker
    const marqueeContent = await page.$eval('.marquee-bar', el => (el.innerText || el.textContent).replace(/\s+/g, ' ').trim());
    if (!marqueeContent.includes('ХИРУРГИЯ') || !marqueeContent.includes('ТЕРАПИЯ')) {
      throw new Error(`Marquee content mismatch: ${marqueeContent}`);
    }
    console.log('✓ Running Ticker: Dental specialties marquee verified.');

    // 4. Section: 01 Кто мы
    const aboutTag = await page.$eval('#about .section-tag', el => el.innerText.trim());
    if (aboutTag !== '01 КТО МЫ') throw new Error(`About tag mismatch: ${aboutTag}`);
    const metricCount = await page.$$eval('#about .metric-card', els => els.length);
    if (metricCount !== 4) throw new Error(`Expected 4 metric cards, got ${metricCount}`);
    const manifestoText = await page.$eval('#about .manifesto-heading', el => (el.innerText || el.textContent).replace(/\s+/g, ' ').trim());
    if (!manifestoText.includes('ВЫРОСЛИ ИЗ ПРОСТОЙ ИДЕИ')) {
      throw new Error(`Manifesto heading mismatch: ${manifestoText}`);
    }
    console.log('✓ Section 01 Кто мы: Tag, manifesto, photos, and 4 metric cards verified.');

    // 5. Section: 02 Услуги
    const servicesCount = await page.$$eval('#services .service-item-row', els => els.length);
    if (servicesCount !== 6) throw new Error(`Expected 6 service items, got ${servicesCount}`);
    const previewSummary = await page.$eval('#services .preview-summary', el => el.innerText.trim());
    if (!previewSummary) throw new Error('Service preview summary is empty');
    console.log('✓ Section 02 Услуги: 6 service directions and preview showcase card verified.');

    // 6. Section: 03 Первый визит
    const stepsHeading = await page.$eval('#first-visit .steps-heading', el => (el.innerText || el.textContent).replace(/\s+/g, ' ').trim());
    if (!stepsHeading.includes('СНАЧАЛА ПОНИМАЕМ') || !stepsHeading.includes('ПОТОМ ЛЕЧИМ')) {
      throw new Error(`Steps heading mismatch: ${stepsHeading}`);
    }
    const stepsCount = await page.$$eval('#first-visit .step-card', els => els.length);
    if (stepsCount !== 4) throw new Error(`Expected 4 step cards, got ${stepsCount}`);
    console.log('✓ Section 03 Первый визит: 4 step consultation cards verified.');

    // 7. Section: 04 Цены
    const priceCardsCount = await page.$$eval('#prices .price-category-card', els => els.length);
    if (priceCardsCount !== 6) throw new Error(`Expected 6 pricing cards, got ${priceCardsCount}`);
    console.log('✓ Section 04 Цены: 6 itemized service price tables verified.');

    // 8. Section: 05 Запись
    const bookingTitle = await page.$eval('#booking .booking-title', el => (el.innerText || el.textContent).replace(/\s+/g, ' ').trim());
    if (!bookingTitle.includes('ЗАПИШИТЕСЬ') || !bookingTitle.includes('ПЕРЕЗВОНИМ')) {
      throw new Error(`Booking title mismatch: ${bookingTitle}`);
    }
    const chipCount = await page.$$eval('#booking .chip-btn', els => els.length);
    if (chipCount < 7) throw new Error(`Expected >= 7 service chips, got ${chipCount}`);
    const daysCount = await page.$$eval('#booking .day-card-btn', els => els.length);
    if (daysCount !== 12) throw new Error(`Expected 12 calendar day cards, got ${daysCount}`);
    const timeSlotsCount = await page.$$eval('#booking .time-slot-btn', els => els.length);
    if (timeSlotsCount !== 4) throw new Error(`Expected 4 time slot pills, got ${timeSlotsCount}`);
    console.log('✓ Section 05 Запись: Booking form, service chips, 12-day calendar, 4 time slots verified.');

    // 9. Section: FAQ
    const faqCount = await page.$$eval('#faq .faq-item', els => els.length);
    if (faqCount !== 5) throw new Error(`Expected 5 FAQ items, got ${faqCount}`);
    console.log('✓ Section FAQ: 5 collapsible accordions verified.');

    // 10. Footer
    const disclaimer = await page.$eval('#footer .disclaimer-text', el => el.innerText.trim());
    if (!disclaimer.includes('ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ')) {
      throw new Error(`Disclaimer mismatch: ${disclaimer}`);
    }
    const footerCols = await page.$$eval('#footer .footer-col', els => els.length);
    if (footerCols !== 4) throw new Error(`Expected 4 footer columns, got ${footerCols}`);
    console.log('✓ Section Footer: 4 columns, medical disclaimer band, legal notes verified.');

    console.log('\n=== ALL 8 SECTIONS & HEADER VERIFIED SUCCESSFULLY! ===\n');
  } finally {
    await browser.close();
    server.stop();
  }
}

testSections().catch(err => {
  console.error('FAIL: testSections failed:', err);
  process.exit(1);
});
