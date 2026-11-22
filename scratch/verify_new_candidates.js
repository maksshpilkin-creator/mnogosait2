const slugs = ['sp-motors-yar', 'motosoyuz-nk', 'motoraion-irk', 'motorbike-vlg'];

async function checkSalons() {
  for (const slug of slugs) {
    console.log(`\n=================== ${slug} ===================`);
    const facts = require(`../data/facts/${slug}.json`);
    console.log(`Name: ${facts.facts.name}, City: ${facts.facts.city}, Address: ${facts.facts.address}`);
    
    // Check Yandex URL from sources
    const ySrc = facts.sources.find(s => s.id === 'yandex' || s.url?.includes('yandex'));
    if (ySrc) {
      console.log('Yandex search URL:', ySrc.url);
      try {
        const res = await fetch(ySrc.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const html = await res.text();
        const orgMatch = html.match(/yandex\.ru\/maps\/org\/[^/]+\/\d+/);
        console.log('  -> Yandex org match:', orgMatch ? orgMatch[0] : 'None');
        const tgMatch = html.match(/t\.me\/[a-zA-Z0-9_+]+/gi);
        console.log('  -> TG in Yandex:', tgMatch ? [...new Set(tgMatch)] : 'None');
        const siteMatch = html.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-z]{2,}(?:\/[^\s"']*)?/gi);
      } catch (e) {
        console.log('  -> Yandex fetch err:', e.message);
      }
    }

    // Check 2GIS search URL
    const gSrc = facts.sources.find(s => s.id === '2gis' || s.url?.includes('2gis'));
    if (gSrc) {
      console.log('2GIS search URL:', gSrc.url);
      try {
        const res = await fetch(gSrc.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const html = await res.text();
        const firmMatch = html.match(/\/firm\/\d+/);
        console.log('  -> 2GIS firm match:', firmMatch ? firmMatch[0] : 'None');
        const tgMatch = html.match(/t\.me\/[a-zA-Z0-9_+]+/gi);
        console.log('  -> TG in 2GIS:', tgMatch ? [...new Set(tgMatch)] : 'None');
      } catch (e) {
        console.log('  -> 2GIS fetch err:', e.message);
      }
    }
  }
}

checkSalons();
