async function run() {
  const res = await fetch('https://2gis.ru/penza/firm/70000001066028415', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const t = await res.text();
  console.log('Includes ekstrim:', t.includes('экстрим') || t.includes('xn--58'));
  const links = t.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi) || [];
  const unique = [...new Set(links)].filter(l => !l.includes('2gis') && !l.includes('schema.org'));
  console.log('External links in 2GIS card:', unique);
}

run();
