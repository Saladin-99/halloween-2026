import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';
import { keys } from '../../src/lib/storage';
import { siteContent } from '../../src/config/siteContent';

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = []; browserErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
});
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]); });

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('.pumpkin-viewport')).toHaveClass(/is-ready/);
}
async function carve(page: Page, offset = 0) {
  const box = (await page.locator('.pumpkin-canvas').boundingBox())!;
  await page.mouse.move(box.x + box.width * .38, box.y + box.height * (.48 + offset));
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .62, box.y + box.height * (.5 + offset), { steps: 16 });
  await page.mouse.up();
}
async function saved(page: Page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), keys.pumpkin); }

test('entry is silent, first stroke reveals tools immediately, and carving remains open-ended', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    (window as any).__playCount = 0;
    HTMLMediaElement.prototype.play = function () { (window as any).__playCount++; return original.call(this); };
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  expect(await page.evaluate(() => (window as any).__playCount)).toBe(0);
  await expect(page.getByRole('button', { name: 'Enter the party', exact: true })).toBeHidden();
  const box = (await page.locator('.pumpkin-canvas').boundingBox())!;
  await page.mouse.move(box.x + box.width * .45, box.y + box.height * .48);
  await page.mouse.down();
  await expect(page.getByRole('button', { name: 'Enter the party', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Go to home', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Skip carving and open invitation', exact: true })).toHaveCount(0);
  await page.mouse.up();
  for (let i = 0; i < 10; i++) await carve(page, (i % 3) * .04);
  expect((await saved(page)).strokes.length).toBe(11);
  await expect(page.locator('.invitation-home')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('erase, undo, reset confirmation, pose and reload preserve the drawing correctly', async ({ page }) => {
  await ready(page); await carve(page);
  await page.getByRole('button', { name: 'Erase', exact: true }).click(); await carve(page);
  expect((await saved(page)).strokes.map((stroke: any) => stroke.tool)).toEqual(['carve', 'erase']);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect((await saved(page)).strokes.length).toBe(1);
  await page.getByRole('button', { name: 'Rotate', exact: true }).click();
  await page.getByRole('button', { name: 'Rotate right', exact: true }).click();
  const before = await saved(page);
  await page.reload(); await expect(page.locator('.pumpkin-viewport')).toHaveClass(/is-ready/);
  expect(await saved(page)).toEqual(before);
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect((await saved(page)).strokes.length).toBe(1);
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await page.getByRole('button', { name: 'Clear it', exact: true }).click();
  expect((await saved(page)).strokes).toHaveLength(0);
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Enter the party', exact: true })).toBeVisible();
});

test('two fingers and three-pointer changes never become accidental strokes on release', async ({ page, context }) => {
  await ready(page);
  const box = (await page.locator('.pumpkin-canvas').boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const point = (id: number, x: number, y: number) => ({ id, x: box.x + box.width * x, y: box.y + box.height * y });
  const touch = (type: string, points: { id: number; x: number; y: number }[]) => cdp.send('Input.dispatchTouchEvent', { type: type as any, touchPoints: points });
  await touch('touchStart', [point(1, .45, .48)]);
  await touch('touchMove', [point(1, .48, .50)]);
  await touch('touchStart', [point(1, .48, .50), point(2, .65, .5)]);
  await touch('touchMove', [point(1, .60, .55), point(2, .76, .55)]);
  await touch('touchStart', [point(1, .60, .55), point(2, .76, .55), point(3, .4, .4)]);
  await touch('touchEnd', [point(1, .60, .55), point(2, .76, .55)]);
  await touch('touchEnd', [point(1, .60, .55)]);
  await touch('touchMove', [point(1, .4, .5)]);
  await touch('touchEnd', []);
  const result = await saved(page);
  expect(result.strokes.length).toBe(1);
  expect(result.pose.yaw).not.toBeCloseTo(.16);
  await carve(page);
  expect((await saved(page)).strokes.length).toBe(2);
});

test('export contains a transparent square PNG of the carved model', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'canShare', { value: () => false }); });
  await ready(page); await carve(page);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save pumpkin', exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('my-ma3moora-pumpkin.png');
  const filename = (await download.path())!;
  const metadata = await sharp(filename).metadata();
  expect(metadata.width).toBe(1024); expect(metadata.height).toBe(1024); expect(metadata.hasAlpha).toBe(true);
  const { data, info } = await sharp(filename).raw().toBuffer({ resolveWithObject: true });
  expect(data[3]).toBe(0);
  expect(data[(512 * info.width + 512) * info.channels + 3]).toBe(255);
  await expect(page.getByRole('dialog', { name: 'Your pumpkin' })).toBeVisible();
});

