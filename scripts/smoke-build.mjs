import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium, expect } from '@playwright/test';

// Exercise the actual dist artifact under a subdirectory, without Vite's SPA fallback.
const root = resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith('/invitation/')) throw new Error('Outside test base');
    const path = resolve(root, decodeURIComponent(url.pathname.slice('/invitation/'.length)) || 'index.html');
    if (!path.startsWith(root + sep)) throw new Error('Outside dist');
    response.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
    response.end(await readFile(path));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
await mkdir('test-results', { recursive: true });
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [], requested = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { requested.push(response.url()); if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.addInitScript(() => { Object.defineProperty(navigator, 'canShare', { value: () => false }); });
  await page.goto(`http://127.0.0.1:${server.address().port}/invitation/?view=home`);
  await expect(page.locator('.scene-card img')).toHaveJSProperty('complete', true);
  await expect(page.getByRole('heading', { name: 'Ma3moora Halloween follow-up attempt' })).toBeVisible();
  expect(requested.some(url => url.includes('pumpkin-carvable.glb'))).toBe(false);
  await page.getByRole('button', { name: 'Back to pumpkin' }).click();
  await expect(page.locator('.pumpkin-viewport')).toHaveClass(/is-ready/);
  const box = await page.locator('.pumpkin-canvas').boundingBox();
  await page.mouse.move(box.x + box.width * .38, box.y + box.height * .48); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .62, box.y + box.height * .5, { steps: 20 }); await page.mouse.up();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save pumpkin' }).click();
  await (await downloading).saveAs('test-results/pumpkin-export.png');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Go to home', exact: true }).click();
  await expect(page.locator('.invitation-home')).toBeVisible();
  await page.waitForTimeout(1100);
  await page.screenshot({ path: 'test-results/production-home.png', fullPage: true });
  expect(errors).toEqual([]);
  console.log('Production subdirectory smoke passed: direct home, lazy 3D, carving, PNG export, return and all asset requests.');
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
