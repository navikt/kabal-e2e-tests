import { test } from '@playwright/test';
import { UI_DOMAIN } from '@/tests/functions';

const YTELSER_REGEX = /Ytelser/;
const HJEMLER_REGEX = /Hjemler/;

test.describe('Innstillinger', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/innstillinger`);
  });

  test('"Innstillinger" laster og viser innstillinger', async ({ page }) => {
    await page.waitForURL('**/innstillinger');

    await Promise.all([
      page.getByRole('group', { name: YTELSER_REGEX }).waitFor(),
      page.getByRole('group', { name: HJEMLER_REGEX }).waitFor(),
    ]);
  });
});