test('first entry starts one audio instance; return preserves carving, time and manual mute', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    (window as any).__audio = [];
    HTMLMediaElement.prototype.play = function () { (window as any).__audio.push(this); return original.call(this); };
  });
  await ready(page); await carve(page);
  const drawing = await saved(page);
  await page.getByRole('button', { name: 'Enter the party', exact: true }).click();
  await expect(page.locator('.transition-overlay')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__audio.length)).toBe(1);
  await expect(page.locator('.invitation-home')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mute music', exact: true }).click();
  await page.getByRole('button', { name: 'Back to pumpkin', exact: true }).click();
  expect(await saved(page)).toEqual(drawing);
  await expect(page.getByRole('button', { name: 'Play music', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter the party', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Go to home', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Go to home', exact: true }).click();
  await expect(page.locator('.invitation-home')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__audio.length)).toBe(1);
  expect(await page.evaluate(() => (window as any).__audio[0].muted)).toBe(true);
  await page.getByRole('button', { name: 'Play music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute music', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__audio.length)).toBe(1);
  await page.goBack(); await expect(page.locator('.pumpkin-stage')).toBeVisible();
  await page.goForward(); await expect(page.locator('.invitation-home')).toBeVisible();
});

test('blocked audio shows a retry action and direct home never autoplays', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__playCount = 0;
    HTMLMediaElement.prototype.play = function () { (window as any).__playCount++; return Promise.reject(new DOMException('Blocked', 'NotAllowedError')); };
  });
  await page.goto('/?view=home');
  expect(await page.evaluate(() => (window as any).__playCount)).toBe(0);
  await page.getByRole('button', { name: 'Play music', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tap to play music', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tap to play music', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__playCount)).toBe(2);
});

