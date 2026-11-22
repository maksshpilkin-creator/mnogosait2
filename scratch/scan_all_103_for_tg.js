const fs = require('fs');
const path = require('path');

const FACTS_DIR = path.resolve(__dirname, '../data/facts');
const files = fs.readdirSync(FACTS_DIR).filter(f => f.endsWith('.json'));

async function scanAll() {
  const found = [];
  for (const file of files) {
    const slug = file.replace('.json', '');
    const p = path.join(FACTS_DIR, file);
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (d.lead_search_checks) continue; // already checked

    const name = d.facts?.name || slug;
    const city = d.facts?.city || '';
    const yandexSource = (d.sources || []).find(s => s.id === 'yandex' || s.url?.includes('yandex'));
    const twoGisSource = (d.sources || []).find(s => s.id === '2gis' || s.url?.includes('2gis'));

    const item = { slug, name, city, yandexUrl: yandexSource?.url, twoGisUrl: twoGisSource?.url, tgs: [] };

    // Fetch yandex
    if (yandexSource?.url) {
      try {
        const res = await fetch(yandexSource.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(5000)
        });
        const t = await res.text();
        const matches = [...new Set(t.match(/(?:t\.me|telegram\.me)\/[a-zA-Z0-9_+]+/gi) || [])]
          .filter(x => !x.includes('mapsyandex') && !x.includes('/web'));
        if (matches.length) item.tgs.push({ source: 'yandex', list: matches, url: yandexSource.url });
      } catch (e) {}
    }

    // Fetch 2gis
    if (twoGisSource?.url && twoGisSource.url.includes('/firm/')) {
      try {
        const res = await fetch(twoGisSource.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(5000)
        });
        const t = await res.text();
        const matches = [...new Set(t.match(/(?:t\.me|telegram\.me)\/[a-zA-Z0-9_+]+/gi) || [])];
        if (matches.length) item.tgs.push({ source: '2gis', list: matches, url: twoGisSource.url });
      } catch (e) {}
    }

    if (item.tgs.length > 0) {
      console.log(`FOUND in [${slug}] (${city}):`, JSON.stringify(item.tgs));
      found.push(item);
    }
  }

  console.log(`\nScan finished. Total items with TG found on maps: ${found.length}`);
  fs.writeFileSync(path.resolve(__dirname, 'found_map_tgs.json'), JSON.stringify(found, null, 2));
}

scanAll();
