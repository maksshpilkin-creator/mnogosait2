const cards = [
  {
    slug: 'sp-motors-yar',
    yandexUrl: 'https://yandex.ru/maps/org/sp_motors/203527200275/',
    twoGisUrl: 'https://2gis.ru/yaroslavl/firm/70000001094424645'
  },
  {
    slug: 'motosoyuz-nk',
    yandexUrl: 'https://yandex.ru/maps/org/motosoyuz/83103600904/',
    twoGisUrl: 'https://2gis.ru/novokuznetsk/firm/70000001083631233'
  },
  {
    slug: 'motoraion-irk',
    yandexUrl: 'https://yandex.ru/maps/org/motorayon/82364017365/',
    twoGisUrl: 'https://2gis.ru/irkutsk/firm/70000001059993140'
  },
  {
    slug: 'motorbike-vlg',
    yandexUrl: 'https://yandex.ru/maps/org/motosalon_motorbayk/1291955633/',
    twoGisUrl: 'https://2gis.ru/volgograd/firm/4644865396794088'
  }
];

async function checkWebsites() {
  for (const c of cards) {
    console.log(`\n=== Checking websites for ${c.slug} ===`);
    try {
      const yRes = await fetch(c.yandexUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const yHtml = await yRes.text();
      // Look for website links in Yandex
      const ySites = [...new Set(yHtml.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-z]{2,}(?:\/[^\s"']*)?/gi) || [])]
        .filter(u => !u.includes('yandex') && !u.includes('t.me') && !u.includes('schema.org') && !u.includes('w3.org'));
      console.log('Yandex sites:', ySites);
    } catch (e) {
      console.log('Yandex err:', e.message);
    }

    try {
      const gRes = await fetch(c.twoGisUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const gHtml = await gRes.text();
      const gSites = [...new Set(gHtml.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-z]{2,}(?:\/[^\s"']*)?/gi) || [])]
        .filter(u => !u.includes('2gis') && !u.includes('t.me') && !u.includes('schema.org') && !u.includes('w3.org'));
      console.log('2GIS sites:', gSites);
    } catch (e) {
      console.log('2GIS err:', e.message);
    }
  }
}

checkWebsites();
