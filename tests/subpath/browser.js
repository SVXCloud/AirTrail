import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { normalizeBasePath } from '../../scripts/subpath/base-path.js';

const origin = process.env.TEST_ORIGIN ?? 'http://localhost:3000';
const base = normalizeBasePath(process.env.BASE_PATH);

test(
  'browser loads mounted JavaScript, submits the form, and registers a scoped worker',
  { timeout: 45_000 },
  async () => {
    const browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    });
    try {
      const page = await browser.newPage();
      /** @type {string[]} */
      const failures = [];
      page.on('response', (response) => {
        const url = new URL(response.url());
        if (url.origin === origin && !url.pathname.startsWith(base + '/'))
          failures.push(url.pathname);
      });

      await page.goto(origin + base + '/login');
      await page.locator('input[name="username"]').fill('deploytest');
      await page.locator('input[name="password"]').fill('Deployment-test123!');
      const form = page.locator('form[action="' + base + '/api/users/login"]');
      const login = page.waitForResponse(
        (response) => response.url() === origin + base + '/api/users/login',
      );
      await form.locator('button[type="submit"]').click();
      assert.equal((await login).status(), 303);
      await page.waitForURL(
        (url) =>
          url.origin === origin && [base, base + '/'].includes(url.pathname),
      );
      const worker = await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        return {
          scope: registration.scope,
          worker: registration.active?.scriptURL,
        };
      });
      assert.deepEqual(worker, {
        scope: origin + base + '/',
        worker: origin + base + '/sw.js',
      });
      assert.deepEqual(failures, []);
    } finally {
      await browser.close();
    }
  },
);
