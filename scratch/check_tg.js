const target = process.argv[2] || 'https://t.me/ponarinmx';

async function check(url) {
  const res = await fetch(url);
  const text = await res.text();
  const title = (text.match(/<meta property="og:title" content="([^"]+)"/) || [])[1];
  const extra = (text.match(/<div class="tgme_page_extra">([^<]+)<\/div>/) || [])[1];
  const desc = (text.match(/<meta property="og:description" content="([^"]+)"/) || [])[1];
  console.log('URL:', url);
  console.log('Title:', title);
  console.log('Extra:', extra ? extra.trim() : null);
  console.log('Desc:', desc);
}

check(target);
