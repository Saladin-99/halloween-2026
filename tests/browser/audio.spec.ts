import { test, expect, type Page } from '@playwright/test';
import { installAmbientTracks, serveAmbientTrack } from './audioFixtures';
import { keys } from '../../src/lib/storage';

// Test both allowed autoplay and explicitly rejected automatic playback below.
test.use({ launchOptions: {
  executablePath: process.env.BROWSER_PATH || (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
} });

const filenames = ['alpha.mp3', 'beta.mp3', 'gamma.mp3'];
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = []; errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

async function installPlaylist(page: Page, files = filenames) {
  await installAmbientTracks(page, files);
  await page.addInitScript(() => {
    Math.random = () => .9;
    const original = HTMLMediaElement.prototype.play;
    (window as any).__songs = [];
    (window as any).__players = new Set();
    HTMLMediaElement.prototype.play = function () {
      (window as any).__player = this;
      (window as any).__players.add(this);
      (window as any).__songs.push(this.src.split('/').at(-1));
      return original.call(this);
    };
  });
}

async function finishTrack(page: Page, expectedPlays: number) {
  await page.evaluate(() => {
    const player = (window as any).__player as HTMLAudioElement;
    player.currentTime = player.duration - .02;
  });
  await expect.poll(() => page.evaluate(() => (window as any).__songs.length)).toBe(expectedPlays);
  await expect.poll(() => page.evaluate(() => (window as any).__player.readyState)).toBeGreaterThanOrEqual(3);
}

test('plays all tracks once per shuffled cycle using one player', async ({ page }) => {
  await installPlaylist(page); await page.goto('/?view=home');
  expect(await page.evaluate(() => (window as any).__songs)).toEqual([]);
  await page.getByRole('button', { name: 'Play music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  for (let i = 2; i <= 9; i++) await finishTrack(page, i);
  const songs = await page.evaluate(() => (window as any).__songs as string[]);
  for (let i = 0; i < 9; i += 3) expect(new Set(songs.slice(i, i + 3))).toEqual(new Set(filenames));
  expect(songs[2]).not.toBe(songs[3]); expect(songs[5]).not.toBe(songs[6]);
  expect(await page.evaluate(() => (window as any).__players.size)).toBe(1);
  expect(await page.evaluate(() => (window as any).__player.loop)).toBe(false);
});

test('track changes keep manual mute and navigation does not reset the cycle', async ({ page }) => {
  await installPlaylist(page); await page.goto('/?view=home');
  await page.getByRole('button', { name: 'Play music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mute music', exact: true }).click();
  await finishTrack(page, 2);
  expect(await page.evaluate(() => (window as any).__player.muted)).toBe(true);
  await page.getByRole('button', { name: 'Back to pumpkin', exact: true }).click();
  await page.getByRole('button', { name: 'Play music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__songs)).toEqual(['alpha.mp3', 'beta.mp3']);
  expect(await page.evaluate(() => (window as any).__player.muted)).toBe(false);
});

test('reload starts a new shuffle without restoring the previous cycle', async ({ page }) => {
  await installPlaylist(page);
  await page.addInitScript(() => {
    const visit = Number(sessionStorage.getItem('test-audio-loads') || '0');
    sessionStorage.setItem('test-audio-loads', String(visit + 1));
    Math.random = () => visit === 0 ? .9 : 0;
  });
  await page.goto('/?view=home');
  await page.getByRole('button', { name: 'Play music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  await finishTrack(page, 2);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__songs)).toEqual(['beta.mp3']);
  expect(await page.evaluate(key => localStorage.getItem(key), keys.mute)).toBe('false');
});

test('refresh while carving restores previously enabled music and its control', async ({ page }) => {
  await installPlaylist(page); await page.goto('/?view=home');
  await page.getByRole('button', { name: 'Play music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to pumpkin', exact: true }).click();
  await page.reload();
  await expect(page.locator('.pumpkin-stage')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__songs.length)).toBe(1);
});

test('refresh preserves intentional mute without starting playback on another interaction', async ({ page }) => {
  await installPlaylist(page); await page.goto('/?view=home');
  await page.getByRole('button', { name: 'Play music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mute music', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Play music', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try the moon', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__songs)).toEqual([]);
  expect(await page.evaluate(key => localStorage.getItem(key), keys.mute)).toBe('true');
});

for (const interaction of ['pointer', 'keyboard', 'sound-button'] as const) {
  test(`remembered sound retries blocked autoplay on ${interaction} without an accidental mute`, async ({ page }) => {
    await installPlaylist(page);
    await page.addInitScript(key => {
      localStorage.setItem(key, 'false');
      const original = HTMLMediaElement.prototype.play;
      (window as any).__restoreCalls = 0;
      HTMLMediaElement.prototype.play = function () {
        if (++(window as any).__restoreCalls === 1) return Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
        return original.call(this);
      };
    }, keys.mute);
    await page.goto('/?view=home');
    await expect(page.getByRole('button', { name: 'Tap to play music', exact: true })).toBeVisible();
    expect(await page.evaluate(() => (window as any).__restoreCalls)).toBe(1);
    expect(await page.evaluate(key => localStorage.getItem(key), keys.mute)).toBe('false');
    if (interaction === 'pointer') await page.getByRole('button', { name: 'Try the moon', exact: true }).click();
    else if (interaction === 'keyboard') {
      await page.getByRole('button', { name: 'Try the moon', exact: true }).focus();
      await page.keyboard.press('Enter');
    } else await page.getByRole('button', { name: 'Tap to play music', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
    expect(await page.evaluate(() => (window as any).__restoreCalls)).toBe(2);
    expect(await page.evaluate(() => (window as any).__player.muted)).toBe(false);
  });
}

test('an unreadable track is skipped without advancing twice', async ({ page }) => {
  await installPlaylist(page);
  await page.route('**/assets/audio/alpha.mp3', route => route.fulfill({ status: 404 }));
  await page.goto('/?view=home');
  await page.getByRole('button', { name: 'Play music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__songs)).toEqual(['alpha.mp3', 'beta.mp3']);
  await finishTrack(page, 3);
  expect(await page.evaluate(() => (window as any).__songs)).toEqual(['alpha.mp3', 'beta.mp3', 'gamma.mp3']);
});

test('all unreadable tracks stop retrying automatically and an explicit retry can recover', async ({ page }) => {
  await installPlaylist(page);
  let unavailable = true;
  await page.route('**/assets/audio/*.mp3', route => unavailable ? route.fulfill({ status: 404 }) : serveAmbientTrack(route));
  await page.goto('/?view=home');
  await page.getByRole('button', { name: 'Play music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tap to play music', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__songs.length)).toBe(3);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => (window as any).__songs.length)).toBe(3);
  unavailable = false;
  await page.getByRole('button', { name: 'Tap to play music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__songs.length)).toBe(4);
});

test('an empty audio folder leaves the invitation usable with a clear unavailable state', async ({ page }) => {
  await installPlaylist(page, []); await page.goto('/?view=home');
  await expect(page.getByRole('button', { name: 'Music coming soon' })).toBeDisabled();
  expect(await page.evaluate(() => (window as any).__songs)).toEqual([]);
  await expect(page.getByRole('link', { name: 'Maamoura Beach Main Gate (for cars) or Malahy Gate (for mowaslat)' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to pumpkin' }).click();
  await expect(page.locator('.pumpkin-stage')).toBeVisible();
});
