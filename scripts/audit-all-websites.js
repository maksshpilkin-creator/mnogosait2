const fs = require('fs');

const owners = Object.fromEntries(JSON.parse(fs.readFileSync('sales/owners_telegram.json','utf8')).map(o => [o.slug, o]));
const facts = fs.readdirSync('data/facts').filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync('data/facts/' + f, 'utf8')));

const candidates = [];
for (const f of facts) {
  const o = owners[f.slug] || {};
  let site = f.facts.existing_website || o.website || '';
  if (!site) continue;
  if (site.includes('2gis') || site.includes('yandex') || site.includes('spravk') || site.includes('auto2.info') || site.includes('dealer')) continue;
  if (!site.startsWith('http')) site = 'https://' + site;
  candidates.push({ slug: f.slug, name: f.facts.name, city: f.facts.city, site, o });
}

async function checkSite(c) {
  try {
    const res = await fetch(c.site, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' },
      signal: AbortSignal.timeout(3000)
    });
    const html = await res.text();
    const hasViewport = /name=["']viewport["']/i.test(html);
    const isWordpress = /wp-content/i.test(html);
    const isJoomla = /joomla/i.test(html);
    const isClientsSite = c.site.includes('clients.site');
    const isBitrix = /bitrix/i.test(html);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const hasModernYear = /202[4-6]/.test(html);

    return {
      slug: c.slug,
      name: c.name,
      city: c.city,
      site: c.site,
      status: res.status,
      hasViewport,
      cms: isClientsSite ? 'clients.site (авто-конструктор Яндекса)' : isJoomla ? 'Joomla' : isWordpress ? 'WordPress' : isBitrix ? 'Bitrix' : 'Самопис/Другое',
      noModernYear: !hasModernYear,
      title: title.slice(0, 50),
      tg: c.o.best_tg_entry,
      tier: c.o.contact_tier,
      personal_tg: c.o.personal_tg,
      salon_tg: c.o.salon_tg_direct || c.o.salon_tg,
      mobile: c.o.public_mobile || c.o.hidden_personal_phone,
      fns: c.o.fns_owner,
      htmlLength: html.length
    };
  } catch(e) {
    return {
      slug: c.slug,
      name: c.name,
      city: c.city,
      site: c.site,
      status: 'ERROR: ' + e.message,
      tg: c.o.best_tg_entry,
      tier: c.o.contact_tier,
      personal_tg: c.o.personal_tg,
      salon_tg: c.o.salon_tg_direct || c.o.salon_tg,
      mobile: c.o.public_mobile || c.o.hidden_personal_phone,
      fns: c.o.fns_owner
    };
  }
}

(async () => {
  const results = await Promise.all(candidates.map(checkSite));
  fs.writeFileSync('reports/audit-websites.json', JSON.stringify(results, null, 2), 'utf8');

  // Let's filter weak/old/broken sites
  const problems = results.filter(r => 
    typeof r.status === 'string' || 
    r.status >= 400 || 
    !r.hasViewport || 
    r.cms.includes('clients.site') || 
    r.cms === 'Joomla' ||
    (r.noModernYear && !r.cms.includes('Bitrix')) ||
    (r.htmlLength && r.htmlLength < 5000)
  );

  console.log(`TOTAL AUDITED: ${results.length}, WITH CLEAR ISSUES: ${problems.length}`);
  for (const p of problems) {
    console.log(`- [${p.slug}] ${p.name} (${p.city}) | Сайт: ${p.site} | Ошибка/CMS: ${p.status} / ${p.cms} | Viewport: ${p.hasViewport ? 'YES' : 'NO_MOBILE'} | TG: ${p.tg || p.mobile || 'нет'}`);
  }
})();
