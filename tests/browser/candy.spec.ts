import { test, expect, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = []; errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

async function seed(page: Page, value = 0.5) {
  await page.addInitScript(value => { Math.random = () => value; }, value);
}

test('candy is spread across the full viewport including the center', async ({ page }) => {
  await seed(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?view=home');
  await expect(page.locator('.falling-candy')).toHaveCount(4);
  const xs = await page.locator('.falling-candy').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().x));
  expect(Math.min(...xs)).toBeLessThan(60);
  expect(Math.max(...xs)).toBeGreaterThan(280);
  expect(xs.filter(x => x > 100 && x < 270)).toHaveLength(2);
});

test('mouse drag moves a falling candy, resumes at the drop point and does not pop it', async ({ page }) => {
  await seed(page); await page.goto('/?view=home');
  await expect(page.locator('.falling-candy')).toHaveCount(8);
  const candy = page.locator('.falling-candy').nth(3);
  const id = await candy.getAttribute('data-candy-id');
  const target = page.locator(`[data-candy-id="${id}"]`);
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(target).toHaveClass(/held/);
  await page.mouse.move(250, 450, { steps: 12 });
  const held = (await target.boundingBox())!;
  expect(held.x + held.width / 2).toBeCloseTo(250, 0);
  expect(held.y + held.height / 2).toBeCloseTo(450, 0);
  await page.mouse.up();
  await expect(target).not.toHaveClass(/held|popped/);
  const dropped = (await target.boundingBox())!;
  expect(dropped.x + dropped.width / 2).toBeCloseTo(250, 0);
  await expect.poll(async () => (await target.boundingBox())!.y).toBeGreaterThan(dropped.y + 8);
  const moving = (await target.boundingBox())!;
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('data-candy-id'), { x: moving.x + moving.width / 2, y: moving.y + moving.height / 2 })).toBe(id);
  await page.mouse.click(moving.x + moving.width / 2, moving.y + moving.height / 2);
  await expect(target).toHaveClass(/popped/);
});

test('touch drag and pointer cancellation preserve the candy and leave page scrolling alone', async ({ page, context }) => {
  await seed(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?view=home');
  const candy = page.locator('.falling-candy').first();
  const id = await candy.getAttribute('data-candy-id');
  const target = page.locator(`[data-candy-id="${id}"]`);
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: x + 70, y: y + 80 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(target).not.toHaveClass(/held|popped/);
  const dropped = (await target.boundingBox())!;
  expect(dropped.x + dropped.width / 2).toBeCloseTo(x + 70, 0);
  expect(dropped.y + dropped.height / 2).toBeCloseTo(y + 80, 0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 2, x: x + 70, y: y + 80 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 2, x: x + 100, y: y + 100 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(target).not.toHaveClass(/held|popped/);
  // A fresh tap after cancellation still pops normally.
  const final = (await target.boundingBox())!;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 3, x: final.x + final.width / 2, y: final.y + final.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(target).toHaveClass(/popped/);
});

test('gold candy has a bright halo, distinct size and sparkles even with reduced motion', async ({ page }) => {
  await seed(page, .01); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?view=home');
  await expect(page.locator('.gold-candy')).toHaveCount(1);
  const gold = page.locator('.gold-candy');
  await expect(gold.locator('.gold-sparkles i')).toHaveCount(3);
  expect(await gold.locator('.candy-sprite').evaluate(element => parseFloat(getComputedStyle(element).width))).toBeGreaterThanOrEqual(42);
  expect(await gold.locator('.candy-sprite').evaluate(element => getComputedStyle(element).filter)).toContain('brightness(1.22)');
  expect(await gold.evaluate(element => getComputedStyle(element, '::before').backgroundImage)).toContain('radial-gradient');
  const id = await gold.getAttribute('data-candy-id');
  await page.waitForTimeout(100);
  expect(await gold.getAttribute('data-candy-id')).toBe(id);
  await page.screenshot({ path: 'test-results/candy-gold.png', fullPage: true });
});

test('pumpkin return stays fixed at the bottom left and matches the sound control', async ({ page }) => {
  await page.goto('/?view=home');
  const back = page.getByRole('button', { name: 'Back to pumpkin', exact: true });
  const before = (await back.boundingBox())!;
  expect(before.x).toBe(16);
  expect(before.y + before.height).toBe(844 - 16);
  expect(await back.evaluate(element => getComputedStyle(element).position)).toBe('fixed');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await back.boundingBox()).toEqual(before);
  const sound = (await page.locator('.sound-button').boundingBox())!;
  expect(sound.height).toBe(before.height); expect(sound.y).toBe(before.y);
  await back.click();
  await expect(page.locator('.pumpkin-stage')).toBeVisible();
});
