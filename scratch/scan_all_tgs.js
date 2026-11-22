const fs = require('fs');
const path = require('path');

const FACTS_DIR = path.resolve(__dirname, '../data/facts');
const files = fs.readdirSync(FACTS_DIR).filter(f => f.endsWith('.json'));

console.log('Total facts files:', files.length);

const results = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(FACTS_DIR, file), 'utf8');
  const slug = file.replace('.json', '');
  const tgs = [...new Set(content.match(/(?:t\.me|telegram\.me)\/[a-zA-Z0-9_+?=&]+/gi) || [])];
  if (tgs.length > 0) {
    results.push({ slug, tgs });
  }
}

console.log('Files with TG mentions:', results.length);
results.forEach(r => console.log(r.slug, '->', r.tgs.join(', ')));
