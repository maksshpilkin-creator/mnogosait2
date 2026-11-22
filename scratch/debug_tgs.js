const handles = [
  'bike4you', 'drivemoto16', 'megacross_ru', 'MotonachinkaRyazan',
  'motoraion38', 'motorbikeru', 'motosouzz', 'motosouznvkz',
  'MultiMoto163', 'planet_moto', 'spmotors'
];

async function check() {
  for (const h of handles) {
    try {
      const res = await fetch(`https://t.me/${h}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const t = await res.text();
      const titleMatch = t.match(/<meta property="og:title" content="([^"]+)"/);
      const extraMatch = t.match(/<div class="tgme_page_extra">([^<]+)<\/div>/);
      const descMatch = t.match(/<meta property="og:description" content="([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : '';
      const extra = extraMatch ? extraMatch[1].trim() : '';
      const desc = descMatch ? descMatch[1] : '';
      console.log(`[${h}] HTTP ${res.status} | Title: "${title}" | Extra: "${extra}"`);
    } catch (e) {
      console.log(`[${h}] ERR: ${e.message}`);
    }
  }
}

check();
