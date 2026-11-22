const fs = require('fs');
const path = require('path');

const FACTS_DIR = path.resolve(__dirname, '../data/facts');
const DIST_DIR = path.resolve(__dirname, '../dist');

// 1. Local HTML demo sites in dist/
const distEntries = fs.readdirSync(DIST_DIR, { withFileTypes: true });
const demoSites = [];
for (const entry of distEntries) {
  if (entry.isDirectory() && entry.name !== '.vercel') {
    const indexPath = path.join(DIST_DIR, entry.name, 'index.html');
    if (fs.existsSync(indexPath)) {
      demoSites.push({
        slug: entry.name,
        localPath: indexPath,
        fileUrl: 'file:///' + indexPath.replace(/\\/g, '/')
      });
    }
  }
}

// 2. Business websites from data/facts/
const files = fs.readdirSync(FACTS_DIR).filter(f => f.endsWith('.json'));
const businessSites = [];
const noSites = [];

for (const file of files) {
  const p = path.join(FACTS_DIR, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const slug = data.slug;
  const name = data.facts?.name || slug;
  const city = data.facts?.city || '';
  
  // check website
  let site = null;
  if (data.lead_search_checks) {
    const ySite = data.lead_search_checks.maps?.yandex_maps?.website?.value;
    const gSite = data.lead_search_checks.maps?.two_gis?.website?.value;
    site = ySite || gSite;
  }
  if (!site && data.facts?.existing_website) {
    site = data.facts.existing_website;
    if (!site.startsWith('http')) site = 'https://' + site;
  }

  const hasWebsiteFlag = data.facts?.has_website;

  if (site && site !== 'нет сайта' && site !== 'null') {
    businessSites.push({ slug, name, city, site });
  } else {
    noSites.push({ slug, name, city });
  }
}

console.log(`Demo sites in dist: ${demoSites.length}`);
console.log(`Business sites with URL: ${businessSites.length}`);
console.log(`Businesses WITHOUT website: ${noSites.length}`);

// Output JSON for inspection
fs.writeFileSync(path.resolve(__dirname, 'all_sites_summary.json'), JSON.stringify({
  demoSitesCount: demoSites.length,
  businessSitesCount: businessSites.length,
  noSitesCount: noSites.length,
  businessSites,
  noSites
}, null, 2));
