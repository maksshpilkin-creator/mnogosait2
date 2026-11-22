const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'found_map_tgs.json'), 'utf8'));

console.log('Total salons with TG on maps:', data.length);

async function inspectAll() {
  const candidates = [];
  for (const item of data) {
    const rawTgs = [];
    for (const t of item.tgs) {
      for (const m of t.list) {
        const handle = m.replace(/^(?:https?:\/\/)?(?:t\.me|telegram\.me)\//i, '').replace(/^\+/, '');
        rawTgs.push({ handle, original: m, source: t.source, url: t.url });
      }
    }

    for (const entry of rawTgs) {
      // Check if phone or bot or handle
      if (/^\d+$/.test(entry.handle) || entry.handle.startsWith('+')) {
        console.log(`[${item.slug}] Phone TG skipped: ${entry.original}`);
        continue;
      }
      if (/bot$/i.test(entry.handle)) {
        console.log(`[${item.slug}] Bot TG skipped: ${entry.original}`);
        continue;
      }

      // Fetch Telegram status
      try {
        const res = await fetch(`https://t.me/${entry.handle}`);
        const html = await res.text();
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        const extraMatch = html.match(/<div class="tgme_page_extra">([^<]+)<\/div>/);
        const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
        const title = titleMatch ? titleMatch[1] : '';
        const extra = extraMatch ? extraMatch[1].trim() : '';
        const desc = descMatch ? descMatch[1] : '';

        const isChannel = extra.includes('subscribers') || extra.includes('members');
        const isUser = extra.startsWith('@') || desc.includes('You can contact');
        
        console.log(`[${item.slug}] ${entry.handle}: isChannel=${isChannel}, isUser=${isUser}, title="${title}", extra="${extra}"`);

        if (isUser && !isChannel) {
          candidates.push({
            slug: item.slug,
            city: item.city,
            name: item.name,
            handle: entry.handle,
            tgUrl: `https://t.me/${entry.handle}`,
            title,
            desc,
            mapSource: entry.source,
            mapUrl: entry.url
          });
        }
      } catch (e) {
        console.log(`[${item.slug}] Error checking ${entry.handle}: ${e.message}`);
      }
    }
  }

  console.log('\n=== QUALIFIED CANDIDATES FOUND ===');
  console.log(JSON.stringify(candidates, null, 2));
  fs.writeFileSync(path.resolve(__dirname, 'new_qualified_candidates.json'), JSON.stringify(candidates, null, 2));
}

inspectAll();
