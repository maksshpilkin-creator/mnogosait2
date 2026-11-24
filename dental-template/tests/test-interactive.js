import { launchBrowser, ensurePreviewServer, PREVIEW_URL } from './helpers.js';

async function testInteractive() {
  console.log('--- Running Test Suite: Interactive Mechanics & State Machines ---');
  const server = await ensurePreviewServer();
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(PREVIEW_URL, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 200));

    // 1. Services Hover & Master-Detail Switcher
    console.log('Testing Section 02 Services switcher...');
    const hygieneRow = await page.$('.service-item-row[data-service-id="hygiene"]');
    if (!hygieneRow) throw new Error('Hygiene service row not found');

    await hygieneRow.hover();
    await new Promise(r => setTimeout(r, 150));

    const activeCode = await page.$eval('.preview-code', el => el.textContent.trim());
    if (activeCode !== 'HG-02') {
      throw new Error(`Expected preview code to be 'HG-02', got '${activeCode}'`);
    }
    const isHygieneActive = await page.$eval('.service-item-row[data-service-id="hygiene"]', el => el.classList.contains('is-active'));
    if (!isHygieneActive) throw new Error('Hygiene row did not receive .is-active class on hover');
    console.log('✓ Service switcher updates preview card dynamically.');

    // 2. Price Drawer Modal Open & Close
    console.log('Testing Price Drawer Modal...');
    const detailBtn = await page.$('.btn-service-detail');
    await detailBtn.click();
    await new Promise(r => setTimeout(r, 200));

    let isDrawerOpen = await page.$eval('.price-drawer', el => el.classList.contains('is-open'));
    let isBodyLocked = await page.evaluate(() => document.body.classList.contains('modal-open'));
    if (!isDrawerOpen || !isBodyLocked) {
      throw new Error('Modal drawer failed to open or body failed to lock scroll');
    }

    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
      const drawer = document.querySelector('.price-drawer');
      return !document.body.classList.contains('modal-open')
        && getComputedStyle(drawer).display === 'none';
    });

    isDrawerOpen = await page.$eval('.price-drawer', el => el.classList.contains('is-open'));
    isBodyLocked = await page.evaluate(() => document.body.classList.contains('modal-open'));
    if (isDrawerOpen || isBodyLocked) {
      throw new Error('Modal drawer failed to close on Escape key');
    }
    console.log('✓ Price Drawer Modal opens, locks scroll, and closes cleanly on Escape.');

    // 3. FAQ Accordion Click & Toggling
    console.log('Testing FAQ Accordions...');
    const faqItem2 = await page.$('#faq .faq-item:nth-child(2)');
    const faqBtn2 = await faqItem2.$('.faq-header-btn');
    
    // Check initial closed state
    let isFaqOpen = await page.evaluate(el => el.classList.contains('is-open'), faqItem2);
    if (isFaqOpen) throw new Error('FAQ item 2 should be initially closed');

    // Click to open
    await faqBtn2.click();
    await new Promise(r => setTimeout(r, 150));

    isFaqOpen = await page.evaluate(el => el.classList.contains('is-open'), faqItem2);
    let ariaExpanded = await page.evaluate(el => el.getAttribute('aria-expanded'), faqBtn2);
    if (!isFaqOpen || ariaExpanded !== 'true') {
      throw new Error('FAQ item 2 failed to open on click');
    }

    // Click again to close
    await faqBtn2.click();
    await new Promise(r => setTimeout(r, 150));
    isFaqOpen = await page.evaluate(el => el.classList.contains('is-open'), faqItem2);
    if (isFaqOpen) throw new Error('FAQ item 2 failed to close on second click');
    console.log('✓ FAQ accordion opens, sets aria-expanded, and toggles on repeated click.');

    // 4. Booking Form Interactive Fields
    console.log('Testing Booking Form Interactive Fields...');
    // Click service chip "Хирургия"
    await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('.chip-btn'));
      const chip = chips.find(c => c.textContent.trim() === 'Хирургия');
      if (chip) chip.click();
    });

    const isSurgChipSelected = await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('.chip-btn'));
      const chip = chips.find(c => c.textContent.trim() === 'Хирургия');
      return chip?.classList.contains('is-selected');
    });
    if (!isSurgChipSelected) throw new Error('Chip «Хирургия» was not selected');

    // Select the tenth available day; dates follow the current Moscow calendar.
    await page.evaluate(() => {
      const days = Array.from(document.querySelectorAll('.day-card-btn'));
      const day = days[9];
      if (day) day.click();
    });
    const isDaySelected = await page.evaluate(() => {
      const days = Array.from(document.querySelectorAll('.day-card-btn'));
      const day = days[9];
      return day?.classList.contains('is-selected');
    });
    if (!isDaySelected) throw new Error('The tenth day card was not selected');

    // Click Time Slot 18:00–21:00
    await page.evaluate(() => {
      const slots = Array.from(document.querySelectorAll('.time-slot-btn'));
      const slot = slots.find(s => s.textContent.trim() === '18:00–21:00');
      if (slot) slot.click();
    });
    const isSlotSelected = await page.evaluate(() => {
      const slots = Array.from(document.querySelectorAll('.time-slot-btn'));
      const slot = slots.find(s => s.textContent.trim() === '18:00–21:00');
      return slot?.classList.contains('is-selected');
    });
    if (!isSlotSelected) throw new Error('Time slot «18:00–21:00» was not selected');

    // Test Phone Mask
    const phoneInput = await page.$('input[name="phone"]');
    await phoneInput.type('9001234567');
    const formattedPhone = await page.evaluate(el => el.value, phoneInput);
    if (formattedPhone !== '+7 (900) 123-45-67') {
      throw new Error(`Phone formatting mismatch: expected '+7 (900) 123-45-67', got '${formattedPhone}'`);
    }

    // Type Name & Submit
    const nameInput = await page.$('input[name="name"]');
    await nameInput.type('Константин');

    await page.click('input[name="consent"]');
    const submitBtn = await page.$('.btn-submit-booking');
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 200));

    const toastVisible = await page.$eval('.booking-toast', el => el.classList.contains('is-visible'));
    if (!toastVisible) throw new Error('Local draft result was not displayed');
    const result = await page.$eval('.booking-toast', el => el.textContent);
    if (!result.includes('Ничего не отправлено') || !result.includes('Константин')) throw new Error('Draft must explicitly say it was not sent and retain the entered data');
    const retainedName = await page.$eval('input[name="name"]', el => el.value);
    if (retainedName !== 'Константин') throw new Error('Draft preview must not clear user data');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.waitForFunction(() => document.documentElement.dataset.motion === 'reduced'
      && document.getAnimations().every(animation => animation.playState !== 'running'));
    const retainedReducedName = await page.$eval('input[name="name"]', el => el.value);
    if (retainedReducedName !== 'Константин') throw new Error('Changing the motion preference must preserve the draft');
    console.log('✓ Local draft preserves data, reports no delivery, and reduced-motion finishes effects.');

    console.log('\n=== ALL INTERACTIVE MECHANICS VERIFIED SUCCESSFULLY! ===\n');
  } finally {
    await browser.close();
    server.stop();
  }
}

testInteractive().catch(err => {
  console.error('FAIL: testInteractive failed:', err);
  process.exit(1);
});
