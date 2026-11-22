const fs = require('fs');
const path = require('path');
const { assessLead } = require('../scripts/lead-search-policy');

const FACTS_DIR = path.resolve(__dirname, '../data/facts');
const files = fs.readdirSync(FACTS_DIR).filter(f => f.endsWith('.json'));

const eligible = [];
const ineligibleWithChecks = [];
const unchecked = [];

for (const file of files) {
  const p = path.join(FACTS_DIR, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const assessment = assessLead(data);
  if (assessment.eligible) {
    eligible.push({ slug: data.slug, assessment });
  } else if (data.lead_search_checks) {
    ineligibleWithChecks.push({ slug: data.slug, reasons: assessment.reasons });
  } else {
    unchecked.push(data.slug);
  }
}

console.log('=== ELIGIBLE LEADS (' + eligible.length + ') ===');
eligible.forEach(e => {
  console.log(`- ${e.slug}: TG=${e.assessment.telegram_url}, Site=${e.assessment.website} (Status: ${e.assessment.website_status})`);
});

console.log('\n=== INELIGIBLE WITH CHECKS (' + ineligibleWithChecks.length + ') ===');
ineligibleWithChecks.forEach(e => {
  console.log(`- ${e.slug}: ${e.reasons.join('; ')}`);
});

console.log('\nUnchecked total:', unchecked.length);
