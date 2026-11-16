import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.RAQVOI_URL || 'http://localhost:5173';
if (!process.env.RAQVOI_PREVIEW_CODE) throw new Error('Set RAQVOI_PREVIEW_CODE locally; never commit it.');
const artifacts = path.resolve('tests/artifacts');
await fs.mkdir(artifacts, { recursive: true });
const profile = await fs.mkdtemp(path.join(artifacts, 'pwa-profile-'));
const context = await chromium.launchPersistentContext(profile, {
  executablePath: process.env.RAQVOI_CHROME || 'C:/Users/mkyou/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe',
  headless: true,
  viewport: { width: 1440, height: 1000 },
});
try {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  assert(await page.locator('#preview-access').isHidden());
  await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth > 0));
  await page.screenshot({ path: 'tests/artifacts/coming-soon-desktop.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: 'tests/artifacts/coming-soon-mobile.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (let count = 0; count < 4; count++) await page.getByRole('button', { name: 'RAQVOI', exact: true }).click();
  assert(await page.locator('#preview-access').isHidden());
  await page.getByRole('button', { name: 'RAQVOI', exact: true }).click();
  assert(await page.getByLabel('Six-digit access code').isVisible());
  await page.getByLabel('Six-digit access code').fill('000000');
  await page.getByRole('button', { name: 'Enter preview' }).click();
  assert(await page.getByLabel('Six-digit access code').isVisible());
  await page.getByText('Incorrect code. Please try again.').waitFor();
  console.log('Coming-soon page, five-click reveal and error recovery: PASS');
  await page.getByLabel('Six-digit access code').fill(process.env.RAQVOI_PREVIEW_CODE);
  await page.getByRole('button', { name: 'Enter preview' }).click();
  await page.locator('.brand img').waitFor();
  assert.match(await page.locator('.brand img').getAttribute('src'), /assets\/brand\/logo.png/);
  await page.waitForFunction(() => document.querySelector('.brand img')?.naturalWidth > 0);
  await page.locator('img').evaluateAll(images => images.forEach(image => image.loading = 'eager'));
  await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth > 0));
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await context.request.get(new URL(manifestUrl, base).href)).json();
  assert.equal(manifest.display, 'standalone');
  assert(manifest.icons.some(icon => icon.sizes === '192x192' && icon.purpose === 'any'));
  assert(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'any'));
  for (const icon of manifest.icons) assert((await context.request.get(new URL(icon.src, base).href)).ok());
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const cdp = await context.newCDPSession(page);
  const installability = await cdp.send('Page.getInstallabilityErrors');
  assert.deepEqual(installability.installabilityErrors, [], JSON.stringify(installability));
  console.log('Brand assets, manifest icons, worker control and Chromium installability: PASS');
  await page.getByRole('button', { name: 'Install RAQVOI app' }).click();
  // Headless browsers may offer browser instructions rather than a native prompt.
  await page.screenshot({ path: 'tests/artifacts/pwa-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector('.brand img')?.naturalWidth > 0);
  await page.locator('img').evaluateAll(images => images.forEach(image => image.loading = 'eager'));
  await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth > 0));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: 'tests/artifacts/pwa-mobile.png', fullPage: true });
  await context.clearCookies();
  await page.goto(base);
  assert(await page.locator('#preview-access').isHidden());
  await page.getByRole('button', { name: 'RAQVOI', exact: true }).click({ clickCount: 5 });
  assert(await page.getByLabel('Six-digit access code').isVisible());
  assert.equal((await context.request.get(base + '/src/main.ts')).status(), 401);
  assert.equal(await page.evaluate(async () => (await caches.keys()).length), 0);
  await context.setOffline(true);
  await page.reload();
  assert(await page.getByRole('heading', { name: 'You’re offline' }).isVisible());
  assert.equal(await page.locator('.site-header').count(), 0);
  assert.deepEqual(errors, []);
  console.log('Mobile layout, expired-session gate, no cached content and safe offline screen: PASS');
} finally {
  await context.close();
  if (path.dirname(profile) !== artifacts) throw new Error('Unexpected test profile path');
  await fs.rm(profile, { recursive: true, force: true });
}
