import type { Page, Route } from '@playwright/test';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const demo = readFileSync(resolve('tests/fixtures/ambient.mp3'));

// Byte-range responses let real media seeking reach the actual end of a track.
export function serveAmbientTrack(route: Route) {
  const range = /^bytes=(\d+)-(\d*)$/.exec(route.request().headers().range || '');
  const start = range ? Number(range[1]) : 0;
  const end = range?.[2] ? Math.min(Number(range[2]), demo.length - 1) : demo.length - 1;
  if (start > end) return route.fulfill({ status: 416, headers: { 'content-range': `bytes */${demo.length}` } });
  const body = demo.subarray(start, end + 1);
  return route.fulfill({
    status: range ? 206 : 200, body, contentType: 'audio/mpeg',
    headers: { 'accept-ranges': 'bytes', 'content-length': String(body.length), ...(range ? { 'content-range': `bytes ${start}-${end}/${demo.length}` } : {}) },
  });
}

/** Published music can be replaced or removed without changing test fixtures. */
export async function installAmbientTracks(page: Page, files: string[]) {
  await page.route('**/*virtual:ambient-tracks*', route => route.fulfill({
    contentType: 'text/javascript', body: `export default ${JSON.stringify(files.map(file => `/assets/audio/${file}`))};`,
  }));
  await page.route('**/assets/audio/*.mp3', serveAmbientTrack);
}
