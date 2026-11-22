const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { assessLead, directTelegramUrl } = require('../scripts/lead-search-policy');

const jsonPath = path.resolve(__dirname, '../sales/qualified_owners_telegram.json');
const csvPath = path.resolve(__dirname, '../sales/qualified_owners_telegram.csv');

const leads = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const csvText = fs.readFileSync(csvPath, 'utf8');

console.log('=== VERIFYING QUALIFIED LEADS ===');
console.log('Total leads:', leads.length);

assert.equal(leads.length, 9, 'Expected 9 qualified leads');

const csvLines = csvText.trim().split('\n');
assert.equal(csvLines.length, 10, 'CSV must have header + 9 rows');

for (const lead of leads) {
  console.log(`Checking ${lead.slug} (${lead.city})...`);
  assert(lead.best_tg_entry, `${lead.slug}: missing best_tg_entry`);
  assert(directTelegramUrl(lead.best_tg_entry), `${lead.slug}: invalid direct TG url`);
  assert(lead.telegram_role === 'administrator' || lead.telegram_role === 'owner', `${lead.slug}: invalid role`);
  assert(lead.telegram_map_url, `${lead.slug}: missing map URL`);
  assert(['found', 'not_found_in_checked_sources'].includes(lead.website_status), `${lead.slug}: invalid website status`);

  // Verify against card facts
  const factsPath = path.resolve(__dirname, `../data/facts/${lead.slug}.json`);
  const cardData = JSON.parse(fs.readFileSync(factsPath, 'utf8'));
  const assessment = assessLead(cardData);
  assert(assessment.eligible, `${lead.slug} failed assessLead: ${assessment.reasons.join('; ')}`);
  assert.equal(assessment.telegram_url, lead.best_tg_entry, `${lead.slug} telegram URL mismatch`);
  assert.equal(assessment.website_status, lead.website_status, `${lead.slug} website status mismatch`);
}

console.log('ALL 9 QUALIFIED LEADS FULLY VERIFIED AND PASS STRICT POLICY!');
