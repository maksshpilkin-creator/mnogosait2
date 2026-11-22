const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('sales/CALL_STATION.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim());
const context = { document: { addEventListener() {} } };
vm.runInNewContext(scripts[0] + '\n globalThis.snapshot = { leadsData };', context);
const leads = context.snapshot.leadsData;

console.log('Total leads in CALL_STATION:', leads.length);
const withSite = leads.filter(l => l.existingWebsite || l.extraWebsite);
const withoutSite = leads.filter(l => !l.existingWebsite && !l.extraWebsite);

console.log(`With website: ${withSite.length}`);
console.log(`Without website: ${withoutSite.length}`);

fs.writeFileSync('scratch/all_leads_websites.json', JSON.stringify({
  total: leads.length,
  withSiteCount: withSite.length,
  withoutSiteCount: withoutSite.length,
  withSite: withSite.map(l => ({
    slug: l.slug,
    name: l.name,
    city: l.city,
    website: l.existingWebsite || l.extraWebsite,
    hasWebsite: l.hasWebsite
  })),
  withoutSite: withoutSite.map(l => ({
    slug: l.slug,
    name: l.name,
    city: l.city
  }))
}, null, 2));
