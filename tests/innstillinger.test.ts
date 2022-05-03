import { expect, test } from '@playwright/test';
import { UI_DOMAIN, getParsedUrl } from './functions';

test.describe('Innstillinger', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${UI_DOMAIN}/innstillinger`);
  });

  test('"Innstillinger" laster og viser innstillinger', async ({ page }) => {
    const url = getParsedUrl(page.url());

    expect(url.pathname).toBe('/innstillinger');

    await page.waitForSelector('data-testid=typer-settings');
    await page.waitForSelector('data-testid=ytelser-settings');
    await page.waitForSelector('data-testid=hjemler-settings');
  });
});
