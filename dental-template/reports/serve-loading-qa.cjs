// Local QA only: serves dist with delayed hero/font responses. Never shipped.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? Number(args[args.indexOf(name) + 1]) : fallback;
const port = option('--port', 4173);
const delay = option('--delay-ms', 1200);
const blockModules = args.includes('--block-js');
const root = path.resolve(__dirname, '../dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (blockModules && path.extname(target) === '.js') { res.writeHead(503).end('Simulated module failure'); return; }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404).end(); return; }
  const send = () => {
    if (res.destroyed) return;
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(target).pipe(res);
  };
  if (/hero-(?:gradient|implant)|\.(?:ttf|woff2)$/.test(pathname)) setTimeout(send, delay);
  else send();
});
server.listen(port, '127.0.0.1', () => console.log(`Loading QA: http://127.0.0.1:${port}/ (hero/font delay ${delay}ms, block modules ${blockModules})`));
