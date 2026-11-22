const fs = require('fs');

async function check2GIS(firmId) {
  const url = `https://2gis.ru/voronezh/firm/${firmId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const text = await res.text();
  const tgs = [...new Set(text.match(/(?:t\.me|telegram\.me)\/[a-zA-Z0-9_+]+/gi) || [])];
  const vk = [...new Set(text.match(/vk\.com\/[a-zA-Z0-9_.]+/gi) || [])];
  const phones = [...new Set(text.match(/\+7\s?\(?\d{3}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g) || [])];
  console.log('2GIS URL:', url);
  console.log('Telegram links:', tgs);
  console.log('VK links:', vk);
  console.log('Phones:', phones);
}

check2GIS('70000001081692097');
