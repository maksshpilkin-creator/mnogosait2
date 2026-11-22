const fs = require('fs');
const path = require('path');

const FACTS_DIR = path.resolve(__dirname, '../data/facts');
const testSlugs = [
  'moto-vektor-ufa', 'moto48-lipetsk', 'mototime-belgorod', 'planeta-moto-tver',
  'sp-motors-yar', 'ss-motors-vologda', 'susanin-kemerovo', 'tehnomoto-tambov',
  'triamoto-dzerzhinsk', 'tvoy-ekstrim-yoshkarola', 'u-pavla-kostroma',
  'virazh-novocherkassk', 'ya-moto-balashikha', 'zona-enduro-omsk',
  'redbike-anapa', 'riderschoice-domodedovo', 'rollingmoto-arkhangelsk',
  'drivemoto-kzn', 'azimut74-miass', 'megacross'
];

async function checkSlug(slug) {
  const p = path.join(FACTS_DIR, `${slug}.json`);
  if (!fs.existsSync(p)) return;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  const name = d.facts?.name || slug;
  const city = d.facts?.city || '';
  const yandexSource = (d.sources || []).find(s => s.id === 'yandex' || s.url?.includes('yandex'));
  const twoGisSource = (d.sources || []).find(s => s.id === '2gis' || s.url?.includes('2gis'));

  const foundTgs = [];

  if (yandexSource?.url) {
    try {
      const res = await fetch(yandexSource.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const t = await res.text();
      const tgs = [...new Set(t.match(/(?:t\.me|telegram\.me)\/[a-zA-Z0-9_]+/gi) || [])]
        .filter(x => !x.includes('mapsyandex') && !x.includes('/web'));
      if (tgs.length) foundTgs.push({ platform: 'yandex', tgs, url: yandexSource.url });
    } catch {}
  }

  if (twoGisSource?.url && twoGisSource.url.includes('/firm/')) {
    try {
      const res = await fetch(twoGisSource.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const t = await res.text();
      const tgs = [...new Set(t.match(/(?:t\.me|telegram\.me)\/[a-zA-Z0-9_]+/gi) || [])];
      if (tgs.length) foundTgs.push({ platform: '2gis', tgs, url: twoGisSource.url });
    } catch {}
  }

  console.log(`[${slug}] (${city}): found ${foundTgs.length} sources with TG`);
  for (const f of foundTgs) {
    console.log(`  -> ${f.platform}: ${f.tgs.join(', ')} (${f.url})`);
  }
}

async function run() {
  for (const slug of testSlugs) {
    await checkSlug(slug);
  }
}

run();
