const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('reports/audit-websites.json', 'utf8'));
console.log('Total in audit-websites.json:', Array.isArray(data) ? data.length : Object.keys(data).length);
if (Array.isArray(data)) {
  console.log('Sample item:', data[0]);
} else {
  console.log('Keys:', Object.keys(data).slice(0, 10));
}