test('home placeholders, hotspot dialogs, candy and gold secrets work without false invites', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.01; });
  await page.goto('/?view=home');
  await expect(page.getByRole('heading', { name: 'Ma3moora Halloween follow-up attempt' })).toBeVisible();
  await expect(page.getByText('TBD', { exact: true })).toHaveCount(2);
  await expect(page.getByText('Date dropping soon', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Where do i sign?' })).toBeDisabled();
  await page.getByRole('button', { name: 'What do you want to listen to?' }).click();
  await expect(page.getByText('Playlist invite coming soon')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to the playlist' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'See where it happens' }).click();
  await expect(page.getByRole('link', { name: 'Open in Google Maps' })).toHaveAttribute('rel', 'noopener noreferrer');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Try the moon' }).click();
  await expect(page.locator('.scene-card')).toHaveClass(/moonlit/);
  await page.getByRole('button', { name: 'Say hi' }).click();
  await expect(page.getByText('The real host.')).toBeVisible();
  // Stop the decorative fall at its current position to test an actual hit target.
  await page.locator('.gold-candy').evaluate((button: HTMLElement) => { button.style.animation = 'none'; button.style.top = '300px'; button.style.left = '5px'; });
  await page.getByRole('button', { name: 'You found something good.' }).click();
  await expect(page.getByText(siteContent.copy.environment.rareCandyMessages[0], { exact: true })).toBeVisible();
  await expect(page.locator('.gold-candy.popped')).toHaveCount(1);
});

for (const width of [320, 360, 390, 430]) {
  test(`complete square scene and readable controls fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    await page.goto('/?view=home');
    const scene = (await page.locator('.scene-card').boundingBox())!;
    expect(scene.width).toBeCloseTo(scene.height, 0);
    expect(scene.x).toBeGreaterThanOrEqual(0);
    expect(scene.x + scene.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('.scene-card img').evaluate((image: HTMLImageElement) => getComputedStyle(image).objectFit)).toBe('contain');
    await expect(page.locator('.scene-card img')).toHaveJSProperty('complete', true);
    await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
  });
}

test('WebGL unavailable and storage denied still allow entering the invitation', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: any, ...args: any[]): any {
      if (type === 'webgl2' || type === 'webgl') return null;
      return (original as any).call(this, type, ...args);
    };
    Storage.prototype.getItem = () => { throw new DOMException('Unavailable', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Unavailable', 'SecurityError'); };
  });
  await page.goto('/');
  await expect(page.getByText('Your invitation is ready. This device can skip the carving.')).toBeVisible();
  await page.getByRole('button', { name: 'Enter the party', exact: true }).click();
  await expect(page.locator('.invitation-home')).toBeVisible();
});

test('reduced motion and keyboard provide a direct accessible invitation path', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip carving and open invitation' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.invitation-home')).toBeVisible({ timeout: 1500 });
  await expect(page.locator('.candy-rain')).toHaveClass(/reduced/);
  expect(await page.locator('.falling-candy').count()).toBe(4);
  await page.getByRole('button', { name: 'What do you want to listen to?' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'What do you want to listen to?' })).toBeFocused();
});

test('mask paints only seam edges and retains a checkpoint beyond the undo limit', async ({ page }) => {
  await page.goto('/?view=home');
  const result = await page.evaluate(async () => {
    const { CarvingMask } = await import('/src/pumpkin/Mask.ts' as string);
    const mask = new CarvingMask();
    mask.begin('carve', .01); mask.sample([.99,.5]); mask.sample([.01,.5]); mask.commit();
    const ctx = mask.canvas.getContext('2d');
    const at = (x: number) => ctx.getImageData(x, 512, 1, 1).data[3];
    const seam = [at(0), at(512), at(1023)];
    for (let i = 0; i < 25; i++) { mask.begin('carve', .01); mask.sample([.3,.3]); mask.commit(); }
    for (let i = 0; i < 24; i++) mask.undo();
    return { seam, checkpoint: mask.hasCheckpoint, count: mask.strokes.length, retained: at(0), empty: at(512) };
  });
  expect(result.seam).toEqual([255, 0, 255]);
  expect(result.checkpoint).toBe(true); expect(result.count).toBe(0); expect(result.retained).toBe(255); expect(result.empty).toBe(0);
});

test('rotated rear can be carved and the two UV regions stay separate', async ({ page }) => {
  await ready(page); await carve(page);
  const front = (await saved(page)).strokes[0].points.filter(Boolean)[0][0];
  await page.getByRole('button', { name: 'Rotate', exact: true }).click();
  for (let i = 0; i < 10; i++) await page.getByRole('button', { name: 'Rotate right', exact: true }).click();
  await page.getByRole('button', { name: 'Carve', exact: true }).click(); await carve(page);
  const drawing = await saved(page);
  expect(drawing.strokes).toHaveLength(2);
  const rear = drawing.strokes[1].points.filter(Boolean)[0][0];
  expect(Math.abs(front - rear)).toBeGreaterThan(.3);
  await page.screenshot({ path: 'test-results/pumpkin-rear.png' });
});

test('file share is used when supported and rejected share falls back to download', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => {
      (window as any).__shared = { name: data.files?.[0].name, size: data.files?.[0].size, type: data.files?.[0].type };
    } });
  });
  await ready(page); await carve(page);
  await page.getByRole('button', { name: 'Save pumpkin', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__shared?.type)).toBe('image/png');
  const shared = await page.evaluate(() => (window as any).__shared);
  expect(shared.name).toBe('my-ma3moora-pumpkin.png'); expect(shared.size).toBeGreaterThan(10000);
  await page.evaluate(() => { Object.defineProperty(navigator, 'share', { value: () => Promise.reject(new DOMException('Blocked', 'NotAllowedError')) }); });
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save pumpkin', exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('my-ma3moora-pumpkin.png');
});

test('storage write restrictions do not interrupt carving or navigation', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await ready(page); await carve(page);
  await expect(page.getByText('Carving stays here for this visit; this browser can’t save it between visits.')).toBeVisible();
  await page.getByRole('button', { name: 'Enter the party', exact: true }).click();
  await expect(page.locator('.invitation-home')).toBeVisible();
  await page.getByRole('button', { name: 'Back to pumpkin', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled();
});

test('configured event and invite destinations activate without component edits', async ({ page }) => {
  const target = new Date(Date.now() + 90061000).toISOString();
  await page.route('**/src/config/siteContent.ts', async route => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace('partyStartsAtIso: null', `partyStartsAtIso: ${JSON.stringify(target)}`)
      .replace('whatsappGroupInviteUrl: ""', 'whatsappGroupInviteUrl: "https://chat.whatsapp.com/ExampleInvite1234567890"')
      .replace('spotifyPlaylistInviteUrl: "https://open.spotify.com"', 'spotifyPlaylistInviteUrl: "https://open.spotify.com/playlist/example?si=test&pt=example"')
      .replace('spotifyLinkStatus: "placeholder"', 'spotifyLinkStatus: "collaboration-invite"');
    await route.fulfill({ response, body });
  });
  await page.goto('/?view=home');
  await expect(page.getByText('TBD', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('timer')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Where do i sign?' })).toHaveAttribute('href', 'https://chat.whatsapp.com/ExampleInvite1234567890');
  await page.getByRole('button', { name: 'What do you want to listen to?' }).click();
  await expect(page.getByRole('link', { name: 'Add to the playlist' })).toHaveAttribute('href', /open\.spotify\.com\/playlist/);
});

test('elapsed configured event completes without negative countdown', async ({ page }) => {
  await page.route('**/src/config/siteContent.ts', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('partyStartsAtIso: null', 'partyStartsAtIso: "2020-01-01T00:00:00Z"') });
  });
  await page.goto('/?view=home');
  await expect(page.getByText('Tonight’s the night')).toBeVisible();
  await expect(page.getByRole('timer')).toHaveCount(0);
});

test('portrait carving keeps the pumpkin and tools inside a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await ready(page); await carve(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Save pumpkin', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Save pumpkin', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/carving-320.png', fullPage: true });
});
