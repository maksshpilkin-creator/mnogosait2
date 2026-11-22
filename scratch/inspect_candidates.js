const handles = ['spmotors', 'motoraion38', 'motorbikeru', 'motosouznvkz'];

async function check() {
  for (const h of handles) {
    const res = await fetch(`https://t.me/${h}`);
    const t = await res.text();
    const title = (t.match(/<meta property="og:title" content="([^"]+)"/) || [])[1];
    const desc = (t.match(/<meta property="og:description" content="([^"]+)"/) || [])[1];
    const extra = (t.match(/<div class="tgme_page_extra">([^<]+)<\/div>/) || [])[1];
    console.log(`=== ${h} ===`);
    console.log('Title:', title);
    console.log('Extra:', extra ? extra.trim() : '');
    console.log('Desc:', desc);
    console.log('HTML contains "You can contact":', t.includes('You can contact'));
  }
}

check();
