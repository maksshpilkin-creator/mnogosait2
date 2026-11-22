const fs = require('fs');
const path = require('path');

const FACTS_DIR = path.resolve(__dirname, '../data/facts');
const files = fs.readdirSync(FACTS_DIR).filter(f => f.endsWith('.json'));

console.log('Total facts files:', files.length);

async function scan() {
  const results = [];
  for (const file of files) {
    const slug = file.replace('.json', '');
    const p = path.join(FACTS_DIR, file);
    try {
      const d = JSON.parse(fs.readFileSync(p, 'utf8'));
      const leadCheck = d.lead_search_checks;
      const isEligible = leadCheck?.eligible === true;
      const existingTg = leadCheck?.telegram?.url;
      results.push({
        slug,
        city: d.facts?.city || '',
        name: d.facts?.name || '',
        hasLeadChecks: !!leadCheck,
        isEligible,
        existingTg
      });
    } catch (e) {
      console.log('Error reading', file, e.message);
    }
  }

  const eligible = results.filter(r => r.isEligible);
  const checked = results.filter(r => r.hasLeadChecks);
  console.log(`Checked: ${checked.length}/${results.length}, Eligible: ${eligible.length}`);
  eligible.forEach(e => console.log(`  - ${e.slug} (${e.city}): ${e.existingTg}`));
}

scan();
