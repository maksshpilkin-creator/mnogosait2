const handles = ['planet_moto', 'spmotors', 'drivemoto16', 'megacross_ru', 'Exsport58', 'motoactiv', 'saratovmoto', 'motovelomir', 'motodomekb'];

async function test() {
  for (const h of handles) {
    try {
      const res = await fetch('https://t.me/' + h);
      const t = await res.text();
      const titleMatch = t.match(/<meta property="og:title" content="([^"]+)"/);
      const extraMatch = t.match(/<div class="tgme_page_extra">([^<]+)<\/div>/);
      const descMatch = t.match(/<meta property="og:description" content="([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : '';
      const extra = extraMatch ? extraMatch[1].trim() : '';
      const desc = descMatch ? descMatch[1] : '';
      console.log(`[${h}] Title: "${title}" | Extra: "${extra}" | Desc: "${desc}"`);
    } catch (e) {
      console.log(`[${h}] Error: ${e.message}`);
    }
  }
}

test();
