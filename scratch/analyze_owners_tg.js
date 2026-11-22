const data = require('../sales/owners_telegram.json');

console.log('Total in owners_telegram.json:', data.length);
const withTg = data.filter(d => d.best_tg_entry);
console.log('With best_tg_entry:', withTg.length);

const grouped = {
  directUsername: [],
  phoneTg: [],
  botTg: []
};

for (const d of withTg) {
  const tg = d.best_tg_entry;
  if (tg.toLowerCase().includes('bot')) {
    grouped.botTg.push({ slug: d.slug, city: d.city, tg });
  } else if (tg.includes('+')) {
    grouped.phoneTg.push({ slug: d.slug, city: d.city, tg });
  } else {
    grouped.directUsername.push({ slug: d.slug, city: d.city, tg, name: d.name, website: d.website });
  }
}

console.log('\n--- Direct usernames (' + grouped.directUsername.length + ') ---');
grouped.directUsername.forEach((x, i) => console.log(`${i+1}. ${x.slug} (${x.city}) -> ${x.tg} [${x.website || 'нет сайта'}]`));

console.log('\n--- Phone TGs (' + grouped.phoneTg.length + ') ---');
grouped.phoneTg.slice(0, 10).forEach(x => console.log(`${x.slug} (${x.city}) -> ${x.tg}`));

console.log('\n--- Bot TGs (' + grouped.botTg.length + ') ---');
grouped.botTg.forEach(x => console.log(`${x.slug} (${x.city}) -> ${x.tg}`));
