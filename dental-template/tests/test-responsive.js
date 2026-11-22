import { launchBrowser, ensurePreviewServer, PREVIEW_URL } from './helpers.js';

const VIEWPORTS = [
  { name: 'Mobile Compact (iPhone SE)', width: 375, height: 667 },
  { name: 'Mobile Standard (iPhone 14)', width: 390, height: 844 },
  { name: 'Tablet Portrait (iPad)', width: 768, height: 1024 },
  { name: 'Desktop Standard (1440px)', width: 1440, height: 900 }
];

async function testResponsive() {
  console.log('--- Running Test Suite: Responsive Layout & Zero Horizontal Scroll ---');
  const server = await ensurePreviewServer();
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(PREVIEW_URL, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 200));

      const { scrollWidth, innerWidth } = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth
        };
      });

      console.log(`[Viewport: ${vp.name}] innerWidth=${innerWidth}px, scrollWidth=${scrollWidth}px`);

      if (scrollWidth > innerWidth) {
        // Find offending element
        const overflowing = await page.evaluate((maxW) => {
          const elements = Array.from(document.querySelectorAll('*'));
          const bad = [];
          for (const el of elements) {
            const rect = el.getBoundingClientRect();
            if (rect.right > maxW + 1) {
              bad.push({
                tag: el.tagName,
                class: el.className,
                id: el.id,
                right: rect.right
              });
            }
          }
          return bad.slice(0, 5);
        }, innerWidth);

        console.error('Overflowing elements:', overflowing);
        throw new Error(`FAIL: Horizontal scroll detected on ${vp.name}! scrollWidth (${scrollWidth}) > innerWidth (${innerWidth})`);
      }
    }

    console.log('\n=== ALL VIEWPORTS HAVE ZERO HORIZONTAL SCROLL! (PASS) ===\n');
  } finally {
    await browser.close();
    server.stop();
  }
}

testResponsive().catch(err => {
  console.error('FAIL: testResponsive failed:', err);
  process.exit(1);
});
