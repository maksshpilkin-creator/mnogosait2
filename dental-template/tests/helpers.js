import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import http from 'http';

export const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const PREVIEW_PORT = 4173;
export const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}`;

export async function launchBrowser() {
  return await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1440,900'
    ]
  });
}

export function isServerRunning(port = PREVIEW_PORT) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}`, () => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

export async function ensurePreviewServer() {
  const running = await isServerRunning(PREVIEW_PORT);
  if (running) {
    return { process: null, stop: () => {} };
  }

  console.log(`Starting Vite preview server on port ${PREVIEW_PORT}...`);
  // Start preview server
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', String(PREVIEW_PORT)], {
    cwd: process.cwd(),
    stdio: 'ignore',
    shell: true
  });

  // Wait for server to respond
  let retries = 30;
  while (retries > 0) {
    await new Promise(r => setTimeout(r, 200));
    const ok = await isServerRunning(PREVIEW_PORT);
    if (ok) {
      console.log('Preview server is up and running.');
      return {
        process: preview,
        stop: () => {
          try {
            preview.kill();
          } catch (e) {}
        }
      };
    }
    retries--;
  }
  throw new Error('Failed to start Vite preview server in time.');
}
