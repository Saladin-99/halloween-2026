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

test('candy is spread across the full page width including the center', async ({ page }) => {
  await seed(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?view=home');
  await expect(page.locator('.falling-candy')).toHaveCount(4);
  const xs = await page.locator('.falling-candy').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().x));
  expect(Math.min(...xs)).toBeLessThan(60);
  expect(Math.max(...xs)).toBeGreaterThan(280);
  expect(xs.filter(x => x > 100 && x < 270)).toHaveLength(2);
});

test('scrolling moves candy with the page instead of pinning it to the viewport', async ({ page }) => {
  await seed(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/?view=home');
  const candy = page.locator('.falling-candy').first();
  await expect(page.locator('.falling-candy')).toHaveCount(4);
  const before = (await candy.boundingBox())!;
  const field = await page.locator('.candy-rain').boundingBox();
  const home = await page.locator('.invitation-home').boundingBox();
  expect(field).toEqual(home);
  expect(field!.height).toBeGreaterThan(600);
  await page.evaluate(() => window.scrollTo(0, 160));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(160);
  const after = (await candy.boundingBox())!;
  expect(after.y + 160).toBeCloseTo(before.y, 1);
  expect(after.x).toBeCloseTo(before.x, 1);
  expect(await candy.getAttribute('data-candy-id')).toBe('0');
});

test('candy falls below the first screen and follows the page bottom as content grows', async ({ page }) => {
  await seed(page); await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/?view=home');
  await expect(page.locator('.falling-candy')).toHaveCount(8);
  const candy = page.locator('.falling-candy').nth(3);
  const id = await candy.getAttribute('data-candy-id');
  const target = page.locator(`[data-candy-id="${id}"]`);
  await target.evaluate(element => {
    const fall = element.getAnimations().find(animation => (animation as CSSAnimation).animationName === 'candy-fall')!;
    const timing = fall.effect!.getTiming();
    fall.pause(); fall.currentTime = (timing.delay ?? 0) + Number(timing.duration) * .8;
  });
  const below = (await target.boundingBox())!;
  const height = await page.locator('.candy-rain').evaluate(element => element.clientHeight);
  expect(below.y).toBeGreaterThan(600);
  expect(below.y + below.height).toBeLessThan(height);
  await page.evaluate(y => window.scrollTo(0, y - 300), below.y);
  await expect(target).toBeInViewport();
  // Content reflow must update the fall boundary without tying it to scrolling.
  await page.locator('.home-actions').evaluate((element: HTMLElement) => { element.style.paddingBottom = '320px'; });
  await expect.poll(() => page.locator('.candy-rain').evaluate(element => element.clientHeight)).toBeGreaterThan(height + 300);
  const expandedHeight = await page.locator('.candy-rain').evaluate(element => element.clientHeight);
  await target.evaluate(element => {
    const fall = element.getAnimations().find(animation => (animation as CSSAnimation).animationName === 'candy-fall')!;
    const timing = fall.effect!.getTiming();
    fall.currentTime = (timing.delay ?? 0) + Number(timing.duration) - 1;
  });
  await expect.poll(() => target.evaluate(element => element.getBoundingClientRect().top + scrollY)).toBeGreaterThan(expandedHeight);
  await expect(target).toHaveCount(1);
  await target.evaluate(element => element.getAnimations().find(animation => (animation as CSSAnimation).animationName === 'candy-fall')!.finish());
  await expect(target).toHaveCount(0);
});

test('dragging on a scrolled page preserves the drop point and continues to the page bottom', async ({ page }) => {
  await seed(page); await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/?view=home');
  await expect(page.locator('.falling-candy')).toHaveCount(8);
  const candy = page.locator('.falling-candy').nth(3);
  const id = await candy.getAttribute('data-candy-id');
  const target = page.locator(`[data-candy-id="${id}"]`);
  await target.evaluate((element: HTMLElement) => {
    // Hold a known page position so pointerdown cannot race a falling sprite.
    element.style.animation = 'none'; element.style.top = '600px';
    element.style.left = 'calc(100% - 44px)';
  });
  await page.evaluate(() => window.scrollTo(0, 180));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(180);
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await expect(target).toHaveClass(/held/);
  await page.mouse.move(180, 300, { steps: 8 });
  // A scroll while held must not mix client coordinates with page coordinates.
  await page.evaluate(() => window.scrollBy(0, 80));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(260);
  await page.mouse.move(210, 340, { steps: 8 });
  const held = (await target.boundingBox())!;
  expect(held.x + held.width / 2).toBeCloseTo(210, 0);
  expect(held.y + held.height / 2).toBeCloseTo(340, 0);
  await page.mouse.up();
  await expect(target).not.toHaveClass(/held|popped/);
  const dropped = (await target.boundingBox())!;
  expect(dropped.x + dropped.width / 2).toBeCloseTo(210, 0);
  expect(dropped.y + dropped.height / 2).toBeCloseTo(340, 0);
  await expect.poll(async () => (await target.boundingBox())!.y).toBeGreaterThan(dropped.y + 8);
  const height = await page.locator('.candy-rain').evaluate(element => element.clientHeight);
  await target.evaluate(element => {
    const fall = element.getAnimations().find(animation => (animation as CSSAnimation).animationName === 'candy-fall')!;
    const timing = fall.effect!.getTiming();
    fall.pause(); fall.currentTime = Number(timing.duration) - 1;
  });
  expect(await target.evaluate(element => element.getBoundingClientRect().top + scrollY)).toBeGreaterThan(height);
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
  const grabbed = (await target.boundingBox())!;
  // The candy keeps falling between measuring its box and pointerdown. Preserve
  // the actual grab offset rather than assuming the pointer hit its exact center.
  const expectedX = 250 + grabbed.x + grabbed.width / 2 - (box.x + box.width / 2);
  const expectedY = 450 + grabbed.y + grabbed.height / 2 - (box.y + box.height / 2);
  await page.mouse.move(250, 450, { steps: 12 });
  const held = (await target.boundingBox())!;
  expect(held.x + held.width / 2).toBeCloseTo(expectedX, 0);
  expect(held.y + held.height / 2).toBeCloseTo(expectedY, 0);
  await page.mouse.up();
  await expect(target).not.toHaveClass(/held|popped/);
  const dropped = (await target.boundingBox())!;
  expect(dropped.x + dropped.width / 2).toBeCloseTo(expectedX, 0);
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
