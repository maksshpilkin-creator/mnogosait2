const fs = require('fs');

const audit = JSON.parse(fs.readFileSync('reports/audit-websites.json', 'utf8'));
console.log('Sites in audit-websites.json:', audit.length);
audit.slice(0, 10).forEach(a => console.log(`${a.slug} (${a.city}): ${a.site}`));

// Also check data/businesses.csv
if (fs.existsSync('data/businesses.csv')) {
  const csv = fs.readFileSync('data/businesses.csv', 'utf8').trim().split('\n');
  console.log('\nRows in businesses.csv:', csv.length);
  const header = csv[0].split(';');
  console.log('Header:', header);
}
